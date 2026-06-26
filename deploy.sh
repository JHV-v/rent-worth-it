#!/bin/bash
# 京东云服务器手动部署脚本
# 用法：/var/www/rent-app/deploy.sh
# 或登录服务器后：cd /var/www/rent-app && ./deploy.sh
set -e

APP_DIR="/var/www/rent-app"
APP_NAME="rent-app"

cd "$APP_DIR"

echo "==> [1/5] 拉取最新代码..."
git fetch --all --tags
git pull --ff-only

echo "==> [2/5] 安装依赖..."
npm install --no-audit --no-fund

echo "==> [3/5] 构建生产产物..."
npm run build

echo "==> [4/5] 重启 PM2 服务..."
pm2 restart "$APP_NAME" --update-env

echo "==> [5/5] 检查运行状态..."
pm2 status

echo ""
echo "✅ 部署完成！当前版本：$(node -p "require('./package.json').version")"
