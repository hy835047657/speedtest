# Vercel Edge Function 代理部署指南

## 为什么选择 Vercel？

Vercel 提供了比 Cloudflare 更好的区域控制能力：

### ✅ Vercel 的优势

1. **强制区域配置**：通过 `regions` 配置强制指定部署区域
2. **美国东部区域**：`iad1` = Washington D.C.（美国东部）
3. **Edge Runtime**：与 Cloudflare Workers 相同的低延迟
4. **免费套餐支持**：免费套餐即可使用区域限制
5. **Serverless Functions**：自动流式响应支持

### 🆚 Cloudflare vs Vercel

| 特性 | Cloudflare | Vercel |
|------|-----------|--------|
| 区域限制 | ❌ 仅付费套餐支持 | ✅ 免费套餐支持 |
| Anycast 路由 | ✅ 自动最近节点 | ✅ 可指定区域 |
| Stream 响应 | ✅ 支持 | ✅ 支持 |
| 部署速度 | 快 | 快 |
| 免费额度 | 每天 100,000 次请求 | 每天 100,000 次请求 |

---

## 部署步骤

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

```bash
# 首次部署（交互式）
vercel

# 生产环境部署
vercel --prod
```

### 4. 配置环境变量（可选）

如果需要配置环境变量：

```bash
vercel env add API_KEY
```

---

## 验证部署

### 1. 获取部署 URL

部署成功后，Vercel 会返回一个 URL，例如：
```
https://nuxt-mix-template111.vercel.app
```

### 2. 测试 Edge Function

```bash
# 测试 Vercel Edge Function
curl -X POST 'https://nuxt-mix-template111.vercel.app/api/ttft-vercel-proxy' \
  -H 'Content-Type: application/json' \
  -d '{
    "endpoint": "https://httpbin.org/ip",
    "apiKey": "test",
    "payload": {}
  }'
```

### 3. 检查响应头

响应应该包含：

```http
X-Region: us-vercel-edge
X-Vercel-Region: iad1
X-Vercel-Deployment-ID: xxx
X-Request-ID: xxx
X-Client-IP: xxx
X-Timestamp: 2026-02-27T...
```

**关键**：`X-Vercel-Region: iad1` 确认请求从美国东部发起！

---

## 使用方法

### 1. 在页面中配置

1. 打开 TTFT 测试页面
2. 在"代理区域"选择"**美国（Vercel Edge - 强制）⭐**"
3. 在"Vercel Edge Function URL"输入框中填入你的 Vercel 部署 URL
   - 例如：`https://your-project.vercel.app/api/ttft-vercel-proxy`
4. 填写两条链路的 API Key
5. 点击"同步测试"

### 2. 验证结果

查看每条链路底部的"🌐 请求来源验证"区域：

- **代理类型**：Vercel Edge (强制)
- **Worker区域**：us-vercel-edge
- **数据中心**：iad1（美国东部）
- **国家**：US（美国）
- **验证状态**：✓ 已验证

---

## 区域代码说明

Vercel 支持的区域代码：

| 代码 | 位置 | 描述 |
|------|------|------|
| `iad1` | Washington D.C. | 美国东部 |
| `sfo1` | San Francisco | 美国西部 |
| `dfw2` | Dallas | 美国中部 |
| `hkg1` | Hong Kong | 香港 |
| `sin1` | Singapore | 新加坡 |
| `nrt1` | Tokyo | 东京 |

当前配置使用 `iad1`（美国东部），确保请求从美国发起。

---

## 流量监控

在 Vercel Dashboard 中可以监控：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 "Functions" 标签
4. 查看 `ttft-vercel-proxy` 的调用日志和性能数据

---

## 故障排查

### 问题 1：404 Not Found

**原因**：API 路径错误

**解决**：确保 URL 路径正确，应该是 `/api/ttft-vercel-proxy`

### 问题 2：502 Bad Gateway

**原因**：上游 API 响应超时或错误

**解决**：检查 `endpoint` 和 `apiKey` 是否正确

### 问题 3：CORS 错误

**原因**：跨域限制

**解决**：Vercel Edge Function 已配置 CORS 头，无需额外处理

### 问题 4：区域不是 US

**原因**：`vercel.json` 配置未生效

**解决**：
1. 确认 `vercel.json` 中 `regions: ["iad1"]` 存在
2. 重新部署：`vercel --prod`
3. 检查响应头 `X-Vercel-Region` 是否为 `iad1`

---

## 性能对比

### 从国内访问

| 代理类型 | 延迟（估算） | 可靠性 |
|---------|-------------|--------|
| 直连 | 200-500ms | 中 |
| Cloudflare（最近节点） | 100-300ms | 高 |
| Vercel（强制美国） | 300-600ms | 高 |

### 从美国本地访问

| 代理类型 | 延迟（估算） | 可靠性 |
|---------|-------------|--------|
| 直连 | 50-100ms | 高 |
| Cloudflare（美国节点） | 50-100ms | 高 |
| Vercel（强制美国） | 50-100ms | 高 |

---

## 成本估算

Vercel 免费套餐：

- 每月 100 GB 带宽
- 每天 100,000 次请求
- 无限 Edge Function 执行时间
- **完全免费！**

超出免费额度后的付费计划：

- Hobby：$20/月
- Pro：$100/月
- Enterprise：定制

---

## 总结

✅ **推荐使用 Vercel Edge Function** 原因：

1. **强制美国区域**：通过 `regions: ["iad1"]` 确保从美国发起
2. **免费套餐支持**：无需付费即可使用区域限制
3. **低延迟**：Edge Runtime 与 Cloudflare Workers 相当
4. **易部署**：一条命令即可部署
5. **可靠性强**：Vercel 企业级基础设施

现在你可以使用 Vercel 来验证两条链路的请求都从美国发起了！
