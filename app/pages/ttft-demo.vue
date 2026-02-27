<template>
  <div class="ttft-page">
    <section class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="badge badge-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            TTFT 对比演示
          </div>
          <h1>双链路首 Token 时延对比</h1>
          <p class="page-description">
            同步发起两条火山方舟模型的流式调用链路，一条经过IGA加速，一条为未加速原始链路，实时展示首 Token 到达时刻与 TTFT 指标
          </p>
        </div>
      </div>
    </section>

    <section class="control-section section">
      <div class="container">
        <div class="card control-card">
          <div class="control-grid">
            <div class="control-item">
              <label>统一提示词</label>
              <textarea v-model="prompt" rows="3" placeholder="请输入测试提示词"></textarea>
            </div>
            <div class="control-item">
              <label>代理区域</label>
              <div class="region-selector">
                <select v-model="proxyRegion">
                  <option value="direct">直连（浏览器）</option>
                  <option value="shanghai">上海（CloudBase）</option>
                  <option value="us-vercel">美国（Vercel Serverless）</option>
                </select>
              </div>
            </div>
            <div v-if="proxyRegion === 'us-vercel'" class="control-item">
              <label>Vercel Function URL</label>
              <input
                v-model="vercelFunctionUrl"
                placeholder="https://your-app.vercel.app/api/ttft-vercel-proxy"
                @change="saveVercelFunctionUrl"
              />
              <small class="hint">部署后请填写 Serverless Function URL</small>
            </div>
          </div>
          <div class="control-actions">
            <button class="btn btn-primary" :disabled="isRunning" @click="runBoth">同步测试</button>
            <button class="btn btn-secondary" :disabled="!isRunning" @click="stopAll">停止</button>
            <button class="btn btn-secondary" @click="resetAll">重置</button>
            <button class="btn btn-secondary" :disabled="ipLoading" @click="fetchEgressIp">
              {{ ipLoading ? '获取中...' : '显示本机出口 IP' }}
            </button>
          </div>
          <div v-if="egressIp || ipError" class="ip-result">
            <span class="ip-label">本机出口 IP</span>
            <span v-if="egressIp" class="ip-value">{{ egressIp }}</span>
            <span v-else class="ip-error">{{ ipError }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="compare-section section">
      <div class="container">
        <div class="compare-grid">
          <div v-for="lane in lanes" :key="lane.id" class="lane-card card">
            <div class="lane-header">
              <div class="lane-title">
                <input v-model="lane.label" class="lane-label" />
                <span class="status-badge" :class="lane.status">{{ statusText(lane.status) }}</span>
              </div>
              <div class="lane-actions">
                <button class="btn btn-primary" :disabled="isRunning" @click="runLane(lane)">单独测试</button>
                <button class="btn btn-secondary" :disabled="lane.status !== 'running'" @click="stopLane(lane)">停止</button>
              </div>
            </div>

            <div class="lane-form">
              <div class="field field-full">
                <label>调用链路</label>
                <input v-model="lane.endpoint" placeholder="例如：https://example.com/api/v3/chat/completions" />
              </div>
              <div class="field">
                <label>API Key</label>
                <input v-model="lane.apiKey" placeholder="sk-..." type="password" />
              </div>
              <div class="field">
                <label>Model</label>
                <input v-model="lane.model" placeholder="模型 ID 或名称" />
              </div>
            </div>

            <div class="lane-metrics">
              <div class="metric">
                <span>TTFT</span>
                <strong>{{ formatMs(lane.ttftMs) }}</strong>
              </div>
              <div class="metric">
                <span>总耗时</span>
                <strong>{{ formatMs(lane.totalMs) }}</strong>
              </div>
              <div class="metric">
                <span>Token 数</span>
                <strong>{{ lane.tokenCount }}</strong>
              </div>
              <div class="metric">
                <span>首 Token</span>
                <strong :class="{ flash: lane.flash }">{{ lane.firstTokenText || '--' }}</strong>
              </div>
            </div>

            <div class="lane-output" :class="{ active: lane.flash }">
              <div class="output-header">
                <span>流式输出</span>
                <span class="output-meta">{{ lane.status === 'running' ? 'Streaming...' : 'Ready' }}</span>
              </div>
              <pre>{{ lane.output || '暂无输出' }}</pre>
            </div>

            <div class="lane-output raw-preview">
              <div class="output-header">
                <span>首段原始数据</span>
                <span class="output-meta">SSE/JSON</span>
              </div>
              <pre>{{ lane.firstEventRaw || '暂无数据' }}</pre>
            </div>

            <div v-if="lane.error" class="lane-error">{{ lane.error }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'TTFT Demo',
  meta: [
    { name: 'description', content: '双链路首 Token 时延对比演示页面' }
  ]
})

