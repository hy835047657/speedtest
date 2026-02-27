export default async (event: any) => {
  const res = event.node.res
  const req = event.node.req
  const body = await readJsonBody(req)

  const endpoint = (body?.endpoint || '').trim()
  const apiKey = (body?.apiKey || '').trim()
  const payload = body?.payload || {}

  if (!endpoint) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing endpoint' }))
    return
  }

  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const controller = new AbortController()
  req.on('close', () => {
    controller.abort()
  })

  if (endpoint.startsWith('mock://')) {
    const ttftDelayMs = endpoint.includes('link-b') ? 850 : 220
    const perTokenDelayMs = endpoint.includes('link-b') ? 55 : 35
    await writeMockStream(res, controller.signal, ttftDelayMs, perTokenDelayMs)
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: controller.signal
  })

  if (!upstream.ok) {
    const errorText = await safeReadText(upstream)
    res.write(`data: ${JSON.stringify({ error: `Upstream ${upstream.status}`, detail: errorText })}\n\n`)
    res.write(`data: [DONE]\n\n`)
    res.end()
    return
  }

  const contentType = upstream.headers.get('content-type') || ''

  if (!upstream.body) {
    const errorText = await safeReadText(upstream)
    res.write(`data: ${JSON.stringify({ error: 'Upstream has no body', detail: errorText })}\n\n`)
    res.write(`data: [DONE]\n\n`)
    res.end()
    return
  }

  if (contentType.includes('text/event-stream')) {
    const reader = upstream.body.getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) res.write(value)
    }
    res.end()
    return
  }

  const text = await safeReadText(upstream)
  res.write(`data: ${text}\n\n`)
  res.write(`data: [DONE]\n\n`)
  res.end()
}

const safeReadText = async (response: Response) => {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

const readJsonBody = async (req: any) => {
  let body = ''
  for await (const chunk of req) {
    body += chunk.toString()
  }
  if (!body) return {}
  try {
    return JSON.parse(body)
  } catch {
    return {}
  }
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => resolve(), ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error('aborted'))
    }
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })
  })

const writeSse = (res: any, data: unknown) => {
  res.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`)
}

const writeMockStream = async (
  res: any,
  signal: AbortSignal,
  ttftDelayMs: number,
  perTokenDelayMs: number
) => {
  const content =
    '这是一个可运行的 TTFT 对比演示：链路 A 更快到达首 token，链路 B 更慢。你可以把 Endpoint 换成真实的豆包流式接口进行对比。'

  await sleep(ttftDelayMs, signal)

  const tokens = content.split('')
  for (const token of tokens) {
    if (signal.aborted) break
    writeSse(res, { choices: [{ delta: { content: token } }] })
    await sleep(perTokenDelayMs, signal)
  }

  writeSse(res, '[DONE]')
  res.end()
}
