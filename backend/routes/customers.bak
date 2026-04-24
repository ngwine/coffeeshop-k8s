// backend/routes/customers.js
const express = require('express');
const mongoose = require('mongoose');
const { Types } = mongoose;
const Customer = require('../models/Customer');
const Order = require('../models/Order');

const router = express.Router();

/**
 * Helper: convert Mongoose doc or plain object về plain object
 */
function toPlain(doc) {
  return doc && doc.toObject ? doc.toObject() : doc;
}

/**
 * Helper: tìm customer theo id/email và trả về cả vị trí lưu (db/collection/model)
 */
async function findCustomerWithLocation(id) {
  let customer = null;
  let location = null;

  // Try 1: 'customers' database > 'customersList' collection
  try {
    const customersDb = mongoose.connection.useDb('customers', {
      useCache: true,
    });
    const coll = customersDb.collection('customersList');
    if (Types.ObjectId.isValid(id)) {
      customer = await coll.findOne({ _id: new Types.ObjectId(id) });
    }
    if (!customer) {
      customer = await coll.findOne({ email: id.toLowerCase() });
    }
    if (customer) {
      location = {
        type: 'database',
        dbName: 'customers',
        collection: 'customersList',
        db: customersDb,
        coll,
      };
      return { customer, location };
    }
  } catch (err) {
  }

  // Try 2: Current database > 'customersList' collection
  try {
    const coll = mongoose.connection.db.collection('customersList');
    if (Types.ObjectId.isValid(id)) {
      customer = await coll.findOne({ _id: new Types.ObjectId(id) });
    }
    if (!customer) {
      customer = await coll.findOne({ email: id.toLowerCase() });
    }
    if (customer) {
      location = {
        type: 'current',
        dbName: mongoose.connection.db.databaseName,
        collection: 'customersList',
        db: mongoose.connection.db,
        coll,
      };
      return { customer, location };
    }
  } catch (err) {
  }

  // Try 3: Current database > 'customers.customersList' collection
  try {
    const coll = mongoose.connection.db.collection('customers.customersList');
    if (Types.ObjectId.isValid(id)) {
      customer = await coll.findOne({ _id: new Types.ObjectId(id) });
    }
    if (!customer) {
      customer = await coll.findOne({ email: id.toLowerCase() });
    }
    if (customer) {
      location = {
        type: 'current',
        dbName: mongoose.connection.db.databaseName,
        collection: 'customers.customersList',
        db: mongoose.connection.db,
        coll,
      };
      return { customer, location };
    }
  } catch (err) {
  }

  // Try 4: Current database > 'customers' collection
  try {
    const coll = mongoose.connection.db.collection('customers');
    if (Types.ObjectId.isValid(id)) {
      customer = await coll.findOne({ _id: new Types.ObjectId(id) });
    }
    if (!customer) {
      customer = await coll.findOne({ email: id.toLowerCase() });
    }
    if (customer) {
      location = {
        type: 'current',
        dbName: mongoose.connection.db.databaseName,
        collection: 'customers',
        db: mongoose.connection.db,
        coll,
      };
      return { customer, location };
    }
  } catch (err) {
  }

  // Fallback: Mongoose Customer model
  try {
    if (Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id);
    }
    if (!customer) {
      customer = await Customer.findOne({ email: id.toLowerCase() });
    }
    if (customer) {
      location = { type: 'model', model: Customer };
      return { customer, location };
    }
  } catch (err) {
  }

  return { customer: null, location: null };
}

