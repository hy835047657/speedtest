// Nuxt Edge Function for Vercel - TTFT API Proxy (US Region)
// 使用 Edge Runtime 强制指定区域

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res

  // OPTIONS 预检请求处理
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.end()
    return
  }

  // 只处理 POST 请求
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  // 解析请求体
  let body = ''
  for await (const chunk of req) {
    body += chunk.toString()
  }

  let parsedBody = {}
  try {
    parsedBody = JSON.parse(body)
  } catch {
    parsedBody = {}
  }

  const endpoint = (parsedBody?.endpoint || '').trim()
  const apiKey = (parsedBody?.apiKey || '').trim()
  const payload = parsedBody?.payload || {}

  // 验证参数
  if (!endpoint || !payload) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing endpoint or payload' }))
    return
  }

  if (!apiKey) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing API Key. Please enter your API Key in form.' }))
    return
  }

  // 设置响应头
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Expose-Headers', 'X-Region, X-Vercel-Region, X-Vercel-Deployment-ID, X-Request-ID')
  
  // 区域标识
  const vercelRegion = process.env.VERCEL_REGION || 'iad1'
  const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
  const requestId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
  const timestamp = new Date().toISOString()

  res.setHeader('X-Region', 'us-vercel-edge')
  res.setHeader('X-Vercel-Region', vercelRegion)
  res.setHeader('X-Vercel-Deployment-ID', vercelDeploymentId)
  res.setHeader('X-Request-ID', requestId)
  res.setHeader('X-Timestamp', timestamp)

  const controller = new AbortController()
  req.on('close', () => controller.abort())

  // 转发请求到目标 API
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': `Nuxt-Edge-TTFT-Proxy/1.0 (US Region - ${vercelRegion})`,
  }

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: controller.signal
  })

  // 错误处理
  if (!upstream.ok) {
    const errorText = await safeReadText(upstream)
    res.write(`data: ${JSON.stringify({ error: `Upstream ${upstream.status}`, detail: errorText })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
    return
  }

  if (!upstream.body) {
    const errorText = await safeReadText(upstream)
    res.write(`data: ${JSON.stringify({ error: 'Upstream has no body', detail: errorText })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
    return
  }

  // 流式转发
  const reader = upstream.body.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) res.write(value)
  }
  res.end()
})

// 安全读取文本
async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}
