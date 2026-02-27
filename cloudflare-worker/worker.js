// Cloudflare Worker - TTFT API Proxy (US Region)
// 部署后可以从美国边缘节点发起请求

export default {
  async fetch(request, env, ctx) {
    // 添加 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Expose-Headers': 'X-Region',
    }

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // 只处理 POST 请求
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // 解析请求体
      const body = await request.json()
      const { endpoint, apiKey, payload } = body

      // 调试日志
      console.log('[Worker] Received request:', {
        endpoint,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        payloadKeys: Object.keys(payload || {})
      })

      if (!endpoint || !payload) {
        return new Response(
          JSON.stringify({ error: 'Missing endpoint or payload' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (!apiKey) {
        console.log('[Worker] ERROR: Missing API Key')
        return new Response(
          JSON.stringify({ error: 'Missing API Key. Please enter your API Key in the form.' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // 构建请求头
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'Cloudflare-Worker-TTFT-Proxy/1.0 (US Region)',
        'X-Request-ID': crypto.randomUUID(),
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP'),
        'X-Original-User-Agent': request.headers.get('User-Agent')
      }

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      // 转发请求到目标 API（支持流式响应）
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      // 收集Worker和请求信息用于验证
      const workerInfo = {
        workerRegion: request.cf?.country === 'US' ? 'us-cf-edge' : `${request.cf?.country?.toLowerCase()}-cf-edge`,
        workerCity: request.cf?.city || 'unknown',
        workerCountry: request.cf?.country || 'US',
        workerColo: request.cf?.colo || 'unknown', // Cloudflare数据中心代码
        workerTimezone: request.cf?.timezone || 'unknown',
        requestId: headers['X-Request-ID'],
        clientIP: request.headers.get('CF-Connecting-IP'),
        originalUA: request.headers.get('User-Agent'),
        timestamp: new Date().toISOString(),
        targetEndpoint: endpoint
      }

      // 转发流式响应，添加验证信息
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('content-type') || 'text/event-stream',
          'X-Region': workerInfo.workerRegion,
          'X-Cloudflare-City': workerInfo.workerCity,
          'X-Cloudflare-Country': workerInfo.workerCountry,
          'X-Cloudflare-Colo': workerInfo.workerColo,
          'X-Request-ID': workerInfo.requestId,
          'X-Client-IP': workerInfo.clientIP,
          'X-Timestamp': workerInfo.timestamp
        }
      })

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
          region: 'us-cf-edge'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  }
}
