# 🧭 Future Travel — Frontend (ReactJS)

Giao diện người dùng cho nền tảng đặt tour du lịch **Future Travel**, xây dựng bằng **ReactJS (Create React App)**. Ứng dụng gồm hai phần: **trang người dùng** (khám phá & đặt tour, diễn đàn, trợ lý ảo) và **trang quản trị (Admin)** (quản lý tour, lịch khởi hành, coupon, dashboard, đơn đặt...).

Backend là hệ thống **Spring Boot microservices**, frontend gọi API qua **API Gateway** tại `http://localhost:8080/api`.

---

## 📋 Mục lục

- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu](#-yêu-cầu)
- [Cài đặt & chạy](#-cài-đặt--chạy)
- [Kết nối backend](#-kết-nối-backend)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Tính năng chính](#-tính-năng-chính)
- [Build production](#-build-production)

---

## 🧰 Công nghệ sử dụng

| Nhóm | Công nghệ |
|---|---|
| Core | React 18, Create React App (react-scripts), TypeScript + JavaScript |
| Định tuyến | React Router v7 |
| State | Redux Toolkit, React Redux |
| Gọi API | Axios (interceptor gắn JWT tự động) |
| UI | Ant Design, React Bootstrap, SCSS/Sass, Lucide & FontAwesome icons |
| Realtime | STOMP.js + SockJS / socket.io (thông báo, chat) |
| Bản đồ | Leaflet + React-Leaflet |
| Biểu đồ | Recharts |
| Soạn thảo | React-Quill (rich text) |
| Khác | react-toastify, swiper, react-select, fuse.js (tìm kiếm) |

---

## ✅ Yêu cầu

| Công cụ | Phiên bản |
|---|---|
| Node.js | 18+ (khuyến nghị LTS) |
| npm | 9+ |

---

## 🚀 Cài đặt & chạy

```bash
# Vào thư mục source
cd client-side

# Cài dependencies
npm install

# Chạy ở chế độ phát triển (mặc định cổng 3000)
npm start
```

Mở trình duyệt: **http://localhost:3000**

> Đảm bảo backend đã chạy (ít nhất API Gateway `:8080`) trước khi thao tác các chức năng cần dữ liệu.

---

## 🔗 Kết nối backend

Địa chỉ API được cấu hình trong `src/utils/axiosCustomize.js`:

```js
const BASE_URL = 'http://localhost:8080/api';
```

- Axios tự động gắn `Authorization: Bearer <token>` từ `localStorage` vào mỗi request.
- Timeout mặc định 30s (một số request nặng như đồng bộ chatbot được nới riêng).

Biến môi trường (nếu dùng) đặt trong `.env.local` theo chuẩn CRA (tiền tố `REACT_APP_`).

---

## 📁 Cấu trúc thư mục

```
client-side/
├── public/
├── src/
│   ├── components/         # Toàn bộ UI, chia theo tính năng
│   │   ├── AdminComponent/         # Trang quản trị (tour, lịch KH, coupon, dashboard...)
│   │   ├── TourBookingComponent/   # Trang đặt tour
│   │   ├── TourDetailComponent/    # Chi tiết tour
│   │   ├── ForumComponent/         # Diễn đàn
│   │   ├── ChatbotWidget/          # Trợ lý ảo
│   │   ├── homPageComponent/       # Trang chủ
│   │   └── ...
│   ├── services/          # Lớp gọi API (auth, tour, booking, dashboard, forum...)
│   ├── context/           # React Context
│   ├── hook/              # Custom hooks
│   ├── dto/               # Kiểu dữ liệu (TypeScript)
│   ├── utils/             # axiosCustomize, websocket, helpers
│   ├── assets/            # Ảnh, style dùng chung
│   └── App.tsx / index.tsx
└── package.json
```

---

## ✨ Tính năng chính

**Người dùng**
- Khám phá / tìm kiếm tour, xem chi tiết & lịch khởi hành, bản đồ điểm đến.
- Đặt tour: chọn hành khách, **áp mã giảm giá** (mã theo lịch khởi hành + mã toàn hệ thống, tự chọn mã giảm nhiều nhất), dùng xu thưởng, thanh toán.
- Diễn đàn cộng đồng, đánh giá tour, Green Fund.
- **Trợ lý ảo AI** hỗ trợ tư vấn tour.
- Thông báo realtime.

**Quản trị (Admin)**
- Quản lý tour, **lịch khởi hành** (giao diện nhóm theo tour dạng accordion, cột "đã đặt" thống kê thật, "giá từ" theo giá người lớn).
- Quản lý **coupon** (theo lịch khởi hành hoặc toàn hệ thống, gắn nhiều lịch).
- Dashboard doanh thu, **phân tích bằng AI**, đồng bộ dữ liệu trợ lý ảo.
- Quản lý đơn đặt, người dùng, diễn đàn, thông báo.

---

## 📦 Build production

```bash
npm run build
```

Kết quả nằm trong thư mục `build/` — đã minify và tối ưu, sẵn sàng triển khai lên hosting/CDN hoặc phục vụ qua Nginx.

---

## 🧪 Lệnh khác

```bash
npm test        # chạy test (interactive watch)
```