type LaneStatus = 'idle' | 'running' | 'done' | 'error'

type LaneState = {
  id: string
  label: string
  endpoint: string
  apiKey: string
  model: string
  status: LaneStatus
  ttftMs: number | null
  totalMs: number | null
  tokenCount: number
  output: string
  error: string
  firstTokenText: string
  firstEventRaw: string
  flash: boolean
}

const prompt = ref('请用一句话介绍首 token 时延的意义。')

const lanes = reactive<LaneState[]>([
  {
    id: 'a',
    label: '链路1-IGA加速链路',
    endpoint: 'https://mot-gb-aira2ysg103869vl.speedifyvolcai.com/api/v3/chat/completions',
    apiKey: '',
    model: 'doubao-seed-1-6-lite-251015',
    status: 'idle',
    ttftMs: null,
    totalMs: null,
    tokenCount: 0,
    output: '',
    error: '',
    firstTokenText: '',
    firstEventRaw: '',
    flash: false
  },
  {
    id: 'b',
    label: '链路2-原始链路',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: '',
    model: 'doubao-seed-1-6-lite-251015',
    status: 'idle',
    ttftMs: null,
    totalMs: null,
    tokenCount: 0,
    output: '',
    error: '',
    firstTokenText: '',
    firstEventRaw: '',
    flash: false
  }
])

const controllers = new Map<string, AbortController>()

const isRunning = computed(() => lanes.some(lane => lane.status === 'running'))

// 获取 CloudBase 实例
const $cloudbase = inject('cloudbase') as any

// 代理区域选择
const proxyRegion = ref('direct')

const egressIp = ref('')
const ipLoading = ref(false)
const ipError = ref('')

const vercelFunctionUrl = ref('')

// 在客户端初始化
onMounted(() => {
  if (import.meta.client) {
    vercelFunctionUrl.value = localStorage.getItem('vercel-function-url') || 'https://your-app.vercel.app/api/ttft-vercel-proxy'
    // 确保代理区域选择器在客户端初始化
    proxyRegion.value = 'direct'
  }
})

const saveVercelFunctionUrl = () => {
  if (import.meta.client) {
    localStorage.setItem('vercel-function-url', vercelFunctionUrl.value)
  }
}

const fetchEgressIp = async () => {
  ipError.value = ''
  ipLoading.value = true
  try {
    const response = await fetch('https://api64.ipify.org?format=json')
    if (!response.ok) {
      ipError.value = `请求失败 ${response.status}`
      egressIp.value = ''
      return
    }
    const data = await response.json()
    egressIp.value = data?.ip || ''
    if (!egressIp.value) {
      ipError.value = '未获取到 IP'
    }
  } catch {
    ipError.value = '获取失败'
    egressIp.value = ''
  } finally {
    ipLoading.value = false
  }
}

const statusText = (status: LaneStatus) => {
  if (status === 'running') return '请求中'
  if (status === 'done') return '完成'
  if (status === 'error') return '异常'
  return '空闲'
}

const formatMs = (value: number | null) => {
  if (!value && value !== 0) return '--'
  return `${Math.round(value)} ms`
}

const resetLane = (lane: LaneState) => {
  lane.status = 'idle'
  lane.ttftMs = null
  lane.totalMs = null
  lane.tokenCount = 0
  lane.output = ''
  lane.error = ''
  lane.firstTokenText = ''
  lane.firstEventRaw = ''
  lane.flash = false
}

const resetAll = () => {
  lanes.forEach(resetLane)
}

const stopLane = (lane: LaneState) => {
  const controller = controllers.get(lane.id)
  if (controller) {
    controller.abort()
    controllers.delete(lane.id)
  }
  if (lane.status === 'running') {
    lane.status = 'idle'
  }
}

const stopAll = () => {
  lanes.forEach(stopLane)
}

const runBoth = async () => {
  await Promise.all(lanes.map(lane => runLane(lane)))
}

