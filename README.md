# Car Parts API (NNPTUD_DuAn)

Backend API cho hệ thống tra cứu và bán phụ tùng ô tô, xây dựng bằng **Node.js + Express + MySQL**.

## 1) Công nghệ sử dụng

- Node.js (Express)
- MySQL 8
- `mysql2` (driver + connection pool)
- `jsonwebtoken` (JWT auth)
- `express-validator` (validate input)
- `nodemailer` (gửi OTP qua email)

## 2) Cấu trúc thư mục chính

```text
.
├─ database/
│  ├─ schema.sql        # Tạo schema/tables
│  └─ seed.sql          # Seed dữ liệu mẫu
├─ src/
│  ├─ config/db.js      # Kết nối MySQL
│  ├─ controllers/      # Xử lý business logic
│  ├─ middlewares/      # Auth + validate
│  └─ routes/           # Khai báo endpoint
├─ server.js            # Entry point của ứng dụng
├─ Dockerfile
├─ docker-compose.yml
└─ .env.example
```

## 3) Yêu cầu môi trường

- Node.js >= 18 (khuyến nghị 20)
- npm >= 9
- MySQL 8 (nếu chạy local không dùng Docker)

## 4) Cài đặt & chạy local

### Bước 1: Cài dependencies

```bash
npm install
```

### Bước 2: Tạo file môi trường

Sao chép từ file mẫu:

```bash
cp .env.example .env
```

Trên Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Sau đó điền giá trị thật cho DB/JWT/MAIL trong `.env`.

### Bước 3: Khởi tạo database

Tạo DB và import schema + seed:

```bash
mysql -u <user> -p < database/schema.sql
mysql -u <user> -p < database/seed.sql
```

> Nếu dùng Docker Compose, bước này sẽ tự động chạy.

### Bước 4: Chạy server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Mặc định server chạy ở: `http://localhost:3000`

## 5) Chạy bằng Docker Compose

```bash
docker compose up --build
```

Services:

- API: `http://localhost:3000`
- MySQL: `localhost:3307` (map vào container `3306`)

Compose sẽ:

- Khởi tạo MySQL
- Tự động import `database/schema.sql` và `database/seed.sql`
- Chạy API sau khi DB healthy

## 6) Environment variables

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `PORT` | Port chạy API | `3000` |
| `DB_HOST` | Host MySQL | `127.0.0.1` (local) / `db` (docker) |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | User MySQL | `root` |
| `DB_PASSWORD` | Password MySQL | `your_db_password` |
| `DB_NAME` | Tên database | `car_parts_db` |
| `JWT_SECRET` | Secret ký JWT | `replace_with_random_secret` |
| `JWT_EXPIRES_IN` | TTL token | `24h` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | Email gửi OTP | `your_email@gmail.com` |
| `MAIL_PASS` | App password SMTP | `your_app_password` |

## 7) API base path và endpoint chính

Base URL: `http://localhost:3000/api/v1`

### Auth

- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/login`

### User (cần Bearer token)

- `GET /user/profile`
- `PUT /user/profile`
- `PUT /user/change-password`

### Danh mục/phụ tùng (public)

- `GET /brands`
- `GET /brands/:id/models`
- `GET /models/:id/years`
- `GET /years/:id/compatibility`
- `GET /categories`
- `GET /parts/search`
- `GET /parts/:id`

### Cart (cần Bearer token)

- `GET /cart/items`
- `POST /cart/items`
- `PUT /cart/items/:id`
- `DELETE /cart/items/:id`

### Orders (cần Bearer token)

- `POST /orders`
- `GET /orders`
- `GET /orders/:id`

### Admin (cần Bearer token + quyền admin)

- CRUD brands/models/model-years/categories/parts
- Quản lý người dùng
- Thống kê doanh thu

## 8) Scripts

- `npm run dev`: chạy development bằng nodemon
- `npm start`: chạy production

## 9) Bảo mật

- Không commit `.env` hoặc thông tin secret thật (JWT, DB password, SMTP password).
- Chỉ commit `.env.example` với placeholder.
