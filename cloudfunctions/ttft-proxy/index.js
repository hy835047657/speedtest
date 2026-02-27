'use strict'

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { endpoint, apiKey, payload } = event

  if (!endpoint || !payload) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing endpoint or payload' })
    }
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'User-Agent': 'CloudBase-Function-TTFT-Proxy/1.0'
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: context.requestId ? AbortSignal.timeout(30000) : undefined
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Upstream ${response.status}`,
          detail: errorText,
          region: cloud.getEnv().region
        })
      }
    }

    const contentType = response.headers.get('content-type') || ''

    if (!response.body) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Upstream has no body',
          region: cloud.getEnv().region
        })
      }
    }

    // 返回流式响应
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Region': cloud.getEnv().region
      },
      isBase64Encoded: false,
      body: await response.text()
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        region: cloud.getEnv().region
      })
    }
  }
}
