<template>
  <div class="ttft-page">
    <!-- 页面头部 -->
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

    <!-- 控制区域 -->
    <section class="control-section section compact">
      <div class="container">
        <div class="card control-card">
          <div class="control-row">
            <div class="control-item flex-1">
              <label>统一提示词</label>
              <textarea v-model="prompt" rows="3" placeholder="请输入测试提示词"></textarea>
            </div>
            <div class="test-button-container">
              <button class="btn btn-primary" :disabled="isRunning" @click="runBoth">同步测试</button>
              <!-- <button class="btn btn-secondary" :disabled="!isRunning" @click="stopAll">停止</button> -->
            </div>
          </div>
          <!-- 访问区域选择 - 注释掉，默认使用美国 -->
          <!--
          <div class="control-item">
            <label>访问区域</label>
            <div class="region-selector">
              <select v-model="proxyRegion">
                <option value="direct">当前区域</option>
                <option value="us-vercel">美国</option>
              </select>
            </div>
          </div>
          <div v-if="proxyRegion === 'us-vercel'" class="control-item">
            <label>Vercel Edge Function URL</label>
            <input
              v-model="vercelProxyUrl"
              placeholder="https://your-project.vercel.app/api/ttft-vercel-proxy"
              @change="saveVercelUrl"
            />
            <small class="hint">部署到 Vercel 后请填写 API 路径</small>
          </div>
          -->
          <!-- 注释掉重置按钮 -->
          <!--
          <div class="control-actions">
            <button class="btn btn-secondary" @click="resetAll">重置</button>
          </div>
          -->
        </div>
      </div>
    </section>

    <section class="compare-section section">
      <div class="container">
        <div class="compare-grid">
          <div v-for="lane in lanes" :key="lane.id" class="lane-card card">
            <!-- 链路标题和状态 -->
            <div class="lane-header">
              <div class="lane-title">
                <input v-model="lane.label" class="lane-label" />
                <span class="status-badge" :class="lane.status">{{ statusText(lane.status) }}</span>
              </div>
            </div>

            <!-- 链路配置表单 - 注释掉 -->
            <!--
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
            -->

            <!-- 指标展示 -->
            <div class="lane-metrics">
              <div class="metric">
                <span>首Token耗时</span>
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
              <!-- 耗时优化指标 - 仅在链路1显示 -->
              <div v-if="lane.id === 'a'" class="metric optimization-metric">
                <span>耗时优化</span>
                <strong :class="{ positive: improvement > 0, negative: improvement < 0 }">
                  {{ improvement !== null ? `${Math.round(improvement)}%` : '--' }}
                  <svg v-if="improvement !== null" class="rocket-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19ZM5.64 12.5L8.35 6.73L6.24 10.82C5.9 11.5 5.68 12.2 5.64 12.5ZM18.13 11.5L15.23 7.65C14.87 7.21 14.45 6.82 13.97 6.5L17.5 2L15.09 7.34C16.25 8.41 17.23 9.83 17.85 11.5H18.13ZM12 17.5C12 17.5 12 17.5 12 17.5C12 17.5 12 17.5 12 17.5C12 17.5 12 17.5 12 17.5C12 17.5 12 17.5 12 17.5C12 17.5 12 17.5 12 17.5C12 17.5 12 17.5 12 17.5ZM10.5 11.5C10.5 11.5 10.5 11.5 10.5 11.5C10.5 11.5 10.5 11.5 10.5 11.5C10.5 11.5 10.5 11.5 10.5 11.5ZM14.5 11.5H12C11.45 11.5 11 11.95 11 12.5V15.5C11 16.05 11.45 16.5 12 16.5H13.5C14.05 16.5 14.5 16.05 14.5 15.5V11.5ZM12.5 4.5C12.5 4.5 12.5 4.5 12.5 4.5C12.5 4.5 12.5 4.5 12.5 4.5C12.5 4.5 12.5 4.5 12.5 4.5C12.5 4.5 12.5 4.5 12.5 4.5ZM12.5 4.5L10.5 11.5H14.5L12.5 4.5Z"/>
                  </svg>
                </strong>
              </div>
            </div>

            <!-- 流式输出 -->
            <div class="lane-output" :class="{ active: lane.flash }">
              <div class="output-header">
                <span>流式输出</span>
                <span class="output-meta">{{ lane.status === 'running' ? 'Streaming...' : 'Ready' }}</span>
              </div>
              <pre>{{ lane.output || '暂无输出' }}</pre>
            </div>

            <!-- 首段原始数据 - 注释掉 -->
            <!--
            <div class="lane-output raw-preview">
              <div class="output-header">
                <span>首段原始数据</span>
                <span class="output-meta">SSE/JSON</span>
              </div>
              <pre>{{ lane.firstEventRaw || '暂无数据' }}</pre>
            </div>
            -->

            <!-- 区域信息验证 - 注释掉 -->
            <!--
            <div v-if="proxyRegion === 'us-vercel' && lane.regionInfo.workerRegion" class="region-info">
              <div class="output-header">
                <span>🌐 请求来源验证</span>
                <span class="output-meta" :class="{ 'verified': lane.regionInfo.workerCountry === 'US' }">
                  {{ lane.regionInfo.workerCountry === 'US' ? '✓ 已验证' : '验证中' }}
                </span>
              </div>
              <div class="region-details">
                <div class="region-item">
                  <span class="label">代理类型：</span>
                  <span class="value">Vercel</span>
                </div>
                <div class="region-item">
                  <span class="label">Worker区域：</span>
                  <span class="value">{{ lane.regionInfo.workerRegion }}</span>
                </div>
                <div class="region-item">
                  <span class="label">数据中心：</span>
                  <span class="value">{{ lane.regionInfo.workerColo }}</span>
                </div>
                <div class="region-item">
                  <span class="label">城市：</span>
                  <span class="value">{{ lane.regionInfo.workerCity }}</span>
                </div>
                <div class="region-item">
                  <span class="label">国家：</span>
                  <span class="value">{{ lane.regionInfo.workerCountry }}</span>
                </div>
                <div class="region-item">
                  <span class="label">请求ID：</span>
                  <span class="value">{{ lane.regionInfo.requestId }}</span>
                </div>
                <div class="region-item">
                  <span class="label">客户端IP：</span>
                  <span class="value">{{ lane.regionInfo.clientIP }}</span>
                </div>
                <div class="region-item">
                  <span class="label">时间戳：</span>
                  <span class="value">{{ lane.regionInfo.timestamp }}</span>
                </div>
              </div>
            </div>
            -->

            <div v-if="lane.error" class="lane-error">{{ lane.error }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Home',
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
  regionInfo: {
    workerRegion: string
    workerCity: string
    workerCountry: string
    workerColo: string
    requestId: string
    clientIP: string
    timestamp: string
  }
}

