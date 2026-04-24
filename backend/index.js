// backend/server.js (hoặc index.js tuỳ bạn đang đặt tên gì)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/database");
const http = require("http");
const net = require("net");
const WebSocket = require("ws");

const { configureWebSocket } = require("./routes/websocket");
const app = express();
const START_PORT = Number(process.env.PORT) || 3001; // port khởi đầu

console.log('📡 Đang kết nối Database...');
connectDB().then(() => {
    console.log('✅ Kết nối DB thành công');
}).catch(err => {
    console.error('❌ Lỗi kết nối DB:', err.message);
});

// ================== MIDDLEWARE CHUNG ==================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin (mobile apps, curl) và mọi localhost/127.0.0.1 cho dev
    if (!origin || /(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    // Allow explicit origins defined via env (comma-separated)
    const allowed = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});

// ================== ROUTES ==================
const accountRoutes = require("./routes/account");
const apiRouter = require("./routes/index");

// route cập nhật tài khoản
app.use("/api/account", accountRoutes);

// các route API còn lại (/api/auth, /api/products, ...)
app.use("/api", apiRouter);

// Routes đơn giản
app.get("/", (req, res) => {
  res.send("Hello from Backend!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ================== PURE PATTERN INITIALIZATION ==================
const server = http.createServer(app); // thay vì app.listen trực tiếp

// Initialize pure patterns with adapters
const ReviewObserver = require("./patterns/observer/ReviewObserver");
const WebSocketAdapter = require("./patterns/adapter/WebSocketAdapter");
const MemoryStorageAdapter = require("./patterns/adapter/MemoryStorageAdapter");
const CartService = require("./patterns/singleton/CartService");

// ✅ Setup ReviewObserver (pure)
const reviewObserver = ReviewObserver.getInstance();

// ✅ Setup WebSocket server logic
const wsServer = configureWebSocket(server);

// ✅ Setup WebSocket adapter to connect pure observer to Express
const wsAdapter = new WebSocketAdapter(reviewObserver, wsServer);

// ✅ Setup CartService with storage injection
CartService.setStorage(MemoryStorageAdapter.getInstance());

// ✅ Export for controllers to use
module.exports.reviewObserver = reviewObserver;
module.exports.wsAdapter = wsAdapter;

// ================== GLOBAL ERROR HANDLER ==================
const { errorHandler } = require("./middleware/errorHandler");

// 404 handler - must be before error handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler - must be last
app.use(errorHandler);

// ================== START SERVER ==================
const findAvailablePort = (port) =>
  new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(findAvailablePort(port + 1));
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        tester
          .once("close", () => resolve(port))
          .close();
      })
      .listen(port);
  });

(async () => {
  try {
    const freePort = await findAvailablePort(START_PORT);
    server.listen(freePort, () => {
      console.log(`🚀 HTTP + WS server is running at http://localhost:${freePort}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("❌ Không tìm được port trống:", err);
    process.exit(1);
  }
})();