// Diagnostics: quick connectivity check
router.get('/ping', async (req, res) => {
  try {
    // Filter admin khỏi total count
    const total = await Customer.countDocuments({ role: { $ne: 'admin' } });
    const sample = await Customer.findOne({ role: { $ne: 'admin' } });
    return res.json({ ok: true, total, sample });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Get new users count (users created in the last 7 days, excluding admin)
router.get('/stats/new-users', async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7; // Default 7 days

    // Tính thời điểm bắt đầu (N ngày trước, set về 00:00:00 để chính xác)
    const now = new Date();
    const daysAgo = new Date(now);
    daysAgo.setDate(daysAgo.getDate() - days);
    daysAgo.setHours(0, 0, 0, 0); // Set về đầu ngày (00:00:00)

    // Filter: không phải admin (role !== 'admin' hoặc không có role field)
    // Vì có thể có dữ liệu cũ không có role field
    const filter = {
      $or: [
        { role: { $ne: 'admin' } },
        { role: { $exists: false } } // Dữ liệu cũ không có role field
      ],
      createdAt: { $gte: daysAgo }
    };

    // Count customers created in the last N days, excluding admin
    const newUsersCount = await Customer.countDocuments(filter);

    // Debug: lấy một vài sample để kiểm tra
    const sample = await Customer.find(filter)
      .select('email createdAt role')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,
      newUsers: newUsersCount,
      days,
      fromDate: daysAgo.toISOString(),
      toDate: now.toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/customers
 * Query: q (text search), page, limit
 * - Ưu tiên DB 'customers' > customersList
 * - Rồi tới các collection khác trong DB hiện tại
 * - Cuối cùng fallback qua Customer model
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    const { q } = req.query;
    const filters = {};

    // Loại trừ admin khỏi customer list
    filters.role = { $ne: 'admin' };

    if (q && typeof q === 'string') {
      filters.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    let items = [];
    let total = 0;

    // Try 1: Current database (CoffeeDB) > 'customers' collection (ưu tiên cao nhất)
    try {
      [items, total] = await Promise.all([
        Customer.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Customer.countDocuments(filters),
      ]);
      if (total > 0) {
      }
    } catch (err) {
    }

    // Try 2: current DB > 'customersList' (fallback)
    if (total === 0) {
      try {
        const coll = mongoose.connection.db.collection('customersList');
        const totalCount = await coll.countDocuments({});
        if (totalCount > 0) {
          [items, total] = await Promise.all([
            coll
              .find(filters)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .toArray(),
            coll.countDocuments(filters),
          ]);

          if (total === 0 && totalCount > 0) {
            // Fallback query vẫn phải filter admin
            const fallbackFilter = { role: { $ne: 'admin' } };
            [items, total] = await Promise.all([
              coll
                .find(fallbackFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
              coll.countDocuments(fallbackFilter),
            ]);
          }
          if (total > 0) {
            console.log(`✅ Found ${total} customers in CoffeeDB.customersList collection`);
          }
        }
      } catch (err) {
      }
    }

    // Try 3: current DB > 'customers.customersList' (fallback)
    if (total === 0) {
      try {
        const coll = mongoose.connection.db.collection(
          'customers.customersList'
        );
        const totalCount = await coll.countDocuments({});
        if (totalCount > 0) {
          [items, total] = await Promise.all([
            coll
              .find(filters)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .toArray(),
            coll.countDocuments(filters),
          ]);

          if (total === 0 && totalCount > 0) {
            // Fallback query vẫn phải filter admin
            const fallbackFilter = { role: { $ne: 'admin' } };
            [items, total] = await Promise.all([
              coll
                .find(fallbackFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
              coll.countDocuments(fallbackFilter),
            ]);
          }
          if (total > 0) {
            console.log(`✅ Found ${total} customers in CoffeeDB.customers.customersList collection`);
          }
        }
      } catch (err) {
      }
    }

    // Try 4: 'customers' database > 'customersList' collection (fallback)
    if (total === 0) {
      try {
        const customersDb = mongoose.connection.useDb('customers', {
          useCache: true,
        });
        const coll = customersDb.collection('customersList');
        const totalCount = await coll.countDocuments({});
        if (totalCount > 0) {
          [items, total] = await Promise.all([
            coll
              .find(filters)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .toArray(),
            coll.countDocuments(filters),
          ]);

          // Nếu filter không ra nhưng collection có data thì trả full list (vẫn filter admin)
          if (total === 0 && totalCount > 0) {
            const fallbackFilter = { role: { $ne: 'admin' } };
            [items, total] = await Promise.all([
              coll
                .find(fallbackFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
              coll.countDocuments(fallbackFilter),
            ]);
          }
          if (total > 0) {
            console.log(`✅ Found ${total} customers in customers.customersList collection`);
          }
        }
      } catch (err) {
      }
    }

    // Fallback cuối: Customer model (đã được require ở đầu file)
    if (total === 0) {
      try {
        [items, total] = await Promise.all([
          Customer.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Customer.countDocuments(filters),
        ]);
        if (total > 0) {
          console.log(`✅ Found ${total} customers in CoffeeDB.customers collection (fallback)`);
        }
      } catch (err) {
      }
    }

    const transformed = items.map((item) => {
      const c = toPlain(item); // để xử lý cả doc Mongoose và plain object

      return {
        _id: c._id ? String(c._id) : undefined,
        id: String(c._id || c.id),
        fullName:
          c.fullName ||
          [c.firstName, c.lastName].filter(Boolean).join(' '),
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        avatarUrl: c.avatarUrl,
        status: c.status || 'active',
        phone: c.phone,
        gender: c.gender || 'other',
        // 👇 ngày sinh cho FE, nếu chưa có thì null
        dateOfBirth: c.dateOfBirth || null,
        country:
          c.country ||
          c.addresses?.[0]?.country ||
          c.address?.country ||
          c.billingAddress?.country ||
          c.shippingAddress?.country,
        addresses: c.addresses || [],
        address: c.address,
        billingAddress: c.billingAddress,
        shippingAddress: c.shippingAddress,
        loyalty: c.loyalty,
        wishlist: c.wishlist || [],
        consents: c.consents,
        preferences: c.preferences,
        createdAt: c.createdAt || null,
        updatedAt: c.updatedAt || null,
        lastLoginAt: c.lastLoginAt || null,
        tags: c.tags || [],
        notes: c.notes || '',
      };
    });

    res.json({
      success: true,
      data: transformed,
      items: transformed, // FE đang dùng items, data để backward compat cũng là array
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: err.message,
    });
  }
});

/**
 * GET /api/customers/:id
 * - Hỗ trợ tìm theo ObjectId hoặc email
 * - Dùng helper findCustomerWithLocation + trả về nhiều field
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { customer } = await findCustomerWithLocation(id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    const c = toPlain(customer);
    const transformed = {
      _id: c._id ? String(c._id) : undefined,
      id: String(c._id || c.id),
      fullName:
        c.fullName ||
        [c.firstName, c.lastName].filter(Boolean).join(' '),
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      avatarUrl: c.avatarUrl,
      status: c.status || 'active',
      phone: c.phone,
      gender: c.gender || 'other',
      country:
        c.country ||
        c.addresses?.[0]?.country ||
        c.address?.country ||
        c.billingAddress?.country ||
        c.shippingAddress?.country,
      addresses: c.addresses || [],
      address: c.address,
      billingAddress: c.billingAddress,
      shippingAddress: c.shippingAddress,
      loyalty: c.loyalty,
      wishlist: c.wishlist || [],
      consents: c.consents,
      preferences: c.preferences,
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
      lastLoginAt: c.lastLoginAt || null,
      tags: c.tags || [],
      notes: c.notes || '',
    };

    res.json({ success: true, data: transformed });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: err.message,
    });
  }
});

/**
 * GET /api/customers/:id/orders
 * - Lấy orders theo customerId/email, ghép nhiều DB/collection
 */
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    // Resolve email nếu có thể
    let customerEmail = null;
    if (id.includes('@')) {
      customerEmail = id.toLowerCase();
    } else if (Types.ObjectId.isValid(id)) {
      // Thử lấy customer từ nhiều nơi như detail endpoint
      try {
        const objId = new Types.ObjectId(id);
        let c = null;

        try {
          const customersDb = mongoose.connection.useDb('customers', {
            useCache: true,
          });
          c = await customersDb
            .collection('customersList')
            .findOne({ _id: objId });
        } catch { }

        if (!c) {
          try {
            c = await mongoose.connection.db
              .collection('customersList')
              .findOne({ _id: objId });
          } catch { }
        }

        if (!c) {
          try {
            c = await mongoose.connection.db
              .collection('customers.customersList')
              .findOne({ _id: objId });
          } catch { }
        }

        if (!c) {
          try {
            c = await mongoose.connection.db
              .collection('customers')
              .findOne({ _id: objId });
          } catch { }
        }

        if (!c) {
          c = await Customer.findById(id).lean().catch(() => null);
        }

        if (c?.email) {
          customerEmail = String(c.email).toLowerCase();
        }
      } catch { }
    }

    // Build filters - search by cả customerId và customerEmail
    const filters = [];
    if (Types.ObjectId.isValid(id)) {
      filters.push({ customerId: new Types.ObjectId(id) });
      filters.push({ customerId: String(id) });
    } else {
      filters.push({ customerId: String(id) });
    }
    if (customerEmail) {
      filters.push({ customerEmail: new RegExp(`^${customerEmail}$`, 'i') });
      filters.push({ customerEmail: customerEmail.toLowerCase() });
    }

    let items = [];
    let total = 0;

    // Try 1: Order model
    try {
      [items, total] = await Promise.all([
        Order.find({ $or: filters })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments({ $or: filters }),
      ]);
    } catch (err) {
    }

    // Try 2: 'orders' database > 'ordersList' collection
    if (total === 0) {
      try {
        const ordersDb = mongoose.connection.useDb('orders', {
          useCache: true,
        });
        const coll = ordersDb.collection('ordersList');
        const fbItems = await coll
          .find({ $or: filters })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        const fbTotal = await coll.countDocuments({ $or: filters });
        if (fbTotal > 0) {
          items = fbItems;
          total = fbTotal;
        }
      } catch (err) {
      }
    }

    // Try 3: current DB > 'ordersList' collection
    if (total === 0) {
      try {
        const coll = mongoose.connection.db.collection('ordersList');
        const fbItems = await coll
          .find({ $or: filters })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        const fbTotal = await coll.countDocuments({ $or: filters });
        if (fbTotal > 0) {
          items = fbItems;
          total = fbTotal;
        }
      } catch (err) {
      }
    }

    // Try 4: current DB > 'orders.ordersList' collection
    if (total === 0) {
      try {
        const coll = mongoose.connection.db.collection('orders.ordersList');
        const fbItems = await coll
          .find({ $or: filters })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        const fbTotal = await coll.countDocuments({ $or: filters });
        if (fbTotal > 0) {
          items = fbItems;
          total = fbTotal;
        }
      } catch (err) {
        console.log('[customers/:id/orders] orders.ordersList error:', err.message);
      }
    }

    // Try 5: current DB > 'orders' collection
    if (total === 0) {
      try {
        const coll = mongoose.connection.db.collection('orders');
        const fbItems = await coll
          .find({ $or: filters })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        const fbTotal = await coll.countDocuments({ $or: filters });
        if (fbTotal > 0) {
          items = fbItems;
          total = fbTotal;
        }
      } catch (err) {
        console.log('[customers/:id/orders] orders error:', err.message);
      }
    }

    const transformed = items.map((o) => {
      const plain = toPlain(o);
      return {
        _id: plain._id ? String(plain._id) : undefined,
        id: String(plain._id || plain.id || ''),
        displayCode:
          plain.displayCode &&
            typeof plain.displayCode === 'string' &&
            plain.displayCode.trim().length > 0
            ? String(plain.displayCode).trim()
            : null, // 4-char code để show
        customerId: plain.customerId ? String(plain.customerId) : undefined,
        customerEmail: plain.customerEmail,
        customerName: plain.customerName,
        total: plain.total || 0,
        subtotal: plain.subtotal,
        discount: plain.discount,
        shippingFee: plain.shippingFee,
        currency: plain.currency || 'VND',
        status: plain.status || 'created',
        paymentStatus: plain.paymentStatus || 'pending',
        paymentMethod: plain.paymentMethod,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        items: plain.items || [],
      };
    });

    res.json({
      success: true,
      data: transformed,
      items: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
      error: err.message,
    });
  }
});

/**
 * POST /api/customers
 * - Tạo customer mới
 * - Check trùng email bằng findCustomerWithLocation
 * - Ưu tiên lưu vào DB 'customers' > customersList, sau đó current DB, cuối cùng Customer model
 */
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      email,
      phone,
      gender,
      dateOfBirth,
      avatarUrl,
      addresses,
      paymentMethods,
      status,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required',
      });
    }

    // Prevent duplicates (mọi nơi)
    const existingCustomer = await findCustomerWithLocation(email);
    if (existingCustomer.customer) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Generate fullName if not provided
    const customerFullName = fullName || `${firstName} ${lastName}`.trim();

    // Prepare customer data
    const customerData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: customerFullName,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      gender: gender || 'other',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      avatarUrl: avatarUrl || undefined,
      addresses: addresses || [],
      paymentMethods: paymentMethods || [],
      status: status || 'active',
    };

    // Helper to format duplicate email response
    const duplicateResponse = () => ({
      success: false,
      message: 'Email already exists',
    });

    let customer = null;

    // Try 1: save vào 'customers' DB > customersList
    try {
      const customersDb = mongoose.connection.useDb('customers', {
        useCache: true,
      });
      const coll = customersDb.collection('customersList');
      const now = new Date();
      const result = await coll.insertOne({
        ...customerData,
        createdAt: now,
        updatedAt: now,
      });
      customer = { _id: result.insertedId, ...customerData, createdAt: now, updatedAt: now };
    } catch (errPrimary) {
      if (errPrimary.code === 11000 || errPrimary.message?.includes('duplicate')) {
        return res.status(400).json(duplicateResponse());
      }

      // Try 2: current DB > customersList
      try {
        const coll = mongoose.connection.db.collection('customersList');
        const now = new Date();
        const result = await coll.insertOne({
          ...customerData,
          createdAt: now,
          updatedAt: now,
        });
        customer = { _id: result.insertedId, ...customerData, createdAt: now, updatedAt: now };
      } catch (errSecondary) {
        if (errSecondary.code === 11000 || errSecondary.message?.includes('duplicate')) {
          return res.status(400).json(duplicateResponse());
        }

        // Try 3: fallback Customer model
        try {
          customer = new Customer(customerData);
          await customer.save();
        } catch (modelErr) {
          if (modelErr.code === 11000 || modelErr.message?.includes('duplicate')) {
            return res.status(400).json(duplicateResponse());
          }
          throw modelErr;
        }
      }
    }

    const c = toPlain(customer);
    const transformed = {
      _id: c._id ? String(c._id) : undefined,
      id: String(c._id || c.id),
      fullName:
        c.fullName ||
        [c.firstName, c.lastName].filter(Boolean).join(' '),
      email: c.email,
      avatarUrl: c.avatarUrl,
      status: c.status || 'active',
      phone: c.phone,
      addresses: c.addresses || [],
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
    };

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: transformed,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: err.message,
    });
  }
});

