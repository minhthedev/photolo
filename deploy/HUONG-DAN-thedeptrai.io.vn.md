# Deploy PhotoLo lên `photolo.thedeptrai.io.vn`

| Mục | Giá trị |
|-----|---------|
| Domain chính | `thedeptrai.io.vn` |
| Subdomain app | `photolo.thedeptrai.io.vn` |
| Admin | https://photolo.thedeptrai.io.vn/login |
| Khách chọn ảnh | https://photolo.thedeptrai.io.vn/album/{id} |

---

## Bước 1 — Trỏ DNS trên **Tenten** (domain: `thedeptrai.io.vn`)

### Kiểm tra trước

Tên miền phải dùng **Name Server của Tenten** (NS tenten). Kiểm tra tại [domain.tenten.vn](https://domain.tenten.vn) hoặc [dnschecker.org](https://dnschecker.org).

### Cách thêm bản ghi trên Tenten

1. Vào **[https://domain.tenten.vn](https://domain.tenten.vn)** → đăng nhập
2. Chọn tên miền **`thedeptrai.io.vn`**
3. Mục **Quản lý DNS** → bấm **Thêm**
4. Thêm bản ghi theo cách deploy bạn chọn:

#### Nếu dùng Render (khuyên dùng — free)

Sau khi Render → Custom Domains → thêm `photolo.thedeptrai.io.vn`, Render sẽ cho hostname (vd: `photolo-xxxx.onrender.com`).

| Host / Tên | Loại (Type) | Giá trị (Value) |
|------------|-------------|-----------------|
| `photolo` | **CNAME** | hostname Render cung cấp (vd: `photolo-xxxx.onrender.com`) |

5. Bấm **Lưu** → **Cập nhật trạng thái DNS**
6. Đợi **5–30 phút** (Tenten có thể chậm tới vài giờ)

> **Lưu ý Tenten:** Ô **Tên** chỉ ghi `photolo`, không ghi `photolo.thedeptrai.io.vn`. CNAME không được điền IP.

#### Nếu dùng VPS

| Host / Tên | Loại (Type) | Giá trị (Value) |
|------------|-------------|-----------------|
| `photolo` | **A** | IP VPS (vd: `103.x.x.x`) |

Tài liệu Tenten: [Hướng dẫn cấu hình DNS](https://help.tenten.vn/huong-dan-cau-hinh-dns-tai-tenten/)

---

## Bước 2A — Deploy trên VPS Linux

```bash
# Trên máy Windows: upload code lên VPS (hoặc git clone)
ssh root@IP_VPS

git clone https://github.com/BAN/photolo.git /var/www/photolo
cd /var/www/photolo

# Copy và sửa env
cp server/.env.example server/.env
nano server/.env   # điền DATABASE_URL, GOOGLE_API_KEY, ADMIN_*, JWT_SECRET
# thêm dòng: NODE_ENV=production

bash deploy/setup-vps.sh
```

---

## Bước 2B — Deploy trên Render (miễn phí, dễ hơn VPS)

1. Push project lên GitHub
2. Vào [render.com](https://render.com) → **New** → **Blueprint** → chọn repo
3. Điền biến môi trường (copy từ `server/.env`):
   - `DATABASE_URL`
   - `GOOGLE_API_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
4. Deploy xong → **Custom Domain** → `photolo.thedeptrai.io.vn`
5. Làm Bước 1 CNAME theo hướng dẫn Render

---

## Bước 3 — Kiểm tra

```bash
# DNS đã trỏ chưa
nslookup photolo.thedeptrai.io.vn

# API sống
curl https://photolo.thedeptrai.io.vn/api/health
# → {"status":"ok"}
```

Mở trình duyệt:
- https://photolo.thedeptrai.io.vn/login — đăng nhập admin
- Tạo album → copy link `/album/...` gửi khách

---

## File env production (`server/.env`)

```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://...
GOOGLE_API_KEY=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mat_khau_manh
JWT_SECRET=chuoi_bi_mat_dai
```

Không cần `ALLOWED_ORIGINS` vì frontend và API cùng domain.

---

## Gặp lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| DNS không resolve | Kiểm tra bản ghi A/CNAME, đợi thêm 30 phút |
| 502 Bad Gateway | App chưa chạy — `pm2 status` hoặc xem log Render |
| SSL không có | Chạy `certbot` (VPS) hoặc bật HTTPS trên Render |
| Ảnh Drive lỗi | Folder Drive phải share **Anyone with the link** |
