const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');
const Category = require('./models/Category');

async function debugCategories() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CoffeeDB';
    console.log(`Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const products = await Product.find({}, 'name category').lean();
    const categories = await Category.find({}, 'name').lean();

    const uniqueProductCats = [...new Set(products.map(p => p.category))].filter(Boolean);

    console.log('\n--- DATA REPORT ---');
    console.log(`- Total Products: ${products.length}`);
    console.log(`- Unique Category Names in Products: ${uniqueProductCats.length}`);
    console.log(`  Names: ${JSON.stringify(uniqueProductCats)}`);
    
    console.log(`- Total Categories in "categories" collection: ${categories.length}`);
    console.log(`  Names: ${JSON.stringify(categories.map(c => c.name))}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugCategories();
