<div align="center">

# 🏠 SmartHome

**Hệ thống quản lý nhà thông minh — giám sát, điều khiển thiết bị và tự động hóa trong một nền tảng duy nhất.**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Adafruit IO](https://img.shields.io/badge/Adafruit_IO-MQTT-AE2029?style=flat-square)](https://io.adafruit.com/)
[![MQTT](https://img.shields.io/badge/MQTT-5-660066?style=flat-square&logo=mqtt)](https://mqtt.org/)

</div>

---

## 📖 Giới thiệu

**SmartHome** là hệ thống IoT toàn diện cho phép người dùng giám sát và điều khiển các thiết bị trong nhà theo thời gian thực. Được xây dựng trên nền tảng **Yolo:Bit** (WiFi tích hợp) kết hợp với **Adafruit IO** làm MQTT broker, hệ thống cho phép điều khiển từ xa qua ứng dụng di động mà không cần thiết bị gateway trung gian.

---

## ⚡ Tech Stack

### Backend

| Công nghệ                   | Vai trò                                         |
| --------------------------- | ----------------------------------------------- |
| 🟢 **Node.js + Express**    | Framework server chính                          |
| 🔷 **TypeScript**           | Ngôn ngữ lập trình                              |
| 🍃 **MongoDB Atlas**        | Cơ sở dữ liệu                                   |
| 🔌 **MQTT (mqtts)**         | Giao tiếp realtime với Yolo:Bit qua Adafruit IO |
| 🌐 **Adafruit IO REST API** | Quản lý feeds và groups thiết bị                |
| 🔐 **JWT + bcryptjs**       | Xác thực và bảo mật                             |
| 🧠 **Redis**                | Lưu trạng thái runtime, hỗ trợ tác vụ nền       |
| 🛰️ **Socket.IO**            | Realtime update cho ứng dụng                    |
| 📄 **Swagger UI**           | Tài liệu API tự động                            |

### Frontend

| Công nghệ               | Vai trò                           |
| ----------------------- | --------------------------------- |
| ⚛️ **React Native**     | Framework mobile (iOS & Android)  |
| 🔷 **TypeScript**       | Ngôn ngữ lập trình                |
| 📦 **Axios**            | Giao tiếp HTTP với Backend        |
| 🛰️ **Socket.IO Client** | Nhận trạng thái thiết bị realtime |

### Hardware

| Thiết bị                 | Vai trò                                                     |
| ------------------------ | ----------------------------------------------------------- |
| 🔲 **Yolo:Bit**          | Vi điều khiển chính (WiFi tích hợp, kết nối MQTT trực tiếp) |
| 🌡️ **DHT20**             | Cảm biến nhiệt độ & độ ẩm (I2C)                             |
| ☀️ **Cảm biến ánh sáng** | Đo cường độ ánh sáng (ADC)                                  |
| 💡 **LED RGB**           | Đèn chiếu sáng đa màu                                       |
| 🌀 **Quạt DC**           | Điều khiển tốc độ                                           |
| 🔒 **RC Servo**          | Mô phỏng khóa cửa                                           |
| 🖥️ **LCD 16x2**          | Hiển thị thông tin môi trường                               |

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
    ├── auth.route.ts
    ├── devices.route.ts
    ├── rooms.route.ts
    ├── thresholds.route.ts
    ├── threshold.route.ts
    ├── schedules.route.ts
    ├── sensorAlerts.route.ts
    ├── data.route.ts
    ├── user.route.ts
    ├── homeDisplay.route.ts
    └── statistic.route.ts
```

### Frontend

```
app/
├── (tabs)/                 # Các màn hình chính theo tab
│   ├── (devices)/
│   ├── (rooms)/
│   ├── (settings)/
│   └── (stats)/
├── index.tsx               # Home
├── login.tsx               # Đăng nhập
└── _layout.tsx             # Layout router
components/
├── devices/                # UI điều khiển thiết bị
├── home/                   # UI dashboard
└── modals/                 # Các modal thao tác
contexts/                   # Auth + Socket
service/                    # Giao tiếp API
styles/                     # Style theo màn hình
utils/                      # Helper
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

### Thay đổi ngưỡng cảnh báo

```
App → PUT /api/devices/:id/threshold
    → threshold controller
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
- **Redis** (khuyến nghị khi chạy đầy đủ tính năng nền)

### 🖥️ Server

```bash
# 1. Di chuyển vào thư mục server
cd server

# 2. Cài đặt dependencies
npm install
```

Tạo file `.env` tại thư mục `server` và điền các biến môi trường:

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smarthome
AIO_USERNAME=your_adafruit_username
AIO_KEY=your_adafruit_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ADMIN_USER_ID=<mongo_object_id>
REDIS_URL=redis://<user>:<password>@<host>:<port>
```

```bash
# 3. Sync feeds từ Adafruit IO vào MongoDB (chạy 1 lần đầu)
npm run sync

# 4. Khởi chạy development
npm run dev
```

Server chạy tại: `http://localhost:3000`
Swagger UI tại: `http://localhost:3000/api-docs`

| Script                    | Mô tả                          |
| ------------------------- | ------------------------------ |
| `npm run dev`             | Chạy development (ts-node-dev) |
| `npm run build`           | Build TypeScript → dist/       |
| `npm run start`           | Chạy production                |
| `npm run sync`            | Sync feeds Adafruit → MongoDB  |
| `npm run sync:thresholds` | Chỉ sync ngưỡng cảnh báo       |

---

### 📱 Client

```bash
# 1. Di chuyển vào thư mục client
cd client

# 2. Cài đặt dependencies
npm install
```

Tạo file `.env` tại thư mục `client` và điền các biến môi trường:

```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3000/api
EXPO_PUBLIC_SOCKET_URL=http://<your-local-ip>:3000
```

> ⚠️ Dùng địa chỉ IP thực của máy (không dùng `localhost`) để điện thoại kết nối được với server.

```bash
# 3. Khởi chạy
npx expo start
```

Quét QR code bằng **Expo Go** trên điện thoại để chạy ứng dụng.

---

## ✅ Tính năng

### 🔐 Xác thực

- Đăng ký, đăng nhập bằng email
- JWT authentication
- Phân quyền Admin / User
- Quản lý hồ sơ người dùng: cập nhật tên hiển thị, avatar initials

### 🏠 Quản lý phòng & thiết bị

- Thêm, xóa phòng — tự động tạo/xóa group trên Adafruit IO
- Thêm, sửa, xóa thiết bị — tự động tạo/xóa feed trên Adafruit IO
- Xem danh sách thiết bị theo phòng
- Kiểm tra trạng thái thiết bị và đồng bộ metadata thiết bị

### 🎛️ Điều khiển

- Bật/tắt thiết bị từ xa qua MQTT realtime
- Điều khiển bằng giọng nói (Speech-to-Text → text command)
- Xem trạng thái hiện tại của thiết bị
- Gợi ý và phân tích câu lệnh giọng nói theo tên phòng/thiết bị

### 📊 Dữ liệu & Thống kê

- Xem dữ liệu sensor realtime (nhiệt độ, độ ẩm, ánh sáng)
- Lịch sử dữ liệu sensor theo thiết bị
- Lịch sử hành động điều khiển
- Thống kê min/avg/max và biểu đồ theo ngày/tuần/tháng
- Lọc dữ liệu theo phòng và theo loại cảm biến

### ⏰ Lịch hẹn giờ

- Đặt lịch bật/tắt thiết bị theo giờ và thứ trong tuần
- Cron job tự động chạy mỗi phút
- Xem, sửa, xóa lịch theo thiết bị
- Lịch giám sát chuyển động cho cảm biến motion

### 🔔 Cảnh báo

- Cấu hình ngưỡng cảnh báo theo từng thiết bị
- Tự động cảnh báo khi sensor vượt ngưỡng
- Lưu lịch sử cảnh báo
- Tra cứu lịch sử cảnh báo theo thiết bị, phân trang và lọc theo thời gian
- Gửi push notification khi vượt ngưỡng quan trọng

### 🧩 Tự động hóa ngưỡng

- Ràng buộc ngưỡng hợp lệ theo loại thiết bị và cảm biến
- Hỗ trợ action `on`/`off`/`alert` tùy loại thiết bị

### 🧭 Dashboard hiển thị

- Cấu hình khối hiển thị trên màn hình Home theo người dùng
- Tự động tạo cấu hình Home mặc định cho user mới

### 👥 Quản lý người dùng

- Thêm người dùng (Admin)
- Xóa, cập nhật người dùng và phân quyền

---

## 📡 API

Sau khi khởi chạy server, truy cập Swagger UI để xem và test toàn bộ API:

```
http://localhost:3000/api-docs
```

| Nhóm             | Base URL                     | Mô tả                                |
| ---------------- | ---------------------------- | ------------------------------------ |
| Auth             | `/api/auth`                  | Đăng ký, đăng nhập, thông tin user   |
| Rooms            | `/api/rooms`                 | Quản lý phòng                        |
| Devices          | `/api/devices`               | Quản lý thiết bị, gửi lệnh, xem data |
| Data             | `/api/data`                  | Dữ liệu cảm biến                     |
| Schedules        | `/api/schedules`             | Lịch hẹn giờ                         |
| Sensor Alerts    | `/api/sensor-alerts`         | Cảnh báo vượt ngưỡng                 |
| Thresholds       | `/api/thresholds`            | Ngưỡng cảnh báo                      |
| Device Threshold | `/api/devices/:id/threshold` | Ngưỡng theo thiết bị                 |
| Home Display     | `/api/home-display`          | Dữ liệu hiển thị dashboard           |
| Statistics       | `/api/statistics`            | Thống kê tổng quan                   |
| Users            | `/api/users`                 | Quản lý người dùng                   |

---

## 📱 Giao diện ứng dụng

> 🚧 Phần này sẽ được bổ sung sau

<!-- Thêm screenshot các màn hình chính vào đây -->
<!-- Gợi ý các màn hình cần chụp:
  - Màn hình đăng nhập
  - Danh sách phòng
  - Chi tiết phòng + danh sách thiết bị
  - Điều khiển thiết bị
  - Biểu đồ dữ liệu sensor
  - Màn hình hẹn giờ
  - Thông báo cảnh báo
-->

---

## 🏗️ Design Patterns

| Pattern       | File áp dụng                        | Mục đích                                  |
| ------------- | ----------------------------------- | ----------------------------------------- |
| **Singleton** | `mqttService.ts`, `config/db.ts`    | 1 kết nối MQTT và DB duy nhất             |
| **Observer**  | `mqttService.ts` (handlers Map)     | Dispatch MQTT message đến đúng handler    |
| **Facade**    | `deviceController.ts` (sendCommand) | Che giấu MQTT + log sau 1 endpoint        |
| **Facade**    | `adafruit/index.ts`                 | Ẩn auth header, base URL khỏi controllers |

---

## 🤝 Đóng góp

Pull requests luôn được chào đón! Vui lòng mở issue trước khi thực hiện thay đổi lớn.

---

<div align="center">

Made with 💙 by **SmartHome Team**

_BK — Ho Chi Minh City University of Technology_

</div>
