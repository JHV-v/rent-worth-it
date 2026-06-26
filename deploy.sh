#!/bin/bash
# 京东云服务器手动部署脚本
# 用法：/var/www/rent-app/deploy.sh
# 或登录服务器后：cd /var/www/rent-app && ./deploy.sh
set -e

APP_DIR="/var/www/rent-app"
APP_NAME="rent-app"

cd "$APP_DIR"

echo "==> [1/6] 拉取最新代码（强制对齐远程）..."
git fetch --all --tags
git reset --hard origin/main

echo "==> [2/6] 当前代码版本号..."
VERSION=$(node -p "require('./package.json').version")
echo "  📦 $VERSION"

echo "==> [3/6] 安装依赖..."
npm install --no-audit --no-fund

echo "==> [4/6] 构建生产产物..."
npm run build

echo "==> [5/6] 重启 PM2 服务..."
pm2 restart "$APP_NAME" --update-env

echo "==> [6/6] 健康检查..."
sleep 3
for i in 1 2 3 4 5; do
  if curl -fsS --max-time 5 -o /dev/null http://localhost:3000; then
    echo "  ✅ 健康检查通过（第 $i 次尝试）"
    break
  fi
  if [ "$i" = "5" ]; then
    echo "❌ 服务无响应，部署失败"
    pm2 logs "$APP_NAME" --lines 30 --nostream
    exit 1
  fi
  echo "  ⏳ 等待服务启动... (第 $i 次)"
  sleep 3
done

pm2 status
echo ""
echo "🎉 部署成功！上线版本：$VERSION"
