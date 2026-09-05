# 变更历史

> 每版做了什么的快速索引。详细功能规格见 `spec.md`，技术实现见 `plan.md`。
> 更新规则：每轮 `/finish` 后在此追加一节。

---

## v0.1 — 核心交互闭环

**目标**：从零搭出可运行的换装页面骨架，完成"上传 → 生成 → 看结果"完整路径。

**主要内容**：
- 双栏上传区（人像 + 服装），支持点击和拖拽
- 生成按钮（禁用 / 可用 / 生成中 / 完成 四态）
- 结果展示区（静态单图展示）
- 基础 loading 状态（旋转圈）
- `/api/tryon` mock 路由，延迟返回示例图

**技术栈确立**：Next.js App Router + TypeScript + Tailwind CSS + Vercel 部署

---

## v0.2 — UX 三段打磨

**目标**：系统性打磨上传、等待、结果三段体验，让用户从上传到看结果全程不迷茫。

### v0.2a — 上传体验优化

**主要内容**：
- 粘贴上传（Ctrl+V 直接粘贴截图）
- 超过 1200px 的图片客户端自动压缩（Canvas 等比缩放，JPEG 0.85）
- 内联错误提示（格式/大小不符时，组件内显示红色文字，不弹 alert）
- 键盘可访问性（Tab 聚焦，Enter/Space 触发文件选择器）

**改动文件**：`components/UploadZone.tsx`（单文件，新增 `compressImage`、`handlePaste`、`error` state）

### v0.2b — 等待体验优化

**主要内容**：
- 5 条动态分步提示语，每 2 秒切换（"正在分析人物体型..." 等）
- 进度条（ease-out 曲线，`EXPECTED_MS=40000`，最高 90%，不假装完成）+ 数字百分比
- 取消按钮（AbortController 中止请求，回到 idle 状态）
- 30 秒超时保护（自动中断，展示"生成超时，请重试"）

**改动文件**：`components/ResultDisplay.tsx`（EXPECTED_MS 改为 40000，新增进度数字显示）；`components/GenerateButton.tsx`、`app/page.tsx`（取消 + 超时逻辑，v0.1 已实现，本轮补文档）

### v0.2c — 结果体验优化

**主要内容**：
- 前后对比滑动条（原图/换装后两层叠加，透明 range input 控制 clipPath 裁切，默认居中 50%）
- 左上角"原图"、右上角"换装后"标签
- 右下角放大按钮（⛶），全屏弹窗展示结果图，点遮罩或 ✕ 关闭
- 无原图降级：直接展示单图，点击图片触发放大

**改动文件**：`components/ResultDisplay.tsx`（`sliderPos` + `isZoomed` state，有结果分支完整实现）

---

## v0.3 — 生成历史记录

### v0.3a — 客户端历史记录

**目标**：在客户端本地持久化生成历史，让用户可以在同一浏览器中随时回顾历史结果。

**主要内容**：
- 每次生成成功后自动存储结果缩略图（Canvas 等比缩至 120px，JPEG 0.85）到 localStorage
- 存储结构 `HistoryItem { id, timestamp, thumbnail }`，上限 10 条，超出自动淘汰最旧
- 结果卡底部"历史记录"按钮：无历史时灰色禁用；有历史时可点击，展开/收起横向缩略图面板
- HistoryPanel：横向可滚动，每条显示缩略图 + 相对时间（每分钟刷新）+ 右上角删除按钮
- 点击历史缩略图切换当前 resultImage（使用缩略图，不还原原图侧）
- localStorage 写入包裹 try/catch，QuotaExceededError 静默跳过

**新增文件**：`lib/history.ts`（工具函数）、`components/HistoryPanel.tsx`（新组件）
**改动文件**：`components/ResultDisplay.tsx`（底部按钮替换 + 新增 6 个 history props）、`app/page.tsx`（history/isHistoryOpen/selectedHistoryId state + 3 个回调）

**遗留**：
- 切换历史后放大弹窗显示低清缩略图（clarify 决策 Q4 选 B，已接受）
- 相对时间刷新精度最多差 60 秒（可接受）