/**
 * PATCH /api/customers/:id
 * - Update customer
 * - Quan trọng: chỉ update nơi document đang tồn tại (theo findCustomerWithLocation)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove _id từ body nếu có
    delete updateData._id;
    delete updateData.id;

    // Add updatedAt
    updateData.updatedAt = new Date();

    // Find customer + location trước
    const { customer: existingCustomer, location } =
      await findCustomerWithLocation(id);

    if (!existingCustomer || !location) {
      console.error('❌ Customer not found with id:', id);
      return res.status(404).json({
        success: false,
        message: `Customer not found with id: ${id}`,
      });
    }

    let updated = false;
    let updatedCustomer = null;

    // Update đúng nơi tìm được
    try {
      if (location.type === 'database' || location.type === 'current') {
        const coll = location.coll;
        const query = Types.ObjectId.isValid(id)
          ? { _id: new Types.ObjectId(id) }
          : { email: id.toLowerCase() };

        const updateResult = await coll.updateOne(query, { $set: updateData });

        if (updateResult.matchedCount > 0 && updateResult.acknowledged) {
          // Chờ 1 chút cho chắc đã commit
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Fetch lại document đã update
          const result = await coll.findOne(query);
          if (result) {
            updated = true;
            updatedCustomer = result;
          } else {
            console.error(
              '❌ VERIFICATION FAILED: Document not found after update'
            );
          }
        } else {
          console.error(
            '❌ Update failed: matchedCount:',
            updateResult.matchedCount,
            'acknowledged:',
            updateResult.acknowledged
          );
        }
      } else if (location.type === 'model') {
        const query = Types.ObjectId.isValid(id)
          ? { _id: id }
          : { email: id.toLowerCase() };

        updatedCustomer = await Customer.findOneAndUpdate(
          query,
          { $set: updateData },
          { new: true }
        );

        if (updatedCustomer) {
          updated = true;
        }
      }
    } catch (err) {
      console.error('❌ Error updating customer:', err);
      throw err;
    }

    if (!updated || !updatedCustomer) {
      console.error('❌ Failed to update customer');
      return res.status(500).json({
        success: false,
        message: 'Failed to update customer',
      });
    }

    // Optional: verify lại trong DB cùng location
    const verifyQuery = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { email: id.toLowerCase() };

    if (location.type === 'database' || location.type === 'current') {
      const verifyColl = location.coll;
      const verifyDoc = await verifyColl.findOne(verifyQuery);
      if (!verifyDoc) {
        console.error(
          '❌ VERIFICATION FAILED: Document not found after update'
        );
      }
    } else if (location.type === 'model') {
      const verifyDoc = await Customer.findOne(verifyQuery);
      if (!verifyDoc) {
        console.error(
          '❌ VERIFICATION FAILED: Document not found in Customer model'
        );
      }
    }

    const c = toPlain(updatedCustomer);
    const transformed = {
      _id: c._id ? String(c._id) : undefined,
      id: String(c._id || c.id),
      fullName:
        c.fullName ||
        [c.firstName, c.lastName].filter(Boolean).join(' '),
      email: c.email,
      avatarUrl: c.avatarUrl,
      status: c.status || 'active',
      phone: c.phone,
      country:
        c.country ||
        c.addresses?.[0]?.country ||
        c.address?.country ||
        c.billingAddress?.country ||
        c.shippingAddress?.country,
      addresses: c.addresses || [],
      address: c.address,
      billingAddress: c.billingAddress,
      shippingAddress: c.shippingAddress,
      loyalty: c.loyalty,
      consents: c.consents,
      preferences: c.preferences,
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
      lastLoginAt: c.lastLoginAt || null,
      tags: c.tags || [],
      notes: c.notes || '',
    };

    res.json({
      success: true,
      data: transformed,
      message: 'Customer updated successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: err.message,
    });
  }
});

/**
 * DELETE /api/customers/:id
 * - Xoá customer ở đúng nơi nó đang nằm (db/collection/model)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, location } = await findCustomerWithLocation(id);

    if (!customer || !location) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id: ${id}`,
      });
    }

    const query = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { email: id.toLowerCase() };

    let deleted = false;

    if (location.type === 'database' || location.type === 'current') {
      const result = await location.coll.deleteOne(query);
      deleted = result.deletedCount > 0;
    } else if (location.type === 'model') {
      const result = await Customer.deleteOne(query);
      deleted = result.deletedCount > 0;
    }

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete customer',
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: err.message,
    });
  }
});

module.exports = router;
