# 智能换装网页 - 技术方案 v0.1

## 版本说明
**版本**：v0.1
**对应功能**：上传人像 + 上传服装 + 生成换装 + 结果展示
**技术决策依据**：intent.md（极简操作、隐私安全）+ spec.md（核心交互闭环）

---

## 技术栈

### 核心框架
- **Next.js 14**（App Router）
  - 选择理由：SSG/SSR 灵活，API Routes 可做轻量后端，生态成熟
  - 版本：14.x

### 样式方案
- **Tailwind CSS 3.x**
  - 选择理由：实用优先，快速开发，高度可定制
  - 配置：自定义品牌色、换装主题设计 Token

### UI 组件
- **shadcn/ui**（或自己封装的 Tailwind 组件）
  - 选择理由：高质量、可定制、与 Tailwind 完美配合
  - 使用的组件：Button, Card, Progress, Toast

### 状态管理
- **React useState + Context API**
  - v0.1 不需要复杂状态管理
  - 状态：人物图片、服装图片、生成结果、加载状态

### 文件上传
- **React Dropzone**（或原生 input + 拖拽事件）
  - 拖拽上传支持

### 部署平台
- **Vercel**
  - 自动 CI/CD，免费额度

---

## 品牌与视觉设计

### 品牌定位
换装工具的核心感受应该是：**轻松、自信、科技感**。用户在这里"试"衣服，应该感到有趣而非压力。

### 配色方案

| Token | 色值 | 用途 |
|-------|------|------|
| `primary` | `#7C5CFC` (紫) | 主按钮、品牌标识、激活状态 |
| `primary-light` | `#A78BFA` | 悬停、渐变辅助 |
| `primary-dark` | `#5B3EC9` | 按压状态 |
| `secondary` | `#F472B6` (粉) | 点缀色、装饰元素、提示 |
| `bg` | `#FAFAFA` | 页面背景 |
| `bg-card` | `#FFFFFF` | 卡片/上传区域背景 |
| `border` | `#E5E7EB` | 分割线、边框 |
| `text` | `#1F2937` | 正文 |
| `text-muted` | `#6B7280` | 辅助文字、占位提示 |
| `success` | `#10B981` | 上传成功状态 |
| `error` | `#EF4444` | 错误状态 |

**设计语言**：
- **圆角**：大圆角（rounded-2xl / rounded-3xl），给人柔和、友好的感觉
- **阴影**：柔和阴影（shadow-lg / shadow-xl），营造浮层和层次感
- **渐变**：按钮和背景使用轻微渐变，增加视觉丰富度
- **毛玻璃**：部分卡片背景使用 backdrop-blur，增加科技感

### 字体
- **中文**：系统默认（`system-ui, -apple-system, sans-serif`）
- **数字/英文**：`Inter`（从 Google Fonts 加载）

---

## 布局设计

### 页面结构（桌面端）

### 布局 Token

| Token | 值 | 说明 |
|-------|-----|------|
| 最大宽度 | `1024px` | 内容区最大宽，居中 |
| 卡片间距 | `24px` (gap-6) | 上传区之间 |
| 内边距 | `24px` (p-6) | 卡片内边距 |
| 圆角 | `16px` (rounded-2xl) | 卡片和按钮 |
| 按钮高度 | `56px` (h-14) | 大按钮，易点击 |

---

## 组件设计

### 1. Header 组件
**职责**：展示品牌名称和隐私/导航链接

**Props**：无

**样式**：
- 高度 64px
- 白色背景 + 底部细边框
- 内容居中，最大宽度 1024px

**代码示例**：
```tsx
export function Header() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧥</span>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            智能换装
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="hidden sm:inline">🔒 图片不存储</span>
          <a href="#" className="hover:text-primary transition-colors">隐私说明</a>
        </div>
      </div>
    </header>
  )
}

```

### 2. UploadZone 组件（核心，可复用）
interface UploadZoneProps {
  type: 'person' | 'clothing'
  label: string
  icon: React.ReactNode
  onUpload: (file: File) => void
  onRemove: () => void
  imagePreview?: string | null
  isUploading?: boolean
  accept?: string
  maxSize?: number // MB
}

