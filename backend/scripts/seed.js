require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Mongoose models
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const DiscountCode = require('../models/DiscountCode');

// Thư mục chứa các file JSON (docs/)
const DATA_DIR = path.join(__dirname, '..', 'docs');

function readJSON(filename) {
  const fullPath = path.isAbsolute(filename)
    ? filename
    : path.join(DATA_DIR, filename);

  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw);
}

// Random ngày sinh trong khoảng 1990 - 2005
function randomDateOfBirth() {
  const start = new Date(1990, 0, 1);  // 01/01/1990
  const end = new Date(2005, 11, 31);  // 31/12/2005

  const diff = end.getTime() - start.getTime();
  const randomTime = start.getTime() + Math.random() * diff;

  return new Date(randomTime); // Mongoose sẽ lưu kiểu Date
}

// Đảm bảo password đã hash, nếu chưa thì hash
const ensureHashedCustomers = async (raw = []) => {
  const out = [];
  for (const u of raw) {
    const copy = { ...u };

    // provider / name / avatar chuẩn hóa
    if (!copy.provider) copy.provider = 'local';

    copy.avatarUrl =
      copy.avatarUrl || copy.avatar || '/images/avatars/default.png';

    copy.fullName =
      copy.fullName ||
      copy.name ||
      `${copy.firstName || ''} ${copy.lastName || ''}`.trim();

    copy.name = copy.name || copy.fullName;

    // 🔹 Nếu chưa có dateOfBirth trong JSON thì random
    if (!copy.dateOfBirth) {
      copy.dateOfBirth = randomDateOfBirth();
    }

    const pwd = String(copy.password || '');
    const isHashed = pwd.startsWith('$2'); // bcrypt prefix

    // nếu không có password thì dùng '123456', rồi hash luôn
    copy.password = isHashed ? pwd : await bcrypt.hash(pwd || '123456', 10);

    out.push(copy);
  }
  return out;
};


// Đệ quy convert mọi object dạng { "$oid": "..." } → ObjectId
// và { "$date": "..." } → Date
function mapMongoIds(value) {
  const { ObjectId } = mongoose.Types;

  if (Array.isArray(value)) {
    return value.map(mapMongoIds);
  }

  if (value && typeof value === 'object') {
    // Dạng { "$oid": "..." }
    if (value.$oid) {
      return new ObjectId(value.$oid);
    }

    // Dạng { "$date": "..." }
    if (value.$date) {
      return new Date(value.$date);
    }

    const obj = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = mapMongoIds(v);
    }
    return obj;
  }

  return value;
}

async function seed() {
  // Ưu tiên MONGO_URI, fallback về MONGODB_URI + DATABASE_NAME
  const mongoUri =
    process.env.MONGO_URI ||
    (process.env.MONGODB_URI && process.env.DATABASE_NAME
      ? `${process.env.MONGODB_URI.replace(/\/$/, '')}/${process.env.DATABASE_NAME
      }`
      : 'mongodb://127.0.0.1:27017/CoffeeDB');

  console.log('🔗 Connecting to MongoDB:', mongoUri);

  await mongoose.connect(mongoUri);
  console.log('✅ Mongo connected');

  try {
    // Đọc data từ docs/
    const customersRaw = readJSON('customersList.json');
    const productsRaw = readJSON('productsList.json');
    const ordersRaw = readJSON('ordersList.json');
    const reviewsRaw = readJSON('reviewsList.json');

    let shippingRaw = [];
    try {
      shippingRaw = readJSON('shipping_activity_data.json');
    } catch (err) {
      console.warn(
        '⚠️  Không thấy shipping_activity_data.json, bỏ qua phần shipping activity.'
      );
    }

    let discountCodesRaw = [];
    try {
      discountCodesRaw = readJSON('discountCodes.json'); // hoặc 'discountCode.json' miễn khớp tên file
    } catch (err) {
      console.warn(
        '⚠️  Không thấy discountCodes.json, bỏ qua phần seed discount codes.'
      );
    }

    // Convert $oid / $date + map loyalty.points => currentPoints/totalEarned
    const customersMapped = customersRaw.map((raw) => {
      const mapped = mapMongoIds(raw);

      if (mapped.loyalty && typeof mapped.loyalty === 'object') {
        const pts = mapped.loyalty.points;
        if (typeof pts === 'number') {
          // đẩy vào đúng field schema
          if (mapped.loyalty.currentPoints == null) {
            mapped.loyalty.currentPoints = pts;
          }
          if (mapped.loyalty.totalEarned == null) {
            mapped.loyalty.totalEarned = pts;
          }
          // optional: xoá field cũ để code về sau đỡ rối
          delete mapped.loyalty.points;
        }
      }

      // nếu sau này em thêm dateOfBirth vào JSON dưới dạng string
      if (mapped.dateOfBirth && typeof mapped.dateOfBirth === 'string') {
        mapped.dateOfBirth = new Date(mapped.dateOfBirth);
      }

      return mapped;
    });

    const customers = await ensureHashedCustomers(customersMapped);


    const products = productsRaw.map(mapMongoIds);
    const orders = ordersRaw.map(mapMongoIds);
    const reviews = reviewsRaw.map(mapMongoIds);
    const shipping = shippingRaw.map(mapMongoIds);
    const discountCodes = discountCodesRaw.map(mapMongoIds);

    // Xoá data cũ
    await Promise.all([
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      DiscountCode.deleteMany({}), // 👈 thêm
    ]);
    console.log('🧹 Đã xoá Customer, Product, Order, Review, DiscountCode cũ');


    if (shipping.length) {
      await mongoose.connection
        .collection('shipping_activity_data')
        .deleteMany({});
      console.log('🧹 Đã xoá collection shipping_activity_data cũ');
    }

    const insertedCustomers = await Customer.insertMany(customers);
    console.log(`👤 Inserted ${insertedCustomers.length} customers`);

    const insertedProducts = await Product.insertMany(products);
    console.log(`☕ Inserted ${insertedProducts.length} products`);

    const insertedOrders = await Order.insertMany(orders);
    console.log(`📦 Inserted ${insertedOrders.length} orders`);

    const insertedReviews = await Review.insertMany(reviews);
    console.log(`⭐ Inserted ${insertedReviews.length} reviews`);

    if (discountCodes.length) {
      const insertedCodes = await DiscountCode.insertMany(discountCodes);
      console.log(`🏷️  Inserted ${insertedCodes.length} discount codes`);
    } else {
      console.log('🏷️  Không có discount codes để seed');
    }

    if (shipping.length) {
      const res = await mongoose.connection
        .collection('shipping_activity_data')
        .insertMany(shipping);
      console.log(`🚚 Inserted ${res.insertedCount} shipping activity docs`);
    }


    console.log('✅ SEED HOÀN TẤT OK');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Mongo disconnected');
  }
}

seed();
