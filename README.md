# Photo Selection Platform (SaaS)

Nền tảng chọn ảnh yêu thích cho photographer và khách hàng — phong cách hiện đại như S2 Photo Picker.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React (Vite), Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon DB) |

## Cấu trúc

```
photolo/
├── server/
│   ├── config/db.js
│   ├── services/
│   ├── controllers/
│   ├── routes/
│   └── server.js
└── client/
    └── src/
        ├── pages/      Home, Album, Admin
        ├── components/ ImageGrid, ImageCard, AlbumCard
        └── api.js
```

## Cài đặt

### 1. Database (Neon PostgreSQL)

1. Tạo project tại [neon.tech](https://neon.tech)
2. Copy connection string vào `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

Schema tự động tạo khi server khởi động.

### 2. Backend

```bash
cd server
npm install
node server.js
```

→ http://localhost:5000

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

→ http://localhost:5173

## API

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/albums` | Tạo album |
| GET | `/api/albums` | Danh sách album |
| GET | `/api/albums/:id` | Album + ảnh |
| POST | `/api/images` | Thêm ảnh |
| GET | `/api/images/:albumId` | Ảnh (pagination) |
| PATCH | `/api/images/:id` | Toggle chọn |

## Deploy — `photolo.thedeptrai.io.vn`

| | |
|---|---|
| Domain | `thedeptrai.io.vn` |
| Subdomain app | **`photolo.thedeptrai.io.vn`** |
| Admin | https://photolo.thedeptrai.io.vn/login |
| Khách | https://photolo.thedeptrai.io.vn/album/{id} |

Hướng dẫn chi tiết: **[deploy/HUONG-DAN-thedeptrai.io.vn.md](deploy/HUONG-DAN-thedeptrai.io.vn.md)**

### DNS — bạn cần thêm 1 bản ghi

Vào trang quản lý domain `thedeptrai.io.vn`:

| Cách | Loại | Tên | Giá trị |
|------|------|-----|---------|
| **VPS** | A | `photolo` | IP máy chủ |
| **Render** | CNAME | `photolo` | hostname Render cung cấp |

### Chạy production (VPS)

```bash
npm run install:all
npm run build
# server/.env thêm NODE_ENV=production
bash deploy/setup-vps.sh
```

Nginx sẵn: `deploy/nginx.thedeptrai.io.vn.conf`

### Hoặc Render (không cần VPS)

Push GitHub → Render Blueprint (`render.yaml`) → Custom Domain `photolo.thedeptrai.io.vn` → CNAME DNS.

## Luồng sử dụng

1. **Photographer:** `/admin` → tạo album → thêm URL ảnh → copy link
2. **Client:** `/album/:id` → xem masonry gallery → click ❤️ chọn ảnh
3. Trạng thái lưu PostgreSQL, refresh vẫn giữ nguyên

## Tính năng

- Masonry grid gallery fullscreen
- Optimistic UI khi chọn ảnh
- Infinite scroll pagination
- Copy link chia sẻ
- Export JSON ảnh đã chọn
- Google Drive link lưu metadata (MVP)
- Mobile-first responsive UI
