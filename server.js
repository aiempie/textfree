const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const Textfree = require("./textfree");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Store user sessions
const userSessions = {};

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "TextFree API Server",
    endpoints: {
      "POST /login": "Đăng nhập với email/password",
      "POST /login-us": "Đăng nhập với proxy US",
      "POST /debug-login": "Debug đăng nhập để xem response",
      "POST /send-message": "Gửi tin nhắn",
      "GET /messages": "Lấy danh sách tin nhắn",
      "GET /available-numbers/:area_code": "Lấy số điện thoại có sẵn",
      "POST /create-account": "Tạo tài khoản mới",
      "GET /sip-info": "Lấy thông tin SIP",
    },
  });
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và password là bắt buộc",
      });
    }

    // Create new TextFree instance
    const tf = new Textfree();

    // Perform login
    const result = await tf.login(email, password);

    console.log(`[DEBUG] Login result: ${JSON.stringify(result)}`);
    console.log(`[DEBUG] UserID: ${tf.userID}`);
    console.log(`[DEBUG] Token: ${tf.token}`);

    // Check if login was successful
    if (tf.userID && tf.token) {
      // Create session ID
      const sessionId = uuidv4();

      // Store session
      userSessions[sessionId] = {
        tfInstance: tf,
        userId: tf.userID,
        token: tf.token,
        email: email,
      };

      return res.json({
        success: true,
        session_id: sessionId,
        user_id: tf.userID,
        message: "Đăng nhập thành công",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Đăng nhập thất bại - thông tin không hợp lệ",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi đăng nhập: ${error.message}`,
    });
  }
});

// Login with US proxy
app.post("/login-us", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và password là bắt buộc",
      });
    }

    // Use US proxy
    const proxyConfig = {
      http: "socks5://127.0.0.1:9050",
      https: "socks5://127.0.0.1:9050",
    };
    const tf = new Textfree(proxyConfig);

    const result = await tf.login(email, password);

    console.log(`[DEBUG] Login US result: ${JSON.stringify(result)}`);
    console.log(`[DEBUG] UserID: ${tf.userID}`);
    console.log(`[DEBUG] Token: ${tf.token}`);

    if (tf.userID && tf.token) {
      const sessionId = uuidv4();

      userSessions[sessionId] = {
        tfInstance: tf,
        userId: tf.userID,
        token: tf.token,
        email: email,
      };

      return res.json({
        success: true,
        session_id: sessionId,
        user_id: tf.userID,
        message: "Đăng nhập thành công với proxy US",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Đăng nhập thất bại - thông tin không hợp lệ",
      });
    }
  } catch (error) {
    console.error("Login US error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi đăng nhập: ${error.message}`,
    });
  }
});

// Debug login endpoint
app.post("/debug-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và password là bắt buộc",
      });
    }

    const tf = new Textfree();
    const result = await tf.login(email, password);

    return res.json({
      raw_response: JSON.stringify(result),
      user_id: tf.userID,
      token: tf.token,
      email: email,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      raw_response: "Error occurred",
    });
  }
});

// Send message endpoint
app.post("/send-message", async (req, res) => {
  try {
    const { message, to, session_id } = req.body;

    if (!message || !to || !session_id) {
      return res.status(400).json({
        success: false,
        message: "Message, to và session_id là bắt buộc",
      });
    }

    // Check session
    if (!userSessions[session_id]) {
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ",
      });
    }

    const tf = userSessions[session_id].tfInstance;

    // Send message
    const result = await tf.sendMessage(message, to);

    if (result.success !== false) {
      return res.json({
        success: true,
        message: "Tin nhắn đã được gửi thành công",
        result: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Gửi tin nhắn thất bại",
      });
    }
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi gửi tin nhắn: ${error.message}`,
    });
  }
});

// Get messages endpoint
app.get("/messages", async (req, res) => {
  try {
    const { session_id, since } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "session_id là bắt buộc",
      });
    }

    // Check session
    if (!userSessions[session_id]) {
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ",
      });
    }

    const tf = userSessions[session_id].tfInstance;

    // Get messages
    const result = since ? await tf.getMessages(since) : await tf.getMessages();

    return res.json({
      success: true,
      messages: result,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi lấy tin nhắn: ${error.message}`,
    });
  }
});

// Get available numbers endpoint
app.get("/available-numbers/:area_code", async (req, res) => {
  try {
    const { area_code } = req.params;
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "session_id là bắt buộc",
      });
    }

    // Check session
    if (!userSessions[session_id]) {
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ",
      });
    }

    const tf = userSessions[session_id].tfInstance;

    // Get available numbers
    const result = await tf.getAvaliableNumbers(area_code);

    return res.json({
      success: true,
      available_numbers: result,
    });
  } catch (error) {
    console.error("Get available numbers error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi lấy số điện thoại: ${error.message}`,
    });
  }
});

// Create account endpoint
app.post("/create-account", async (req, res) => {
  try {
    const { email, password, phone_number, area_code, session_id } = req.body;

    if (!email || !password || !phone_number || !area_code || !session_id) {
      return res.status(400).json({
        success: false,
        message: "Tất cả các trường là bắt buộc",
      });
    }

    // Check session
    if (!userSessions[session_id]) {
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ",
      });
    }

    const tf = userSessions[session_id].tfInstance;

    // Get available numbers first
    await tf.getAvaliableNumbers(area_code);

    // Create account
    const result = await tf.createAccount(email, password, phone_number);

    if (result.result) {
      return res.json({
        success: true,
        message: "Tài khoản đã được tạo thành công",
        result: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Tạo tài khoản thất bại",
      });
    }
  } catch (error) {
    console.error("Create account error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi tạo tài khoản: ${error.message}`,
    });
  }
});

// Get SIP info endpoint
app.get("/sip-info", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "session_id là bắt buộc",
      });
    }

    // Check session
    if (!userSessions[session_id]) {
      return res.status(401).json({
        success: false,
        message: "Session không hợp lệ",
      });
    }

    const tf = userSessions[session_id].tfInstance;

    return res.json({
      success: true,
      sip_username: tf.getSipUsername(),
      sip_password: tf.getSipPassword(),
    });
  } catch (error) {
    console.error("Get SIP info error:", error);
    return res.status(500).json({
      success: false,
      message: `Lỗi lấy thông tin SIP: ${error.message}`,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Có lỗi xảy ra trên server",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint không tồn tại",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TextFree API Server đang chạy trên port ${PORT}`);
  console.log(`Truy cập: http://localhost:${PORT}`);
});

module.exports = app;
