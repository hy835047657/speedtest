# Cloudflare Worker 部署指南

这个 Cloudflare Worker 将作为美国区域的代理服务器，用于 TTFT 时延对比测试。

## 部署步骤

### 1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler login
```

### 3. 部署 Worker
```bash
cd /Users/bytedance/nuxt-mix-template111/cloudflare-worker
wrangler deploy
```

### 4. 获取 Worker URL
部署完成后，Wrangler 会显示类似：
```
Published ttft-proxy-us (1.23 sec)
  https://ttft-proxy-us.your-subdomain.workers.dev
```

记下这个 URL，后续需要在项目中使用。

## Worker 特性

- ✅ 部署到 Cloudflare 全球边缘网络
- ✅ 请求从最近的美国节点发起
- ✅ 支持流式响应
- ✅ 添加 CORS 支持
- ✅ 免费套餐：每月 100,000 次请求
- ✅ 自动添加区域信息到响应头

## 使用方法

部署后，在前端代码中调用：
```javascript
const response = await fetch('https://ttft-proxy-us.your-subdomain.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: 'your-api-endpoint',
    apiKey: 'your-api-key',
    payload: { ... }
  })
})
```
