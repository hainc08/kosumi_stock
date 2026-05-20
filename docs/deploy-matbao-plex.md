# Hướng dẫn Deploy WMS lên Mắt Bão Plex (VPS)

**Domain:** `stock.kosumi.vn`  
**DB:** `kos59740_wms` trên cPanel  
**Stack:** Node.js 20 + Nginx + PM2

---

## Yêu cầu server

| Thành phần | Tối thiểu |
|---|---|
| OS | Ubuntu 22.04 LTS |
| RAM | 1 GB |
| Disk | 10 GB |
| Node.js | 20.x |

> Nếu đang dùng **Plex Shared Hosting** (không có SSH root): liên hệ Mắt Bão nâng lên gói **Plex VPS** hoặc **Cloud VPS** để chạy Node.js.

---

## BƯỚC 1 — Kết nối SSH vào server

```bash
ssh root@<IP_SERVER_MAT_BAO>
# Hoặc user được cấp:
ssh kos59740@<IP_SERVER_MAT_BAO>
```

---

## BƯỚC 2 — Cài Node.js 20, PM2, Nginx

```bash
# Cập nhật hệ thống
apt update && apt upgrade -y

# Cài Node.js 20 qua NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Kiểm tra
node -v   # v20.x.x
npm -v

# Cài PM2 (quản lý process Node.js)
npm install -g pm2

# Cài Nginx
apt install -y nginx

# Cài Certbot (SSL miễn phí)
apt install -y certbot python3-certbot-nginx
```

---

## BƯỚC 3 — Upload code lên server

**Cách A — Git (khuyến nghị):**
```bash
cd /var/www
git clone <URL_REPO> wms
cd wms
```

**Cách B — Upload thủ công qua SFTP (FileZilla):**
- Host: `<IP_SERVER>`, Port: `22`
- Upload thư mục project lên `/var/www/wms`

---

## BƯỚC 4 — Cấu hình Database

### 4.1 — Bật Remote MySQL trên cPanel
1. Đăng nhập cPanel tài khoản `kos59740`
2. **MySQL Databases → Remote MySQL**
3. Thêm IP của VPS Mắt Bão vào danh sách whitelist

### 4.2 — Cập nhật DATABASE_URL trong .env.production
```bash
# File backend/.env.production — sửa host thành IP cPanel nếu DB ở server khác
# Nếu cùng server: giữ nguyên localhost
# Nếu DB trên cPanel hosting khác VPS: đổi localhost → IP cPanel
DATABASE_URL=mysql://kos59740_admin:Su1dMt7kf#?Jpek0@localhost:3306/kos59740_wms
```

> **Lưu ý:** Nếu DB và VPS **cùng một server Mắt Bão** → giữ `localhost`.  
> Nếu DB trên **cPanel hosting riêng** → đổi `localhost` thành IP của server cPanel.

---

## BƯỚC 5 — Build và chạy Backend

```bash
cd /var/www/wms/backend

# Cài dependencies
npm ci

# Copy file env production
cp .env.production .env

# Generate Prisma client
npx prisma generate

# Build TypeScript → dist/
npm run build

# Chạy migration (tạo bảng nếu chưa có)
npx prisma migrate deploy

# Seed dữ liệu demo (chỉ chạy lần đầu)
npm run db:seed

# Khởi động bằng PM2
pm2 start dist/index.js --name wms-backend

# Tự khởi động lại khi reboot server
pm2 startup
pm2 save
```

Kiểm tra backend đang chạy:
```bash
pm2 status
curl http://localhost:3001/api/health
```

---

## BƯỚC 6 — Build Frontend

```bash
cd /var/www/wms/frontend

# Cài dependencies
npm ci

# Build với env production (dùng VITE_API_BASE_URL=https://stock.kosumi.vn/api)
npm run build -- --mode production

# Thư mục dist/ chứa file tĩnh đã build
ls dist/
```

---

## BƯỚC 7 — Cấu hình Nginx

Tạo file cấu hình Nginx cho domain:

```bash
nano /etc/nginx/sites-available/wms
```

Dán nội dung sau:

```nginx
server {
    listen 80;
    server_name stock.kosumi.vn;

    # Frontend — serve file tĩnh từ dist/
    root /var/www/wms/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — proxy đến Node.js port 3001
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Kích hoạt và kiểm tra:

```bash
# Kích hoạt site
ln -s /etc/nginx/sites-available/wms /etc/nginx/sites-enabled/

# Kiểm tra cú pháp
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## BƯỚC 8 — Cài SSL (HTTPS)

```bash
# Trỏ DNS trước: stock.kosumi.vn → IP server (A record trong cPanel/Mắt Bão)
# Sau khi DNS đã lan truyền (~5-30 phút), chạy:
certbot --nginx -d stock.kosumi.vn

# Certbot tự sửa nginx.conf thêm SSL
# Chọn option "Redirect" để tự chuyển HTTP → HTTPS
```

Sau bước này Nginx tự có block `listen 443 ssl` và redirect 80→443.

---

## BƯỚC 9 — Trỏ DNS

Vào quản lý DNS của domain `kosumi.vn` (tại Mắt Bão hoặc nhà đăng ký):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | stock | `<IP_SERVER_VPS>` | 300 |

---

## BƯỚC 10 — Kiểm tra cuối

```bash
# Backend health
curl https://stock.kosumi.vn/api/health

# Xem log backend
pm2 logs wms-backend

# Xem log Nginx
tail -f /var/log/nginx/error.log
```

Mở trình duyệt: **https://stock.kosumi.vn**

---

## Các lệnh quản lý thường dùng

```bash
# Xem trạng thái
pm2 status

# Restart backend (sau khi update code)
cd /var/www/wms/backend
git pull
npm run build
pm2 restart wms-backend

# Rebuild frontend
cd /var/www/wms/frontend
git pull
npm run build -- --mode production

# Reload nginx
systemctl reload nginx
```

---

## Cấu trúc thư mục trên server

```
/var/www/wms/
├── backend/
│   ├── .env            ← copy từ .env.production
│   ├── dist/           ← build output (chạy bởi PM2)
│   ├── prisma/
│   └── ...
└── frontend/
    └── dist/           ← build output (serve bởi Nginx)
```
