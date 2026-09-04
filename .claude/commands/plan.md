---
description: 基于 spec.md + clarify.md + design 生成技术方案 plan.md（Spec-Kit Step 2）
argument-hint: <feature 目录路径>
---

你正在执行 Spec-Kit 工作流的 **Plan** 阶段，链路位置：specify → clarify → design → **plan** → tasks → analyze → finish。

## 输入

- `$1`：feature 目录路径（必填）
- 自动读取：`$1/spec.md`
- 自动读取：`$1/clarify.md`
- 自动读取设计产物：`$1/design.md`（单文件形式）**或** `$1/design/`（文件夹形式，内含多个设计文件）
- 项目原则：`constitution.md`（如存在则必读）

## 输出

- 写入文件：`$1/plan.md`（覆盖写入；若目录不存在请先创建）

## 前置检查

**执行前置检查时，必须将每一步的检查结果以下方格式打印给用户，让用户看到完整的自检过程：**

```
## 前置检查

| # | 检查项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | $1 非空 | ✅ / ❌ | 路径：`...` |
| 2 | spec.md 存在 | ✅ / ❌ | N 行，M 条 FR |
| 3 | clarify.md 存在 | ✅ / ❌ | N 行，M 个问题 |
| 4 | design.md 或 design/ 存在 | ✅ / ❌ | design.md N 行 / design/ M 个文件 |
| 5 | clarify.md 无 _(待填)_ | ✅ / ⚠️ / ❌ | 全部已答 / 剩余 N 个未答 |
| 6 | design.md 无阻塞性 _(待填)_ | ✅ / ⚠️ | N 处待补截图（不阻塞 / 阻塞） |
| 7 | design.md §6 spec 缺口 | ✅ / ⚠️ / ❌ | 无缺口 / N 项可消化 / N 项需回退 specify |
| 8 | constitution.md | ✅ / ⬚ | 已读取 vX.X / 不存在（跳过） |

**结论**：全部通过，开始生成 plan。/ ❌ 检查未通过，停止。
```

如果任何 ❌ 项存在，打印表格后**立即停止**，不生成 plan。⚠️ 项打印警告但不阻塞。

---

### 检查步骤细则

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/plan specs/002-MMP-refine-UI`」并停止。

2. **三件套硬性检查**：在 `$1` 下必须同时满足以下三项：
   - 存在 `spec.md`
   - 存在 `clarify.md`
   - 存在 **`design.md`（单文件）** 或 **`design/` 文件夹**（文件夹必须非空，内含至少一个文件）

   如果任何一项缺失，**立即拒绝执行 plan 指令**，列出缺失的文件/文件夹，并提示对应的前置命令：
   - 缺 `spec.md` → 先运行 `/specify $1`
   - 缺 `clarify.md` → 先运行 `/clarify $1`
   - `design.md` 和 `design/` 文件夹都没有（或 `design/` 为空）→ 先运行 `/design $1`

   三项齐全才允许进入下一步。

3. 读取 `$1/spec.md`、`$1/clarify.md`，以及设计产物：
   - 如果是 `design.md`，整文件读入。
   - 如果是 `design/` 文件夹，递归列出所有文件并读取相关设计稿（Markdown / HTML / 截图说明 / Figma 链接清单 / Handoff 文档等），把整个文件夹视作设计输入；在 plan 中按需引用具体文件路径。
4. 检查 `clarify.md` 中是否仍存在 `_(待填)_` 的答复占位：
   - 如果存在，**停止生成 plan**，列出未回答的问题，提示「未确认完所有 clarify 问题，禁止生成 plan」。
5. 检查设计产物的完整性：
   - 单文件 `design.md`：如存在 `_(待填)_` 的 Design URL / Handoff，区分是否阻塞：
     - 仅截图待补（有原型代码可参考）→ ⚠️ 警告，不阻塞
     - 整个页面设计方向未定 → ❌ 阻塞，提示用户先回填
   - 文件夹 `design/`：如存在明显的占位文件（空文件、`TODO` 标题、`_(待填)_` 等），提示用户补齐后再生成 plan。
   已回填的内容在 plan 中引用。
6. 检查 `design.md` 第 6 节「设计阶段发现的 spec 缺口」：
   - 空 → ✅
   - 非空但可在 plan 内消化 → ⚠️，在 plan 中显式承接
   - 缺口大到要改 FR → ❌ 停止，提示回退 `/specify $1`
7. 如果存在 `constitution.md`，读取并作为硬约束。

## 执行步骤

7. 综合 spec.md 的需求 + clarify.md 中的答复 + `design.md` 的索引/决策/缺口章节，生成 `plan.md`。
   - **不要**主动深入读 `design/` 文件夹下的源码文件——`design.md` 已经把 plan 需要的信息抽出来了。仅当 plan 某节明确需要参考某个具体原型实现时，才按 `design.md` 第 4 节给的路径精读对应文件。
   - **必须读** `design.md` 的第 6 节「设计阶段发现的 spec 缺口」。如果该节非空：
     - 缺口可在 plan 内消化的 → 在 plan 中显式说明如何承接
     - 缺口大到要改 FR 的 → **停止生成 plan**，提示用户回 `/specify $1`（在 brief.md 里追加新需求后重跑）
8. plan.md 必须包含以下章节：
   - `# Plan: <功能名称>`
   - `## 1. 总体方案`（一段话讲清楚怎么做）
   - `## 2. 技术选型`（Python / GitHub Actions / Cloudflare D1 + R2 / Playwright / Astro admin CMS；逐项说明为何选这个）
   - `## 3. 架构与目录结构`（受影响的目录和模块）
   - `## 4. 数据模型`（D1 表结构、字段、索引、迁移策略）
   - `## 5. 接口契约`（API / 函数签名 / 输入输出）
   - `## 6. 配置与环境变量`（不允许硬编码）
   - `## 7. 安全 / 性能 / 可观测性`
   - `## 8. 风险与回滚`
   - `## 9. 与 spec 的对应关系`：列出每条 FR/SC 由哪部分实现
   - `## 10. 与 constitution.md 的合规检查`：逐条原则打勾

9. **硬性合规要求**（违反任何一条都必须改方案）：
   - 配置不得硬编码，必须走环境变量或 GitHub Secrets
   - 敏感凭证（代理 IP、API Key）不得出现在代码中
   - 不引入 `constitution.md` 禁止的服务

10. 写入 `$1/plan.md`（与 spec.md 同目录；目录不存在请先创建）。
11. 输出简短总结：技术选型清单、合规检查结果、是否有风险点；是否触发了 design 缺口回流。
12. 末尾提示：**下一步请运行 `/tasks $1`，将 plan 拆解为可执行任务。**

## 约束

- 不要拆 tasks，不要写代码。
- 不要修改 spec.md / clarify.md / design.md / `design/` 文件夹下任何文件。
- 输出固定路径 `$1/plan.md`（与 spec.md 同目录）。
- 默认不读 `design/` 下的源码文件。`design.md` 的索引就是 plan 的设计上下文。
- plan 生成后直接进入 `/tasks` 阶段，不需要等待 approve。审核节点在 analyze 之后；本轮终点在 `/finish`。