const prompt = ref('请用一句话介绍首 token 时延的意义。')

const lanes = reactive<LaneState[]>([
  {
    id: 'a',
    label: '链路1-IGA加速链路',
    endpoint: 'https://mot-gb-aira2ysg103869vl.speedifyvolcai.com/api/v3/chat/completions',
    apiKey: '1a4ce36d-af43-4640-a991-887282617206',
    model: 'doubao-seed-1-6-lite-251015',
    status: 'idle',
    ttftMs: null,
    totalMs: null,
    tokenCount: 0,
    output: '',
    error: '',
    firstTokenText: '',
    firstEventRaw: '',
    flash: false,
    regionInfo: {
      workerRegion: '',
      workerCity: '',
      workerCountry: '',
      workerColo: '',
      requestId: '',
      clientIP: '',
      timestamp: ''
    }
  },
  {
    id: 'b',
    label: '链路2-原始链路',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: '1a4ce36d-af43-4640-a991-887282617206',
    model: 'doubao-seed-1-6-lite-251015',
    status: 'idle',
    ttftMs: null,
    totalMs: null,
    tokenCount: 0,
    output: '',
    error: '',
    firstTokenText: '',
    firstEventRaw: '',
    flash: false,
    regionInfo: {
      workerRegion: '',
      workerCity: '',
      workerCountry: '',
      workerColo: '',
      requestId: '',
      clientIP: '',
      timestamp: ''
    }
  }
])

const controllers = new Map<string, AbortController>()

const isRunning = computed(() => lanes.some(lane => lane.status === 'running'))

// 计算耗时优化百分比：(链路2首Token耗时 - 链路1首Token耗时) / 链路2首Token耗时
const improvement = computed(() => {
  const lane1 = lanes.find(l => l.id === 'a')
  const lane2 = lanes.find(l => l.id === 'b')
  
  if (lane1 && lane2 && lane1.ttftMs !== null && lane2.ttftMs !== null && lane2.ttftMs > 0) {
    const value = ((lane2.ttftMs - lane1.ttftMs) / lane2.ttftMs) * 100
    return value
  }
  return null
})

// 获取 CloudBase 实例
const $cloudbase = inject('cloudbase') as any

// 代理区域选择 - 默认使用美国
const proxyRegion = ref('us-vercel')

// Cloudflare Worker URL（只在客户端访问 localStorage）
const cfWorkerUrl = ref('')

