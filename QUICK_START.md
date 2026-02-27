# 快速开始部署到 Vercel

## ✅ 准备工作已完成

以下文件已经准备好：

1. ✅ `server/api/ttft-vercel-proxy.ts` - Vercel Edge Function
2. ✅ `vercel.json` - Vercel 配置（强制美国东部区域）
3. ✅ `.vercelignore` - 部署排除文件
4. ✅ `package.json` - 已添加 `deploy:vercel` 脚本

## 🚀 部署步骤

### 方法1：交互式部署（推荐首次使用）

```bash
cd /Users/bytedance/nuxt-mix-template111
vercel
```

按照提示操作：
1. 登录或创建 Vercel 账户
2. 输入项目名称
3. 选择项目目录（当前目录）
4. 等待部署完成

### 方法2：一键生产部署（推荐快速部署）

```bash
cd /Users/bytedance/nuxt-mix-template111
npm run deploy:vercel
```

### 方法3：预览部署（用于测试）

```bash
cd /Users/bytedance/nuxt-mix-template111
npm run deploy:vercel:preview
```

## 📋 部署后获取 URL

部署成功后，Vercel 会显示：
- 预览 URL：`https://your-project-xxx.vercel.app`
- 生产 URL：`https://your-project.vercel.app`

## ✅ 验证部署

### 1. 测试 Edge Function

```bash
# 替换为你的实际 URL
curl -X POST 'https://your-project.vercel.app/api/ttft-vercel-proxy' \
  -H 'Content-Type: application/json' \
  -d '{
    "endpoint": "https://httpbin.org/ip",
    "apiKey": "test",
    "payload": {}
  }' \
  -i
```

### 2. 检查响应头

响应应该包含：

```http
X-Region: us-vercel-edge
X-Vercel-Region: iad1        ← 美国东部（关键！）
X-Vercel-Deployment-ID: xxx
X-Request-ID: xxx
X-Timestamp: 2026-02-27T...
```

**确认 `X-Vercel-Region: iad1` 表示请求从美国东部发起！**

## 🎯 使用方法

### 1. 在页面中配置

1. 打开你的 TTFT 测试页面
2. 选择"**美国（Vercel Edge - 强制）⭐**"
3. 填入 Vercel URL：
   ```
   https://your-project.vercel.app/api/ttft-vercel-proxy
   ```
4. 填写两条链路的 API Key
5. 点击"同步测试"

### 2. 验证结果

每条链路底部会显示：

```
🌐 请求来源验证
✓ 已验证

代理类型：Vercel Edge (强制)
Worker区域：us-vercel-edge
数据中心：iad1
城市：---
国家：US
请求ID：xxx
时间戳：2026-02-27T...
```

**关键验证点**：
- `数据中心：iad1` → 确认美国东部
- `国家：US` → 确认美国
- 两条链路的这些信息**完全相同** → 确认同一节点

## 📊 区域代码参考

| 代码 | 位置 |
|------|------|
| `iad1` | 美国东部（华盛顿） |
| `sfo1` | 美国西部（旧金山） |
| `dfw2` | 美国中部（达拉斯） |
| `hkg1` | 香港 |
| `sin1` | 新加坡 |
| `nrt1` | 东京 |

当前配置使用 `iad1`（美国东部）。

## 🔧 配置修改

### 修改区域

编辑 `vercel.json` 中的 `regions` 字段：

```json
{
  "regions": ["iad1"]  // 修改为想要的区域
}
```

### 添加多个区域（负载均衡）

```json
{
  "regions": ["iad1", "sfo1", "dfw2"]
}
```

重新部署：`npm run deploy:vercel`

## 📈 监控和日志

### Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 查看：
   - **Functions** 标签：Edge Function 调用日志
   - **Analytics** 标签：流量和性能数据
   - **Logs** 标签：实时日志流

### 查看实时日志

```bash
vercel logs
```

## 🆘 故障排查

### 问题：部署失败

**错误**：`Invalid build command`

**解决**：确认 `vercel.json` 中的 `buildCommand` 正确

### 问题：区域不是美国

**检查**：`X-Vercel-Region` 不是 `iad1`

**解决**：
1. 确认 `vercel.json` 中有 `regions: ["iad1"]`
2. 重新部署：`npm run deploy:vercel`

### 问题：404 Not Found

**错误**：`API route not found`

**解决**：
1. 确认 `server/api/ttft-vercel-proxy.ts` 文件存在
2. 确认 URL 路径是 `/api/ttft-vercel-proxy`

### 问题：CORS 错误

**解决**：Edge Function 已配置 CORS 头，确保：
- 正确的请求方法（POST）
- 正确的请求头（Content-Type）

## 📞 获取帮助

- Vercel 文档：https://vercel.com/docs
- Vercel 支持：https://vercel.com/support

---

## 🎉 完成！

现在你可以：
1. ✅ 使用 Vercel Edge Function 从美国发起请求
2. ✅ 通过 `X-Vercel-Region: iad1` 验证来源
3. ✅ 对比两条链路的 TTFT 性能
4. ✅ 在 Dashboard 中监控请求日志