const runLane = async (lane: LaneState) => {
  if (!lane.endpoint || !lane.model) {
    lane.error = '请填写 Endpoint 与 Model'
    lane.status = 'error'
    return
  }

  resetLane(lane)
  lane.status = 'running'
  const controller = new AbortController()
  controllers.set(lane.id, controller)
  const startedAt = performance.now()

  const payload = {
    model: lane.model,
    stream: true,
    messages: [
      { role: 'user', content: prompt.value }
    ]
  }

  try {
    let response: Response

    // 根据选择的代理区域发起请求
    if (proxyRegion.value === 'shanghai' && $cloudbase) {
      // 上海 CloudBase 云函数代理
      response = await fetch('https://tcb-api.tencentcloudapi.com/web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CloudBase-Env': 'ai-native-4g9hewa34cdcb7c1',
          'X-CloudBase-Function-Name': 'ttft-proxy',
          'X-CloudBase-Region': 'ap-shanghai'
        },
        body: JSON.stringify({
          endpoint: lane.endpoint,
          apiKey: lane.apiKey,
          payload
        }),
        signal: controller.signal
      })
    } else if (proxyRegion.value === 'us-vercel') {
      const functionUrl = vercelFunctionUrl.value || 'https://your-app.vercel.app/api/ttft-vercel-proxy'
      response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: lane.endpoint,
          apiKey: lane.apiKey,
          payload
        }),
        signal: controller.signal
      })
    } else {
      // 直连（浏览器）
      response = await fetch(lane.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(lane.apiKey ? { 'Authorization': `Bearer ${lane.apiKey}` } : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
    }

    if (!response.ok || !response.body) {
      lane.status = 'error'
      lane.error = `请求失败 ${response.status}`
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let done = false

    while (!done) {
      const result = await reader.read()
      done = result.done
      if (result.value) {
        buffer += decoder.decode(result.value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.replace(/^data:\s*/, '')
          if (data === '[DONE]') {
            done = true
            break
          }
          if (!lane.firstEventRaw) {
            lane.firstEventRaw = data
          }
          const parsed = parseEvent(data)
          if (parsed.error) {
            lane.error = parsed.error
            lane.status = 'error'
            done = true
            break
          }
          if (parsed.token) {
            if (lane.ttftMs === null) {
              lane.ttftMs = performance.now() - startedAt
              lane.firstTokenText = parsed.token
            }
            lane.output += parsed.token
            lane.tokenCount += 1
            lane.flash = true
            window.setTimeout(() => {
              lane.flash = false
            }, 240)
          }
        }
      }
    }

    lane.totalMs = performance.now() - startedAt
    lane.status = 'done'
  } catch (error) {
    if (controller.signal.aborted) {
      lane.status = 'idle'
      return
    }
    lane.status = 'error'
    lane.error = '请求中断或解析异常'
  } finally {
    controllers.delete(lane.id)
  }
}

const parseEvent = (data: string) => {
  try {
    const json = JSON.parse(data)
    if (json?.error?.message) {
      return { token: '', error: json.error.message as string }
    }
    const content =
      json?.choices?.[0]?.delta?.content ??
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.text ??
      json?.output_text ??
      ''
    if (typeof content === 'string') return { token: content, error: '' }
    return { token: '', error: '' }
  } catch {
    return { token: '', error: '' }
  }
}
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.12), rgba(52, 232, 158, 0.08));
  border-bottom: 1px solid rgba(0, 220, 130, 0.2);
  padding: var(--spacing-2xl) 0;
  text-align: center;
}

.header-content .badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.page-description {
  max-width: 720px;
  margin: 0 auto;
}

.control-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-lg);
}

.control-item label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.control-item textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: 0.9rem;
}

.control-item input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: 0.9rem;
}

.region-selector select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.hint {
  display: block;
  margin-top: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}


.control-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.ip-result {
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.95rem;
}

.ip-label {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.ip-value {
  font-family: 'Menlo', 'Monaco', 'Ubuntu Mono', monospace;
  color: var(--color-text);
}

.ip-error {
  color: #dc2626;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-xl);
}

.lane-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.lane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.lane-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.lane-label {
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-xs) 0;
  min-width: 120px;
  background: transparent;
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.idle {
  background: var(--nuxt-gray-100);
  color: var(--nuxt-gray-600);
}

.status-badge.running {
  background: rgba(0, 220, 130, 0.15);
  color: var(--nuxt-green-dark);
}

.status-badge.done {
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}

.lane-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.lane-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.field input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: 0.9rem;
}

.lane-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.metric {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: center;
}

.metric span {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.metric strong {
  font-size: 1rem;
  color: var(--color-text);
}

.metric strong.flash {
  color: var(--nuxt-green-dark);
  animation: flash 0.5s ease;
}

.lane-output {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: #0f172a;
  color: #e2e8f0;
  min-height: 160px;
}

.lane-output.active {
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.4);
}

.output-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: var(--spacing-sm);
  color: #94a3b8;
}

.lane-output pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Menlo', 'Monaco', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
}

.lane-output.raw-preview {
  background: #111827;
  min-height: 120px;
}

.lane-error {
  color: #dc2626;
  font-size: 0.9rem;
  background: rgba(239, 68, 68, 0.1);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

@keyframes flash {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .lane-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
