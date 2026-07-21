# 💰 Web Theo Dõi Tài Chính Cá Nhân

Ứng dụng quản lý tài chính cá nhân: theo dõi thu/chi, mục tiêu tiết kiệm, ngân sách theo danh mục, biểu đồ và báo cáo. Giao diện tiếng Việt, tiền tệ VND (₫).

Tài khoản demo (sau khi seed): **demo@demo.com** / **demo1234**

---

## 🧱 Kiến trúc

Monorepo gồm 2 phần:

```
finance-react-app/
├── src/            # Frontend — React 19 + Vite + Tailwind v4 + React Router v7 + Recharts
├── server/         # Backend — Express + Prisma + PostgreSQL (Neon) + JWT
└── ...
```

- **Frontend**: SPA React. Xác thực bằng JWT lưu ở `localStorage`, route được bảo vệ, code-splitting theo trang (recharts nạp theo yêu cầu).
- **Backend**: REST API. Xác thực JWT, mật khẩu băm bằng bcrypt, validate bằng zod, ORM Prisma.
- **Database**: PostgreSQL trên [Neon](https://neon.tech) (serverless Postgres, có gói free). Chỉ cần dán chuỗi kết nối Neon vào `DATABASE_URL`.

Số tiền lưu dạng **số nguyên đồng (VND)**. Dương = thu, âm = chi.

---

## 🚀 Chạy dự án ở máy local

Cần **Node.js 18+** và một database PostgreSQL trên [Neon](https://neon.tech) (miễn phí, không cần cài Postgres/Docker ở máy).

**Tạo database Neon:** đăng ký tại neon.tech → tạo project → copy **connection string** (dạng `postgresql://user:pass@ep-xxx.aws.neon.tech/dbname?sslmode=require`).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # tạo file .env (Windows: copy .env.example .env)
# Mở .env, dán chuỗi kết nối Neon vào DATABASE_URL
npm run setup             # tạo bảng trên Neon + seed dữ liệu demo
npm run dev               # chạy API ở http://localhost:4000
```

### 2. Frontend (mở terminal khác)

```bash
# ở thư mục gốc finance-react-app
npm install
npm run dev               # chạy web ở http://localhost:5173
```

Mở http://localhost:5173 và đăng nhập bằng tài khoản demo, hoặc bấm **"Dùng tài khoản demo"**.

> Nếu login báo lỗi kết nối: kiểm tra backend đã chạy ở cổng 4000 chưa.

---

## ⚙️ Biến môi trường

### Backend (`server/.env`)

| Biến | Mô tả | Mặc định dev |
|------|-------|--------------|
| `DATABASE_URL` | Chuỗi kết nối Neon PostgreSQL (có `?sslmode=require`) | — (bắt buộc) |
| `JWT_SECRET` | Khóa ký token (bắt buộc đổi ở production) | `dev-secret-change-me...` |
| `PORT` | Cổng API | `4000` |
| `CORS_ORIGIN` | Origin frontend được phép gọi | `http://localhost:5173` |
| `NODE_ENV` | `development` / `production` | `development` |

### Frontend (`.env`)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `VITE_API_URL` | URL backend | `http://localhost:4000` |

---

## 📡 API

Tất cả endpoint (trừ đăng ký/đăng nhập) yêu cầu header `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth/register` — `{ name, email, password }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` → `{ user }`

### Ví (Accounts)
- `GET    /api/accounts` — danh sách ví kèm số dư + thống kê tháng
- `POST   /api/accounts` — `{ name, accent? }`
- `PATCH  /api/accounts/:id`
- `DELETE /api/accounts/:id`

### Giao dịch (Thu/Chi)
- `GET    /api/transactions?accountId=&category=&type=&search=`
- `POST   /api/transactions` — `{ accountId, amount, description, category, status, date }`
- `PATCH  /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Tiết kiệm
- `GET    /api/savings`
- `POST   /api/savings` — `{ name, targetAmount, currentAmount?, deadline?, accent? }`
- `PATCH  /api/savings/:id`
- `POST   /api/savings/:id/deposit` — `{ amount }` (âm = rút, clamp ≥ 0)
- `DELETE /api/savings/:id`

### Ngân sách
- `GET    /api/budgets?month=YYYY-MM` — hạn mức + số đã chi thực tế trong tháng
- `POST   /api/budgets` — `{ category, limit, month? }` (upsert)
- `DELETE /api/budgets/:id`

### Báo cáo
- `GET /api/reports/summary?from=&to=` — tổng thu/chi, theo danh mục, theo tháng
- `GET /api/reports/export.csv?from=&to=` — xuất CSV

---

## 🧪 Kiểm thử & build

```bash
# Backend — 16 test (Node test runner + supertest)
cd server && npm test

# Frontend — lint + build production
npm run lint
npm run build
```

---

## ☁️ Deploy

- **Frontend → Vercel**: build command `npm run build`, output `dist`. Đặt `VITE_API_URL` = domain backend.
- **Backend → Railway/Render**: đây là Express server chạy liên tục (KHÔNG deploy lên Vercel serverless). Đặt `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (khớp domain Vercel), `NODE_ENV=production`.
- **Database → Neon PostgreSQL**: tạo project trên [neon.tech](https://neon.tech), copy connection string (có `?sslmode=require`) vào `DATABASE_URL`. Dùng chung một Neon DB cho cả local lẫn production, hoặc tạo 2 branch riêng. Chạy `npm run setup` (hoặc `npm run prisma:push && npm run seed`) một lần để tạo bảng + seed.

Sau khi có domain Vercel, nhớ cập nhật `CORS_ORIGIN` ở backend cho khớp.

---

## ✨ Tính năng

- ✅ Đăng ký / đăng nhập / JWT
- ✅ Dashboard tổng quan (số dư, thu/chi tháng, biểu đồ)
- ✅ Thu/Chi: thêm / sửa / xóa, lọc theo loại–danh mục–từ khóa
- ✅ Tiết kiệm: mục tiêu, nạp/rút, theo dõi tiến độ
- ✅ Ngân sách: đặt hạn mức theo danh mục, cảnh báo vượt mức
- ✅ Biểu đồ thu/chi theo tháng + phân bổ theo danh mục (Recharts)
- ✅ Báo cáo tổng hợp + xuất CSV
- ✅ Nhiều ví, chuyển đổi nhanh
- ✅ Responsive (desktop + mobile)
