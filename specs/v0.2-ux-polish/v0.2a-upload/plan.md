# Plan: v0.2a 上传体验优化

## 1. 总体方案

全部变更集中在 `components/UploadZone.tsx` 单文件内。四项功能均为纯客户端实现，不涉及服务端改动、数据库、环境变量或新增依赖。代码已在 v0.2 中完整落地，本 plan 记录实现方案供 tasks 阶段验证和 finish 阶段归档。

## 2. 技术选型

| 功能 | 技术 | 选型理由 |
|------|------|---------|
| 粘贴上传 | `ClipboardEvent.clipboardData.items` | 浏览器原生 API，无需依赖 |
| 图片压缩 | `Canvas 2D Context` + `FileReader` | 客户端处理，零网络开销，无需服务端 |
| 内联错误 | React `useState<string \| null>` | 组件内 state，最简实现 |
| 键盘操作 | `tabIndex={0}` + `onKeyDown` | 原生 HTML 可访问性方案，无需额外库 |

## 3. 架构与目录结构

```
components/
└── UploadZone.tsx      ← 唯一改动文件
    ├── compressImage()     纯函数，Canvas 压缩逻辑
    ├── handleFile()        统一校验 + 压缩入口
    ├── handlePaste()       ClipboardEvent 处理
    └── JSX                 tabIndex / onKeyDown / error 渲染
```

**不影响的文件**：
- `app/page.tsx`：`onUpload` 回调接口不变
- `app/api/tryon/route.ts`：服务端不感知压缩
- 其他组件：无依赖关系

## 4. 数据模型

不涉及数据库或持久化。组件内部状态：

| State | 类型 | 用途 |
|-------|------|------|
| `isDragOver` | `boolean` | 控制拖拽高亮样式 |
| `error` | `string \| null` | 内联错误文本，null 时不渲染 |

上传完成后通过 `onUpload(file: File)` 将压缩后的 File 传给父组件，状态不在 UploadZone 内持久化。

## 5. 接口契约

### `compressImage(file: File): Promise<File>`
- 输入：任意 image/* File
- 行为：宽或高 ≤ 1200px 时原样返回；超过则 Canvas 等比缩放，`toBlob` 输出 JPEG 0.85
- 输出：新 File（扩展名改为 `.jpg`）或原 File（无需压缩时）
- 副作用：无

### `UploadZoneProps`
```ts
interface UploadZoneProps {
  type: "person" | "clothing";
  label: string;
  icon: string;
  onUpload: (file: File) => void;   // 接收压缩后的 File
  onRemove: () => void;
  imagePreview?: string | null;
  isUploading?: boolean;
}
```

### 内联错误触发条件
| 条件 | 错误文本 |
|------|---------|
| `!file.type.startsWith("image/")` | `"请上传图片文件（JPG / PNG / WEBP）"` |
| `file.size > 10 * 1024 * 1024` | `"图片不能超过 10MB"` |

## 6. 配置与环境变量

无。压缩阈值（1200px）和质量（0.85）为 hardcode 常量，经 clarify 确认不需要可配置（Q3 答复 A）。

## 7. 安全 / 性能 / 可观测性

**安全**：
- 粘贴处理仅提取 `image/*` 类型，非图片 ClipboardData 直接忽略
- 文件大小上限 10MB 在压缩前校验，防止超大文件进入 Canvas 处理

**性能**：
- 压缩在主线程执行，大图（如 4K）可能阻塞 UI ~100-300ms；当前规模（单文件上传）可接受，无需 Web Worker
- 已上传态下，`imagePreview` 为 base64 DataURL，存于内存；页面刷新后清空，无泄漏风险

**可观测性**：
- 错误状态通过内联文本对用户可见
- 无日志、无埋点需求（v0.2 范围内）

## 8. 风险与回滚

| 风险 | 概率 | 缓解 |
|------|------|------|
| Canvas `toBlob` 在某些浏览器返回 null | 低 | 已有 fallback：`blob ? new File(...) : file` |
| 粘贴事件在 Safari 行为差异 | 中 | 粘贴区域需先聚焦；Safari 不支持在 `paste` 之前读取 clipboardData 类型，实际测试需覆盖 |
| 大图压缩时 UI 短暂卡顿 | 低 | 可接受，v0.2 不做 Web Worker 优化 |

**回滚**：本改动为单文件变更，git revert 即可完整回滚，不影响其他模块。

## 9. 与 spec 的对应关系

| FR/SC | 实现位置 |
|-------|---------|
| FR-001 粘贴上传 | `UploadZone.tsx` `handlePaste()` + `onPaste` 事件绑定 |
| FR-002 Canvas 压缩 | `UploadZone.tsx` `compressImage()` 函数 |
| FR-003 内联错误 | `UploadZone.tsx` `error` state + JSX 渲染 `<p className="text-red-500">` |
| FR-004 键盘操作 | `UploadZone.tsx` `tabIndex={0}` + `onKeyDown` + `focus:` Tailwind 类 |
| SC-001 粘贴截图显示预览 | handlePaste → handleFile → onUpload → parent setPersonImage/setClothingImage |
| SC-002 压缩后尺寸 ≤ 1200px | compressImage 等比缩放逻辑 |
| SC-003 无 alert 弹窗 | setError() 替代 alert() |
| SC-004 键盘完整上传流程 | tabIndex + onKeyDown + input.click() |
| SC-005 成功后错误清除 | handleFile 头部 `setError(null)` |

## 10. 与 constitution.md 的合规检查

constitution.md 不存在，跳过。
