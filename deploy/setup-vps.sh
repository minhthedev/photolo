#!/bin/bash
# Chạy trên VPS Ubuntu/Debian (đã SSH vào server)
# Usage: bash deploy/setup-vps.sh

set -e

DOMAIN="photolo.thedeptrai.io.vn"
APP_DIR="${APP_DIR:-/var/www/photolo}"

echo "==> Cài Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Cài Nginx + Certbot..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx git

echo "==> Build app tại $APP_DIR..."
cd "$APP_DIR"
npm run install:all
npm run build

echo "==> Cấu hình Nginx..."
sudo cp deploy/nginx.thedeptrai.io.vn.conf /etc/nginx/sites-available/photolo
sudo ln -sf /etc/nginx/sites-available/photolo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "==> Cài SSL (Let's Encrypt)..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@thedeptrai.io.vn || true

echo "==> Cài PM2 (giữ app chạy nền)..."
sudo npm install -g pm2
cd "$APP_DIR/server"
pm2 delete photolo 2>/dev/null || true
NODE_ENV=production pm2 start server.js --name photolo
pm2 save
pm2 startup | tail -1 | bash || true

echo ""
echo "Xong! Mở: https://$DOMAIN/login"
echo "Nhớ thêm NODE_ENV=production vào server/.env trước khi chạy."
