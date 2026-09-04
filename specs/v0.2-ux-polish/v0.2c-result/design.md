# Design: v0.2c 结果体验优化

> 入口：本文件是 plan 阶段的设计上下文。
> 来源：specs/v0.2-ux-polish/v0.2c-result/spec.md（无 design/ 产物；实现已落地于 `components/ResultDisplay.tsx`，代码即设计真相）

⚠️ **design/ 目录不存在**。功能已完整实现，视觉 ground truth 为运行页面的结果展示区。

## 1. 产品概述

结果展示是换装工具的终点体验。v0.2c 在结果图上叠加前后对比滑动条，并提供全屏放大弹窗，让用户能直观评估换装效果细节。两个功能均集中在 `ResultDisplay.tsx` 的有结果分支。

## 2. 页面 / 模块清单

### M1. 前后对比滑动条（`components/ResultDisplay.tsx` L96-175）

- **视觉 ground truth**：运行页面生成结果后的对比区域
- **原型代码**：`components/ResultDisplay.tsx` 有 personImage 时的 JSX（L99-151）
- **用途**：在同一区域叠加展示原图（上层 clipPath 裁切）和结果图（底层），拖动分割线对比
- **数据模型**：
  - `sliderPos: number`（useState 初始 50，range 0-100）
  - `resultImage: string`（换装结果 DataURL）
  - `personImage: string`（原图 DataURL）
- **核心功能 / 交互**：
  - 底层：resultImage 全幅展示（关联 FR-001）
  - 上层：personImage 以 `clipPath: inset(0 ${100-sliderPos}% 0 0)` 裁切（关联 FR-001）
  - 分割线：白色细线 + 圆形手柄（↔），位置跟随 sliderPos（关联 FR-001）
  - 透明 range input 覆盖全区域，`cursor-ew-resize`（关联 FR-001）
  - 左上"原图"标签、右上"换装后"标签（关联 SC-002）
  - 右下放大按钮 ⛶（关联 FR-002）
- **布局要点**：aspect-[3/4] 容器，`select-none` 防止拖拽时选中文字
- **关联 FR**：FR-001, FR-002

### M2. 全屏放大弹窗（`components/ResultDisplay.tsx` L177-196）

- **视觉 ground truth**：点放大按钮后的全屏遮罩
- **原型代码**：`components/ResultDisplay.tsx` isZoomed 条件渲染（L177-196）
- **用途**：全屏展示换装结果图，供用户查看细节
- **数据模型**：
  - `isZoomed: boolean`（useState 初始 false）
- **核心功能 / 交互**：
  - `fixed inset-0 bg-black/85 z-50`（关联 FR-002）
  - 结果图 `max-w-full max-h-full object-contain rounded-lg`（关联 SC-003）
  - 点遮罩关闭（onClick → setIsZoomed(false)）（关联 FR-002）
  - ✕ 按钮关闭（关联 FR-002）
  - 点图片本身不关闭（stopPropagation）（关联 FR-002）
- **关联 FR**：FR-002

### M3. 无原图降级（`components/ResultDisplay.tsx` L152-158）

- **用途**：personImage 为 null 时，直接展示结果图，点击触发放大
- **核心功能**：`cursor-zoom-in` + onClick → setIsZoomed(true)
- **关联 FR**：FR-001（降级分支）/ SC-004

## 3. 全局约束 & 设计 token

| 值 | 用途 |
|----|------|
| `aspect-[3/4]` | 对比区域宽高比 |
| `select-none` | 拖拽时禁止文字选中 |
| `bg-black/85` | 弹窗遮罩不透明度 |
| `bg-black/40` 标签 | 左上"原图"标签背景 |
| `bg-purple-500/80` 标签 | 右上"换装后"标签背景 |
| `z-50` | 弹窗层级 |

## 4. 设计产物索引

| 模块 | 代码 | 关联 FR |
|------|------|---------|
| M1. 对比滑动条 | `ResultDisplay.tsx` L99-151 | FR-001 |
| M2. 全屏弹窗 | `ResultDisplay.tsx` L177-196 | FR-002 |
| M3. 无原图降级 | `ResultDisplay.tsx` L152-158 | SC-004 |

## 5. 关键设计决策

- **透明 range input**：覆盖整个对比区域，原生支持触摸和键盘，不手写拖拽事件（clarify Q1 答复 A）
- **弹窗仅展示结果图**：不在弹窗内加对比滑条（clarify Q2 答复 A）
- **sliderPos 不重置**：重新生成后保留上次拖动位置（clarify Q3 答复 A）

## 6. 设计阶段发现的 spec 缺口

无。代码与 spec 完全对齐。

## 7. Design 产出

| 模块 | 产物 | 状态 |
|------|------|------|
| M1. 对比滑动条 | `ResultDisplay.tsx` | ✅ 已实现 |
| M2. 全屏弹窗 | `ResultDisplay.tsx` | ✅ 已实现 |
| M3. 无原图降级 | `ResultDisplay.tsx` | ✅ 已实现 |

---

## 8. 开发注意事项

### 8.1 代码即真相
`components/ResultDisplay.tsx` 有结果分支是视觉参考，直接运行 `pnpm dev` 上传图片生成后查看。

### 8.2 验证路径
1. 对比滑动条：上传人物图 + 服装图 → 生成 → 拖动滑条确认左右切换
2. 标签：左上"原图"、右上"换装后"标签可见
3. 放大弹窗：点右下 ⛶ → 全屏弹窗出现 → 点 ✕ 或遮罩 → 弹窗消失
4. 无原图降级：若 personImage 为空，结果图直接显示，点击可放大
