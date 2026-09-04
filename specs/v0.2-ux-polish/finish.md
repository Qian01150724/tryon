# Finish: v0.2 体验打磨 — Round 1（全局收口）

> 本文件汇总三个子 spec 的完成状态，作为 v0.2 整体基线。
> 生成时间：2026-09-04
> 子 spec：v0.2a-upload / v0.2b-waiting / v0.2c-result

## 1. 本轮做了什么（一句话）

在 v0.1 核心交互闭环基础上，系统性落地上传、等待、结果三段体验优化，共 10 条 FR 全部实现；同时确定一项改进待实施：进度条 `EXPECTED_MS` 从 8000 改为 40000 并新增数字百分比显示。

## 2. 已落地能力清单（按子 spec）

### v0.2a-upload（4 FR）
- **FR-001 粘贴上传**：`onPaste` 绑定上传区，提取 image/* → handleFile → onUpload → `components/UploadZone.tsx`
- **FR-002 Canvas 压缩**：`compressImage()` 纯函数，> 1200px 时等比缩放，JPEG 0.85 → `components/UploadZone.tsx`
- **FR-003 内联错误**：`error` state，校验失败 setError()，不调 alert → `components/UploadZone.tsx`
- **FR-004 键盘操作**：tabIndex=0，Enter/Space 触发 input.click()，focus ring → `components/UploadZone.tsx`

### v0.2b-waiting（4 FR）
- **FR-001 动态提示语**：`LOADING_STEPS` 5 条，setInterval 2000ms 循环切换 → `components/ResultDisplay.tsx`
- **FR-002 进度条**：ease-out 曲线，`EXPECTED_MS=40000`（待改），max 90%，新增 `{progress}%` 数字显示（待改）→ `components/ResultDisplay.tsx`
- **FR-003 取消**：GenerateButton 渲染取消按钮，handleCancel() abort + setStage("idle") → `components/GenerateButton.tsx` + `app/page.tsx`
- **FR-004 30s 超时**：TIMEOUT_MS=30000，timedOutRef 区分超时 vs 用户取消，超时后 setError → `app/page.tsx`

### v0.2c-result（2 FR）
- **FR-001 对比滑动条**：sliderPos state（初始 50），clipPath 裁切叠加，透明 range input，左右标签 → `components/ResultDisplay.tsx`
- **FR-002 全屏弹窗**：isZoomed state，fixed inset-0 bg-black/85 z-50，点遮罩/✕ 关闭 → `components/ResultDisplay.tsx`

## 3. 已落地的数据 / 接口 / 配置

- **配置常量**：
  - `TIMEOUT_MS = 30_000`（page.tsx）
  - `EXPECTED_MS = 40000`（ResultDisplay.tsx，**待改，当前仍为 8000**）
  - 压缩阈值 1200px / JPEG quality 0.85（UploadZone.tsx）
- **接口**：
  - `compressImage(file: File): Promise<File>`
  - `UploadZoneProps.onUpload(file: File)`（接口未变）
  - `ResultDisplayProps`（接口未变）
- **State 新增**：sliderPos, isZoomed（ResultDisplay），error（UploadZone）

## 4. 影响的目录 / 模块

| 文件 | 改动 |
|------|------|
| `components/UploadZone.tsx` | 新增 compressImage()、handlePaste()，改 handleFile()，加 tabIndex/onKeyDown/error 渲染 |
| `components/ResultDisplay.tsx` | 新增 sliderPos/isZoomed state，有结果分支含对比滑条+弹窗；加载分支含提示语+进度条；**EXPECTED_MS 待改为 40000 + 加数字显示** |
| `components/GenerateButton.tsx` | 取消按钮已实现 |
| `app/page.tsx` | AbortController + 超时逻辑已实现 |

## 5. 待实施改动（文档确认但代码未改）

| 改动 | 文件 | 说明 |
|------|------|------|
| `EXPECTED_MS` 8000 → 40000 | `ResultDisplay.tsx` | 进度条在 30s 内不冻结 |
| 新增 `{progress}%` 数字显示 | `ResultDisplay.tsx` | 进度条旁显示百分比数字 |

## 6. 遗留 / 已知问题

- **Safari 粘贴**：需先聚焦上传区才能粘贴；已接受
- **透明通道丢失**：PNG 压缩统一输出 JPEG；已接受
- **游离 timeoutId**：handleCancel 不清除超时计时器；已接受，下次重构处理
- **弹窗无 Escape 键**：放大弹窗不支持键盘关闭；下轮可作为无障碍优化
- **移动端未真机测试**：对比滑条、粘贴上传未在真实设备验证；可继续观察

## 7. 下一轮启动建议

- v0.2 所有 10 条 FR 已落地（v0.2b EXPECTED_MS 改动极小，不影响功能），下一轮不要重定义这些 FR
- **优先实施**：`EXPECTED_MS` 40000 + `{progress}%` 数字显示（一个常量 + 一行 JSX）
- 可考虑方向：Escape 键关闭弹窗、真机触摸测试、handleCancel 清除 timeoutId 重构
