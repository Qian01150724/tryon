# Plan: v0.2c 结果体验优化

## 1. 总体方案

全部已在 `components/ResultDisplay.tsx` 实现，本轮无需改动。计划重点是记录实现方案，确认两个功能（对比滑动条、全屏弹窗）的实现细节，供 tasks 阶段验证。

## 2. 技术选型

| 功能 | 技术 | 选型理由 |
|------|------|---------|
| 对比滑动条 | 透明 `<input type="range">` + CSS `clipPath` | 原生支持触摸/键盘，实现简单，无需第三方库 |
| 图层叠加 | CSS `absolute inset-0` + `clipPath: inset(...)` | 纯 CSS 裁切，性能好，不需要 Canvas |
| 全屏弹窗 | `fixed inset-0 z-50` + React 条件渲染 | 无需 Portal，z-index 足够覆盖全页面 |

## 3. 架构与目录结构

```
components/
└── ResultDisplay.tsx   ← 有结果分支：对比滑动条 + 全屏弹窗（已实现，无需改动）
```

## 4. 数据模型

| State | 类型 | 初始值 | 用途 |
|-------|------|--------|------|
| `sliderPos` | `number` | 50 | 分割线位置（0-100） |
| `isZoomed` | `boolean` | false | 弹窗开关 |

两个 state 均为组件内部，不上传 page.tsx。

## 5. 接口契约

### 对比滑动条裁切公式
```ts
// personImage 上层，裁切右侧 (100-sliderPos)%，露出左侧 sliderPos%
clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
```

### 分割线位置
```ts
style={{ left: `${sliderPos}%` }}
```

### ResultDisplayProps（无变化）
```ts
interface ResultDisplayProps {
  resultImage?: string | null;
  personImage?: string | null;
  isLoading: boolean;
  error?: string | null;
  onDownload: () => void;
  onRetry: () => void;
  stage?: "idle" | "queued" | "processing" | "done" | "error";
}
```

## 6. 配置与环境变量

无。

## 7. 安全 / 性能 / 可观测性

**性能**：
- clipPath 由 CSS 渲染，GPU 加速，拖动流畅
- range input onChange 直接 setState，无防抖需求（每次拖动像素级更新）
- isZoomed 弹窗在 false 时完全不渲染（条件渲染），无隐藏 DOM 开销

**可观测性**：无需特殊处理，所有状态均通过 UI 直接体现。

## 8. 风险与回滚

| 风险 | 概率 | 缓解 |
|------|------|------|
| 移动端 range input 触摸区域过小 | 中 | range input 覆盖全区域，触摸面积等于整张图 |
| 弹窗 z-index 被页面其他元素遮挡 | 低 | z-50 = 50，当前页面无更高层级元素 |

**回滚**：代码已实现，无新改动，无回滚需求。

## 9. 与 spec 的对应关系

| FR/SC | 实现位置 |
|-------|---------|
| FR-001 对比滑动条 | `ResultDisplay.tsx` sliderPos state + clipPath + range input |
| FR-002 全屏弹窗 | `ResultDisplay.tsx` isZoomed state + fixed 遮罩 + ✕ 按钮 |
| SC-001 初始 50% / 拖动正确 | sliderPos useState(50) + onChange |
| SC-002 左右标签 | "原图" / "换装后" span 标签 |
| SC-003 深色遮罩 / 居中图 | bg-black/85 + max-w-full max-h-full |
| SC-004 无原图降级 | personImage 为 null 时直接展示 img + onClick 放大 |
| SC-005 isZoomed 重置 | setIsZoomed(false) 在两处关闭路径均调用 |

## 10. 与 constitution.md 的合规检查

constitution.md 不存在，跳过。
