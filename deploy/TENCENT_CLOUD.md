# 腾讯云部署指南

## 架构说明

| 组件 | 作用 |
|------|------|
| `dist/` | 前端静态页面（React 构建产物） |
| `deploy/server.mjs` | Node 服务：托管页面 + 代理 Coze / 讯飞 API |
| Nginx（可选） | 绑定域名、HTTPS |

生产环境 **Token 只留在服务器**，浏览器通过 `/api/coze-agent` 等同源接口访问，不会暴露密钥。

---

## 一、服务器准备

推荐：**腾讯云 CVM**（Ubuntu 22.04 / CentOS 7+）

1. 安全组放行端口：**80**、**443**（若用 Nginx）、或 **3000**（若直接访问 Node）
2. 安装 Node.js 18+：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

## 二、上传项目

任选一种方式：

```bash
# 方式 A：git 拉取
git clone <你的仓库> learning-assistant-react
cd learning-assistant-react

# 方式 B：本机打包上传（不要传 node_modules）
# 在本机：tar czf app.tgz learning-assistant-react --exclude=node_modules
# 上传到服务器后解压
```

---

## 三、配置环境变量

```bash
cd learning-assistant-react

# 前端构建配置（不含 Token）
cp .env.production.example .env.production

# 服务器密钥（仅服务器可见，勿提交 git）
nano .env.production.local
```

`.env.production.local` 示例：

```env
VITE_COZE_API_TOKEN=pat_你的Token
XFYUN_APP_ID=你的讯飞AppId
XFYUN_API_KEY=你的讯飞ApiKey
XFYUN_API_SECRET=你的讯飞ApiSecret
PORT=3000
```

---

## 四、构建并启动

```bash
npm install
npm run build
npm run start
```

浏览器访问：`http://服务器公网IP:3000`

---

## 五、后台常驻（PM2）

```bash
sudo npm install -g pm2
cd learning-assistant-react
pm2 start deploy/server.mjs --name learning-assistant
pm2 save
pm2 startup
```

常用命令：

```bash
pm2 logs learning-assistant
pm2 restart learning-assistant
```

---

## 六、绑定域名 + HTTPS（推荐）

1. 域名解析到服务器公网 IP
2. 安装 Nginx：`sudo apt install nginx`
3. 复制并修改配置：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/learning-assistant
sudo nano /etc/nginx/sites-available/learning-assistant   # 改 server_name
sudo ln -s /etc/nginx/sites-available/learning-assistant /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

4. 申请免费 SSL（腾讯云 SSL 或 certbot）后改为 `listen 443 ssl`

此时安全组只需放行 **80 / 443**，**3000 仅本机访问**。

---

## 七、平板 / 手机访问

部署完成后，用浏览器打开：

```
https://你的域名
```

或 `http://公网IP:3000`（未配域名时）

---

## 八、更新发布

```bash
cd learning-assistant-react
git pull          # 或重新上传代码
npm install
npm run build
pm2 restart learning-assistant
```

---

## 常见问题

**Q：对话报 502 / Token 错误？**  
检查 `.env.production.local` 里的 `VITE_COZE_API_TOKEN` 是否正确。

**Q：语音输入不可用？**  
检查讯飞三个环境变量，且浏览器需允许麦克风权限（HTTPS 站点更稳定）。

**Q：刷新子页面 404？**  
必须使用 `deploy/server.mjs` 或 Nginx 代理到 Node，不要只用静态文件服务器直接托管 dist。

**Q：生词听写朗读没声音？**  
平板 / 手机请用 Chrome、Safari，并先点一次页面（部分浏览器需用户交互后才允许语音）。
