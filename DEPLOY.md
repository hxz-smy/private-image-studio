# 部署到自己的服务器

以下流程以 Ubuntu 服务器为例，适合把这个私用文生图网页部署到公网或内网服务器。

## 1. 准备服务器

安装 Node.js 20+、Git、Nginx、PM2：

```bash
sudo apt update
sudo apt install -y git nginx

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

检查版本：

```bash
node -v
npm -v
pm2 -v
```

## 2. 上传项目

任选一种方式：

```bash
git clone <你的仓库地址> private-image-studio
cd private-image-studio
```

或用 SFTP/宝塔/面板把项目上传到服务器目录，例如：

```bash
/opt/private-image-studio
```

## 3. 配置环境变量

在项目根目录创建 `.env.production`：

```bash
nano .env.production
```

写入：

```env
DEFAULT_IMAGE_BASE_URL=https://www.lingxiapi.com/v1
DEFAULT_IMAGE_MODEL=gpt-image-2
```

不要把图片 API key 写进这里。网页上已经提供输入框，适合你临时切换不同中转 key。

## 4. 安装依赖并构建

```bash
npm install
npm run build
```

## 5. 用 PM2 启动

```bash
pm2 start npm --name private-image-studio -- start -- -H 127.0.0.1 -p 3000
pm2 save
pm2 startup
```

查看状态：

```bash
pm2 status
pm2 logs private-image-studio
```

## 6. 配置 Nginx 反向代理

创建配置：

```bash
sudo nano /etc/nginx/sites-available/private-image-studio
```

写入，把 `your-domain.com` 换成你的域名：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect http://localhost:3000/ /;
        proxy_redirect http://127.0.0.1:3000/ /;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/private-image-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. 配置 HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 8. 更新项目

以后更新代码：

```bash
cd /opt/private-image-studio
git pull
npm install
npm run build
pm2 restart private-image-studio
```

## 9. 常用排错

查看应用日志：

```bash
pm2 logs private-image-studio
```

查看 Nginx 日志：

```bash
sudo tail -f /var/log/nginx/error.log
```

确认端口：

```bash
ss -lntp | grep 3000
```

确认环境变量是否生效：

```bash
pm2 env private-image-studio
```
