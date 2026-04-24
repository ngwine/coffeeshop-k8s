const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/db', async (req, res) => {
  try {
    const db = mongoose.connection;
    const dbName = db.name;
    const collections = await db.db.listCollections().toArray();

    // Probe common collections used by this app
    const targets = ['customersList', 'customers', 'productsList', 'products', 'customers.customersList', 'products.productsList'];
    const results = {};
    for (const name of targets) {
      try {
        const exists = collections.some((c) => c.name === name);
        if (exists) {
          const count = await db.db.collection(name).countDocuments({});
          results[name] = { exists: true, count };
        } else {
          results[name] = { exists: false, count: 0 };
        }
      } catch (e) {
        results[name] = { exists: false, error: e.message };
      }
    }

    res.json({ ok: true, dbName, collections: results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;

// List all collections with counts (to verify real names)
router.get('/collections', async (req, res) => {
  try {
    const db = mongoose.connection;
    const cols = await db.db.listCollections().toArray();
    const out = [];
    for (const c of cols) {
      try {
        const count = await db.db.collection(c.name).countDocuments({});
        out.push({ name: c.name, count });
      } catch (e) {
        out.push({ name: c.name, error: e.message });
      }
    }
    res.json({ ok: true, dbName: db.name, collections: out });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Count via models to ensure model bindings (useDb) are correct
router.get('/models', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const [customerCount, productCount, orderCount] = await Promise.all([
      Customer.countDocuments({}).catch(() => -1),
      Product.countDocuments({}).catch(() => -1),
      Order.countDocuments({}).catch(() => -1),
    ]);
    res.json({ ok: true, modelCounts: { customers: customerCount, products: productCount, orders: orderCount } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