// Vercel Edge Function URL（只在客户端访问 localStorage）
const vercelProxyUrl = ref('https://nuxt-ttft-demo-v2.vercel.app/api/ttft-vercel-proxy')

// 在客户端初始化
onMounted(() => {
  if (import.meta.client) {
    cfWorkerUrl.value = localStorage.getItem('cloudflare-worker-url') || 'https://ttft-proxy-us.huyue199312.workers.dev'
    vercelProxyUrl.value = localStorage.getItem('vercel-proxy-url') || 'https://nuxt-ttft-demo-v2.vercel.app/api/ttft-vercel-proxy'
    // 确保代理区域选择器在客户端初始化
    proxyRegion.value = 'us-vercel'
  }
})

const saveCfWorkerUrl = () => {
  if (import.meta.client) {
    localStorage.setItem('cloudflare-worker-url', cfWorkerUrl.value)
  }
}

const saveVercelUrl = () => {
  if (import.meta.client) {
    localStorage.setItem('vercel-proxy-url', vercelProxyUrl.value)
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

  // 如果选择了代理方式，需要 API Key
  if (proxyRegion.value === 'us-vercel' && !lane.apiKey) {
    lane.error = '使用代理时必须填写 API Key'
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
    if (proxyRegion.value === 'us-vercel') {
      // 美国 Vercel Edge Function 代理（强制美国东部）
      const vercelUrl = vercelProxyUrl.value || '/api/ttft-vercel-proxy'
      console.log(`[Lane ${lane.id}] 请求 Vercel 代理:`, vercelUrl)
      console.log(`[Lane ${lane.id}] 请求体:`, { endpoint: lane.endpoint, hasApiKey: !!lane.apiKey, payload })
      
      response = await fetch(vercelUrl, {
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
      // 当前区域（直连）
      console.log(`[Lane ${lane.id}] 直连请求:`, lane.endpoint)
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
      let errorDetail = ''
      try {
        const errorText = await response.text()
        console.error(`[Lane ${lane.id}] 请求失败:`, response.status, response.statusText, errorText)
        errorDetail = errorText || response.statusText
      } catch (e) {
        errorDetail = response.statusText || 'Unknown error'
      }
      lane.status = 'error'
      lane.error = `请求失败 ${response.status}: ${errorDetail}`
      return
    }

    // 收集区域信息用于验证
    if (proxyRegion.value === 'us-vercel') {
      lane.regionInfo = {
        workerRegion: response.headers.get('X-Vercel-Region') || '',
        workerCity: response.headers.get('X-Worker-City') || '',
        workerCountry: response.headers.get('X-Worker-Country') || '',
        workerColo: response.headers.get('X-Worker-Colo') || '',
        requestId: response.headers.get('X-Request-ID') || '',
        clientIP: response.headers.get('X-Client-IP') || '',
        timestamp: response.headers.get('X-Timestamp') || ''
      }
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
      console.log(`[Lane ${lane.id}] 请求已中止`)
      lane.status = 'idle'
      return
    }
    lane.status = 'error'
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Lane ${lane.id}] 请求异常:`, error)
    lane.error = `请求异常: ${errorMsg}`
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

.section {
  padding: var(--spacing-xl) 0;
}

.section.compact {
  padding: var(--spacing-md) 0;
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

.control-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.flex-1 {
  flex: 1;
  min-width: 300px;
}

.test-button-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 100px;
  margin-top: var(--spacing-lg);
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-xs);
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


.control-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
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

.metric.optimization-metric {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.08), rgba(52, 232, 158, 0.05));
  border: 1px solid rgba(0, 220, 130, 0.2);
}

.metric.optimization-metric strong {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.metric.optimization-metric strong.positive {
  color: var(--nuxt-green-dark);
}

.metric.optimization-metric strong.negative {
  color: #dc2626;
}

.rocket-icon {
  animation: rocket-float 2s ease-in-out infinite;
}

@keyframes rocket-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
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

.region-info {
  border: 1px solid #22c55e;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: rgba(34, 197, 94, 0.05);
  min-height: 200px;
}

.region-info .output-header {
  color: #22c55e;
  font-weight: 600;
}

.output-meta.verified {
  color: #22c55e;
  font-weight: 600;
}

.region-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.region-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.region-item .label {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.region-item .value {
  color: var(--color-text);
  font-family: 'Menlo', 'Monaco', 'Ubuntu Mono', monospace;
  word-break: break-all;
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

  .control-row {
    flex-direction: column;
  }

  .test-button-container {
    width: 100%;
    margin-top: var(--spacing-sm);
  }

  .test-button-container button {
    width: 100%;
  }
}
</style>
