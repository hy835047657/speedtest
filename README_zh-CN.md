# Nuxt.js 混合渲染示例项目

🚀 一个完整的 Nuxt.js 混合渲染示例项目，展示 SSG、ISR 和 SSR 渲染模式的实际应用和最佳实践，可以一键部署到 EdgeOne Pages。

## 一键部署

[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?from=github&template=nuxt-mix-template)

## ✨ 项目特性

- 🎯 **三种渲染模式演示**：完整的 SSG、ISR 和 SSR 示例
- 🎨 **现代化 UI 设计**：基于 Nuxt 官方绿色主题的精美界面
- 📱 **响应式设计**：完美适配桌面端和移动端
- ⚡ **性能优化**：针对不同渲染模式的性能优化策略
- 🔧 **TypeScript 支持**：完整的类型安全开发体验
- 📊 **实时数据展示**：SSR 页面的动态数据和实时更新
- 🔄 **增量更新**：ISR 页面的智能缓存和按需更新

## 🏗️ 项目结构

```
├── app/
│   └── app.vue                 # 应用程序入口
├── assets/
│   └── css/
│       └── main.css           # 主样式表（Nuxt 绿色主题）
├── layouts/
│   └── default.vue            # 默认布局
├── pages/
│   ├── index.vue              # 首页（SSG）
│   ├── ssg.vue                # SSG 示例页面
│   ├── isr.vue                # ISR 示例页面
│   └── ssr.vue                # SSR 示例页面
├── server/
│   └── api/
│       ├── ssr-data.ts        # SSR 动态数据 API
│       └── isr-content.ts     # ISR 内容 API
├── nuxt.config.ts             # Nuxt 配置（混合渲染规则）
└── package.json
```

## 🎯 渲染模式对比

| 特性 | SSG | ISR | SSR |
|------|-----|-----|-----|
| **首次加载** | ⚡ 极快 (<100ms) | 🚀 快速 (~120ms) | 📊 中等 (~300ms) |
| **内容新鲜度** | 🔄 需要重新构建 | ✅ 自动更新 | ✅ 实时 |
| **服务器负载** | ✅ 无 | 📉 低 | 📈 高 |
| **SEO 友好** | ✅ 完美 | ✅ 完美 | ✅ 良好 |
| **使用场景** | 文档、企业站 | 博客、电商 | 仪表板、社交 |

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm / yarn / pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install

# 使用 pnpm
pnpm install
```

### 开发环境

在 `http://localhost:3000` 启动开发服务器：

```bash
# 使用 npm
npm run dev

# 使用 yarn
yarn dev

# 使用 pnpm
pnpm dev
```

### 生产构建

```bash
# 构建应用
npm run build

# 生成静态站点
npm run generate

# 预览生产构建
npm run preview
```

## 📖 页面说明

### 🏠 首页 (/)
- **渲染模式**：SSG（静态站点生成）
- **特性**：构建时生成，加载速度最快
- **内容**：项目介绍、技术栈展示、快速开始指南

### ⚡ SSG 示例 (/ssg)
- **渲染模式**：SSG（静态站点生成）
- **特性**：演示 SSG 原理、性能优势和配置方法
- **内容**：技术原理、性能对比、使用场景、代码示例

### 🔄 ISR 示例 (/isr)
- **渲染模式**：ISR（增量静态再生成）
- **特性**：结合静态生成和动态更新的优势
- **内容**：实时内容展示、工作原理、配置示例、优势对比

### 🚀 SSR 示例 (/ssr)
- **渲染模式**：SSR（服务端渲染）
- **特性**：实时数据、动态内容、个性化体验
- **内容**：实时仪表板、用户活动、系统状态、API 调用演示

## ⚙️ 配置说明

### Nuxt 配置 (nuxt.config.ts)

```typescript
export default defineNuxtConfig({
  // CSS 配置
  css: ['~/assets/css/main.css'],
  
  // 混合渲染路由规则
  routeRules: {
    '/': { prerender: true },        // SSG - 首页
    '/ssg': { prerender: true },     // SSG - 静态生成
    '/isr': { isr: true },           // ISR - 增量静态再生成
    '/ssr': { ssr: true }            // SSR - 服务端渲染
  },
  
  // TypeScript 配置
  typescript: {
    strict: true,
    typeCheck: true
  }
})
```

### API 路由

#### `/api/ssr-data` - SSR 动态数据
- 提供实时统计数据
- 用户活动信息
- 系统状态监控
- 每次请求时重新生成

#### `/api/isr-content` - ISR 内容数据
- 文章列表
- 产品信息
- 统计数据
- 定期更新，智能缓存

## 🎨 样式系统

项目使用基于 Nuxt 官方绿色主题的完整设计系统：

- **主色调**：`#00DC82`（Nuxt 绿）
- **CSS 变量**：统一的颜色、间距、阴影系统
- **响应式设计**：移动端优先的布局策略
- **组件样式**：卡片、按钮、徽章等常用组件

## 📊 性能优化

### SSG 优化
- 构建时预生成所有页面
- 静态资源 CDN 分发
- 图片懒加载和优化
- CSS/JS 代码分割

### ISR 优化
- 智能缓存策略
- 按需重新生成
- 后台更新机制
- 缓存失效控制

### SSR 优化
- 服务端数据预取
- 客户端水合优化
- API 响应缓存
- 组件级缓存

## 🚀 部署指南

### 静态部署 (SSG)
适用于 Netlify、Vercel、GitHub Pages 等静态托管服务：

```bash
npm run generate
```

### 服务器部署 (混合渲染)
适用于支持 Node.js 的服务器环境：

```bash
npm run build
npm run preview
```

### Vercel Serverless 部署（固定美国区域示例）

在项目根目录添加或修改 vercel.json：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nuxtjs",
  "regions": ["iad1"]
}
```

部署后在页面里填写 Function URL，例如：

```
https://your-app.vercel.app/api/ttft-vercel-proxy
```

## 🛠️ 技术栈

- **框架**：[Nuxt.js 4.1.3](https://nuxt.com/)
- **前端**：[Vue.js 3.5.22](https://vuejs.org/)
- **语言**：[TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vitejs.dev/)
- **样式**：原生 CSS + CSS 变量

## 📚 学习资源

- [Nuxt.js 官方文档](https://nuxt.com/docs)
- [Vue.js 官方文档](https://vuejs.org/guide/)
- [渲染模式对比](https://nuxt.com/docs/guide/concepts/rendering)
- [混合渲染配置](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering)

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Nuxt.js](https://nuxt.com/) - 优秀的全栈 Vue 框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- 所有为开源社区做出贡献的开发者们

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！
