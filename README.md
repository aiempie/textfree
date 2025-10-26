# TextFree API Server - Express.js Version

Đây là phiên bản Express.js của TextFree API Server, được convert từ Python FastAPI.

## Cài đặt

1. Cài đặt dependencies:

```bash
npm install
```

2. Chạy server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy trên `http://localhost:8000`

## API Endpoints

### 1. Đăng nhập

**POST** `/login`

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "session_id": "uuid-session-id",
  "user_id": "user-id",
  "message": "Đăng nhập thành công"
}
```

### 2. Đăng nhập với proxy US

**POST** `/login-us`

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

### 3. Debug đăng nhập

**POST** `/debug-login`

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

### 4. Gửi tin nhắn

**POST** `/send-message`

```json
{
  "message": "Nội dung tin nhắn",
  "to": "số-điện-thoại",
  "session_id": "session-id"
}
```

### 5. Lấy tin nhắn

**GET** `/messages?session_id=session-id&since=timestamp`

### 6. Lấy số điện thoại có sẵn

**GET** `/available-numbers/{area_code}?session_id=session-id`

### 7. Tạo tài khoản

**POST** `/create-account`

```json
{
  "email": "new-email@example.com",
  "password": "password",
  "phone_number": "số-điện-thoại",
  "area_code": "mã-vùng",
  "session_id": "session-id"
}
```

### 8. Lấy thông tin SIP

**GET** `/sip-info?session_id=session-id`

## Cấu trúc dự án

```
express-version/
├── package.json          # Dependencies và scripts
├── server.js             # Express server chính
├── textfree.js           # TextFree class
├── oauth.js              # OAuth class
└── README.md             # Hướng dẫn sử dụng
```

## Khác biệt với phiên bản Python

1. **Session Management**: Sử dụng in-memory storage thay vì dictionary
2. **Error Handling**: Sử dụng try-catch thay vì exception handling
3. **HTTP Client**: Sử dụng axios thay vì requests
4. **Async/Await**: Tất cả API calls đều là async
5. **Middleware**: Thêm helmet, cors, rate limiting

## Proxy Support

Để sử dụng proxy US, cần cài đặt SOCKS5 proxy trên port 9050:

```bash
# Cài đặt Tor (ví dụ)
brew install tor
tor
```

## Lưu ý

- Tất cả endpoints yêu cầu session_id (trừ login)
- Session được lưu trong memory, sẽ mất khi restart server
- Cần cài đặt proxy để sử dụng tính năng US
- Rate limiting: 100 requests/15 phút per IP