### 3. GenerateButton 组件
interface GenerateButtonProps {
  isReady: boolean      // 人像 + 服装都已上传
  isGenerating: boolean
  hasResult: boolean
  onGenerate: () => void
  onRegenerate: () => void
}

### 4. ResultDisplay 组件
interface ResultDisplayProps {
  resultImage?: string | null
  isLoading: boolean
  error?: string | null
  onDownload: () => void
  onRetry: () => void
}

### 5.主页面
// app/page.tsx
import { Header } from '@/components/Header'
import { UploadZone } from '@/components/UploadZone'
import { GenerateButton } from '@/components/GenerateButton'
import { ResultDisplay } from '@/components/ResultDisplay'

export default function Home() {
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [clothingImage, setClothingImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReady = !!personImage && !!clothingImage

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    // TODO: 调用 AI 换装 API
    // 模拟延迟
    setTimeout(() => {
      setResultImage('/demo-result.png')
      setIsGenerating(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* 上传区 - 双栏 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <UploadZone
            type="person"
            label="上传人物照片"
            icon="📷"
            imagePreview={personImage}
            onUpload={(file) => { /* 读取为 dataURL */ }}
            onRemove={() => setPersonImage(null)}
          />
          <UploadZone
            type="clothing"
            label="上传服装照片"
            icon="👕"
            imagePreview={clothingImage}
            onUpload={(file) => { /* 读取为 dataURL */ }}
            onRemove={() => setClothingImage(null)}
          />
        </div>

        {/* 生成按钮 - 居中 */}
        <div className="flex justify-center mb-8">
          <GenerateButton
            isReady={isReady}
            isGenerating={isGenerating}
            hasResult={!!resultImage}
            onGenerate={handleGenerate}
            onRegenerate={handleGenerate}
          />
        </div>

        {/* 结果展示 */}
        <div className="max-w-md mx-auto">
          <ResultDisplay
            resultImage={resultImage}
            isLoading={isGenerating}
            error={error}
            onDownload={() => { /* 下载逻辑 */ }}
            onRetry={handleGenerate}
          />
        </div>

        {/* 隐私声明（轻量） */}
        <div className="text-center text-xs text-gray-400 mt-8">
          🔒 图片仅用于本次生成，处理完成后自动删除 · 不存储任何用户数据
        </div>
      </main>
    </div>
  )
}


 ### 样式系统：
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C5CFC',
          light: '#A78BFA',
          dark: '#5B3EC9',
        },
        secondary: {
          DEFAULT: '#F472B6',
          light: '#F9A8D4',
        },
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
### 性能优化:
#### 图片上传
客户端压缩：使用 browser-image-compression 在上传前将大图压缩到 ≤ 2MB
预览使用 URL.createObjectURL() 而非 base64（性能更好）
加载性能
Next.js <Image> 组件优化静态资源
字体使用 next/font 加载 Inter
首屏只加载关键 CSS
生成等待体验
使用乐观 UI：点击生成后立即显示 loading 状态
显示进度文案："排队中 → 生成中 → 完成"

### 部署方案:
Vercel（推荐）
连接 GitHub 仓库
自动构建和部署
环境变量配置 API Key（v0.2 接入 AI API 时需要）

# 开发流程
## 初始化项目
npx create-next-app@latest tryon-v0.1 --typescript --tailwind --app
## 安装额外依赖
npm install lucide-react   # 图标库
npm install react-dropzone # 拖拽上传（可选）
## 启动开发
npm run dev


# 文档同步
docs/intent.md

docs/spec.md

docs/plan.md

每次代码变更，同步更新对应文档。

# 验收对照
spec.md 验收项	对应实现
人像上传（点击+拖拽）	UploadZone 组件
服装上传（点击+拖拽）	UploadZone 组件
两张图齐全才可生成	GenerateButton 的 isReady 控制
生成 loading 反馈	GenerateButton 的 isGenerating 状态
结果预览+下载	ResultDisplay 组件
重新生成	ResultDisplay 的 onRetry / GenerateButton 的 onRegenerate
移动端适配	响应式 grid + 全宽按钮



