<div align="center">

# 🏠 SmartHome

**Hệ thống quản lý nhà thông minh — giám sát, điều khiển thiết bị và tự động hóa trong một nền tảng duy nhất.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Adafruit IO](https://img.shields.io/badge/Adafruit_IO-MQTT-AE2029?style=flat-square)](https://io.adafruit.com/)
[![MQTT](https://img.shields.io/badge/MQTT-5-660066?style=flat-square&logo=mqtt)](https://mqtt.org/)

[⚙️ Backend Repo](#) · [📱 Frontend Repo](#)

</div>

---

## 📖 Giới thiệu

**SmartHome** là hệ thống IoT toàn diện cho phép người dùng giám sát và điều khiển các thiết bị trong nhà theo thời gian thực. Được xây dựng trên nền tảng **Yolo:Bit** (WiFi tích hợp) kết hợp với **Adafruit IO** làm MQTT broker, hệ thống cho phép điều khiển từ xa qua ứng dụng di động mà không cần thiết bị gateway trung gian.

---

## ⚡ Tech Stack

### Backend
| Công nghệ | Vai trò |
|---|---|
| 🟢 **Node.js + Express** | Framework server chính |
| 🔷 **TypeScript** | Ngôn ngữ lập trình |
| 🍃 **MongoDB Atlas** | Cơ sở dữ liệu |
| 🔌 **MQTT (mqtts)** | Giao tiếp realtime với Yolo:Bit qua Adafruit IO |
| 🌐 **Adafruit IO REST API** | Quản lý feeds và groups thiết bị |
| 🔐 **JWT + bcryptjs** | Xác thực và bảo mật |
| 📄 **Swagger UI** | Tài liệu API tự động |

### Frontend
| Công nghệ | Vai trò |
|---|---|
| ⚛️ **React Native** | Framework mobile (iOS & Android) |
| 🔷 **TypeScript** | Ngôn ngữ lập trình |
| 📦 **Axios** | Giao tiếp HTTP với Backend |
| 🔌 **MQTT Client** | Nhận trạng thái thiết bị realtime |

### Hardware
| Thiết bị | Vai trò |
|---|---|
| 🔲 **Yolo:Bit** | Vi điều khiển chính (WiFi tích hợp, kết nối MQTT trực tiếp) |
| 🌡️ **DHT20** | Cảm biến nhiệt độ & độ ẩm (I2C) |
| ☀️ **Cảm biến ánh sáng** | Đo cường độ ánh sáng (ADC) |
| 💡 **LED RGB** | Đèn chiếu sáng đa màu |
| 🌀 **Quạt DC** | Điều khiển tốc độ |
| 🔒 **RC Servo** | Mô phỏng khóa cửa |
| 🖥️ **LCD 16x2** | Hiển thị thông tin môi trường |

---

## 📂 Cấu trúc thư mục

### Backend
```
src/
├── server.ts                # Entry point: khởi động DB, MQTT, HTTP
├── app.ts                   # Express setup, routes, middleware
├── types/
│   └── index.ts             # Toàn bộ TypeScript interfaces & types
├── config/
│   ├── db.ts                # Kết nối MongoDB (Singleton)
│   └── swagger.ts           # Cấu hình Swagger UI
├── adafruit/
│   └── index.ts             # Axios instance Adafruit IO REST API (Facade)
├── services/
│   └── mqttService.ts       # MQTT client (Singleton + Observer)
├── middleware/
│   └── authMiddleware.ts    # JWT verification
├── models/
│   ├── UserSchema.ts
│   ├── RoomSchema.ts
│   ├── DeviceSchema.ts
│   ├── ActionLogSchema.ts
│   └── SystemConfigSchema.ts
├── controllers/
│   ├── authController.ts
│   ├── deviceController.ts  # Facade: sendCommand()
│   ├── roomController.ts
│   └── configController.ts
└── routes/
    ├── auth.ts
    ├── devices.ts
    ├── rooms.ts
    └── config.ts
```

---

## 🔄 Luồng hoạt động

### App điều khiển thiết bị
```
App → POST /api/devices/command
    → deviceController (Facade)
    → mqttService.publish()
    → Adafruit IO (broker)
    → Yolo:Bit subscribe → thực thi
```

### Yolo:Bit gửi sensor data
```
Yolo:Bit đọc cảm biến → publish lên Adafruit IO
    → Backend subscribe nhận data
    → mqttService._onDeviceData() (Observer)
    → lưu MongoDB
```

### Thay đổi cấu hình
```
App → PUT /api/config/temp_alert_threshold
    → configController
    → mqttService.publishSystem()
    → Adafruit IO
    → Yolo:Bit cập nhật ngưỡng ngay lập tức
```

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu hệ thống
- **Node.js** >= 20.x
- **npm** >= 9.x
- Tài khoản **MongoDB Atlas**
- Tài khoản **Adafruit IO**

### Backend

```bash
# 1. Clone repository
git clone https://github.com/nKhanGh/smart-home.git
cd server

# 2. Cài đặt dependencies
npm install

# 3. Tạo file môi trường
cp .env.example .env
# Điền các biến môi trường cần thiết vào .env

# 4. Khởi chạy môi trường development
npm run dev
```

#### Biến môi trường `.env`
```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smarthome
AIO_USERNAME=your_adafruit_username
AIO_KEY=your_adafruit_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

#### Scripts
```bash
npm run dev      # Chạy development (ts-node-dev)
npm run build    # Build TypeScript → dist/
npm run start    # Chạy production
```

### Frontend

```bash
git clone clone https://github.com/nKhanGh/smart-home.git
cd smarthome-app
npm install
npx expo start
```

---

## ✅ Tính năng

### 👤 Người dùng
| Tính năng | Mô tả |
|---|---|
| 🔐 Xác thực | Đăng ký / Đăng nhập bằng email, JWT tự động refresh |
| 🏠 Quản lý phòng | Thêm, xóa phòng; xem danh sách thiết bị theo phòng |
| 💡 Quản lý thiết bị | Thêm, sửa, xóa thiết bị; tự động tạo feed trên Adafruit IO |
| 🎛️ Điều khiển | Bật/tắt thiết bị từ xa; điều chỉnh màu đèn, tốc độ quạt |
| 📅 Hẹn giờ | Lên lịch bật/tắt thiết bị theo thời gian và thứ trong tuần |
| 🔒 Khóa cửa | Mở cửa bằng mật khẩu; nhận diện khuôn mặt |
| 📊 Thống kê | Biểu đồ nhiệt độ, độ ẩm, ánh sáng theo khoảng thời gian |
| 🔔 Thông báo | Cảnh báo khi cảm biến vượt ngưỡng cho phép |
| 📜 Lịch sử | Xem lịch sử hoạt động từng thiết bị |

### ⚙️ Hệ thống
| Tính năng | Mô tả |
|---|---|
| 🌡️ Ngưỡng cảnh báo | Cấu hình ngưỡng nhiệt độ, độ ẩm, ánh sáng |
| 🔄 Chế độ tự động | AUTO: tự bật đèn/quạt theo cảm biến; MANUAL: điều khiển thủ công |
| 📡 Realtime | Trạng thái thiết bị cập nhật realtime qua MQTT |
| 🛡️ Bảo mật | JWT authentication, bcrypt password hashing |

---

## 🏗️ Design Patterns

| Pattern | File áp dụng | Mục đích |
|---|---|---|
| **Singleton** | `mqttService.ts`, `config/db.ts` | 1 kết nối MQTT và DB duy nhất |
| **Observer** | `mqttService.ts` (handlers Map) | Dispatch MQTT message đến đúng handler |
| **Facade** | `deviceController.ts` (sendCommand) | Che giấu MQTT + log sau 1 endpoint |
| **Facade** | `adafruit/index.ts` | Ẩn auth header, base URL khỏi controllers |

---

## 📡 API Documentation

Sau khi khởi chạy backend, truy cập Swagger UI tại:
```
http://localhost:3000/api-docs
```

### Các nhóm API chính
| Nhóm | Base URL | Mô tả |
|---|---|---|
| Auth | `/api/auth` | Đăng ký, đăng nhập, thông tin user |
| Rooms | `/api/rooms` | Quản lý phòng |
| Devices | `/api/devices` | Quản lý thiết bị, gửi lệnh, xem data |
| Config | `/api/config` | Cấu hình ngưỡng cảnh báo, chế độ |

---

## 🤝 Đóng góp

Pull requests luôn được chào đón! Vui lòng mở issue trước khi thực hiện thay đổi lớn.

---

<div align="center">

Made with 💙 by **SmartHome Team**

*BK — Ho Chi Minh City University of Technology*

</div>