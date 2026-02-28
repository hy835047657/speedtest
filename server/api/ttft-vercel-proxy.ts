// Nuxt API Handler for Vercel - TTFT API Proxy (US Region)
// 使用 Node.js runtime 支持更多功能

export default defineEventHandler(async (event) => {
  const method = event.method || 'GET'

  // OPTIONS 预检请求处理
  if (method === 'OPTIONS') {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    return new Response(null, { status: 200 })
  }

  // 只处理 POST 请求
  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: any
  try {
    body = await readBody(event)
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Failed to parse request body', detail: String(e) }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const endpoint = body?.endpoint || ''
  const apiKey = body?.apiKey || ''
  const payload = body?.payload || {}

  // 验证参数
  if (!endpoint) {
    return new Response(
      JSON.stringify({ error: 'Missing endpoint parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing API Key. Please enter your API Key in form.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 获取请求的真实IP和地理位置信息
  const clientIP = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
                   getRequestHeader(event, 'x-real-ip') ||
                   'unknown'

  // Vercel 区域和环境信息
  const vercelRegion = process.env.VERCEL_REGION || 'iad1'
  const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
  const vercelEnv = process.env.VERCEL_ENV || 'production'
  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  // 根据区域代码获取城市和国家信息
  const regionMap: Record<string, { city: string; country: string; colo: string }> = {
    'iad1': { city: 'Washington D.C.', country: 'US', colo: 'IAD' },
    'hnd1': { city: 'Tokyo', country: 'JP', colo: 'HND' },
    'sfo1': { city: 'San Francisco', country: 'US', colo: 'SFO' },
    'cle1': { city: 'Cleveland', country: 'US', colo: 'CLE' },
    'iad2': { city: 'Washington D.C.', country: 'US', colo: 'IAD2' },
  }

  const regionInfo = regionMap[vercelRegion] || { city: 'Unknown', country: 'Unknown', colo: vercelRegion }

  const controller = new AbortController()

  // 转发请求到目标 API
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': `Nuxt-API-TTFT-Proxy/1.0 (US Region - ${vercelRegion})`,
  }

  let upstream: Response
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    })
  } catch (e) {
    const errorMessage = JSON.stringify({
      error: 'Failed to connect to upstream API',
      detail: String(e),
      endpoint,
      region: vercelRegion
    })
    return new Response(`data: ${errorMessage}\n\ndata: [DONE]\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Region': 'us-vercel-node',
        'X-Vercel-Region': vercelRegion,
        'X-Worker-City': regionInfo.city,
        'X-Worker-Country': regionInfo.country,
        'X-Worker-Colo': regionInfo.colo,
        'X-Client-IP': clientIP,
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp,
        'X-Vercel-Env': vercelEnv
      }
    })
  }

  // 错误处理
  if (!upstream.ok) {
    let errorText = ''
    try {
      errorText = await safeReadText(upstream)
    } catch {}
    const errorMessage = JSON.stringify({
      error: `Upstream API returned ${upstream.status}`,
      detail: errorText || upstream.statusText,
      endpoint,
      region: vercelRegion
    })
    return new Response(`data: ${errorMessage}\n\ndata: [DONE]\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Region': 'us-vercel-node',
        'X-Vercel-Region': vercelRegion,
        'X-Worker-City': regionInfo.city,
        'X-Worker-Country': regionInfo.country,
        'X-Worker-Colo': regionInfo.colo,
        'X-Client-IP': clientIP,
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp,
        'X-Vercel-Env': vercelEnv
      }
    })
  }

  if (!upstream.body) {
    const errorMessage = JSON.stringify({
      error: 'Upstream response has no body',
      endpoint,
      region: vercelRegion
    })
    return new Response(`data: ${errorMessage}\n\ndata: [DONE]\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Region': 'us-vercel-node',
        'X-Vercel-Region': vercelRegion,
        'X-Worker-City': regionInfo.city,
        'X-Worker-Country': regionInfo.country,
        'X-Worker-Colo': regionInfo.colo,
        'X-Client-IP': clientIP,
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp,
        'X-Vercel-Env': vercelEnv
      }
    })
  }

  // 流式转发
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Region': 'us-vercel-node',
      'X-Vercel-Region': vercelRegion,
      'X-Worker-City': regionInfo.city,
      'X-Worker-Country': regionInfo.country,
      'X-Worker-Colo': regionInfo.colo,
      'X-Client-IP': clientIP,
      'X-Vercel-Deployment-ID': vercelDeploymentId,
      'X-Request-ID': requestId,
      'X-Timestamp': timestamp,
      'X-Vercel-Env': vercelEnv
    }
  })
})

// 安全读取文本
async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}
