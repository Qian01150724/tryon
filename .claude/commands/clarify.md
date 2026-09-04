---
description: 读取 spec.md 并生成技术澄清问题清单（Spec-Kit Step 1.5）
argument-hint: <feature 目录路径>
---

你正在执行 Spec-Kit 工作流的 **Clarify** 阶段，链路位置：specify → **clarify** → design → plan → tasks → analyze → finish。

## 输入

- `$1`：feature 目录路径（必填，与 `/specify` 同一目录）
- 自动读取：`$1/spec.md`
- 项目原则：`constitution.md`（如存在则必读）

## 输出

- 写入文件：`$1/clarify.md`（覆盖写入；若目录不存在请先创建）

## 执行步骤

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/clarify specs/002-MMP-refine-UI`」并停止。
2. 读取 `$1/spec.md`。如果文件不存在，报错并提示先运行 `/specify $1`。
3. 如果存在 `constitution.md`，一并读取作为约束依据。
4. 通读 spec，提取所有技术层面模糊、有歧义、或需要决策的点，包括但不限于：
   - 所有 `[NEEDS CLARIFICATION: ...]` 标记
   - 技术选型选项未定（如存储方案、缓存策略、鉴权方式）
   - 数据模型字段未明（类型、可空、唯一性、索引）
   - 接口契约不清（请求/响应格式、错误码、幂等性）
   - 性能 / 安全 / 兼容性指标缺失
   - 与 `constitution.md` 可能冲突的地方
5. 生成 `clarify.md`，必须包含以下结构：

   ```markdown
   # Clarify: <功能名称>

   > 来源：$1/spec.md
   > 用途：将以下问题确认，得到答案后回填本文件再进入 design / plan 阶段。

   ## 1. 来自 [NEEDS CLARIFICATION] 的问题
   ### Q1. <问题标题>
   - **位置**：spec.md FR-XXX / 第 N 节
   - **问题**：…
   - **可选方案**：A) … B) … C) …
   - **建议**：…
   - **答复**：_(待填)_

   ## 2. 技术选型澄清
   ### Q…

   ## 3. 数据模型 / 接口契约澄清
   ### Q…

   ## 4. 与 constitution.md 的潜在冲突
   ### Q…
   ```

6. 每个问题必须包含：位置、问题描述、可选方案、建议、待填的答复占位。
7. 写入 `$1/clarify.md`。
8. 输出简短总结：问题总数、按分类分布。
9. 末尾提示：**回填所有 `_(待填)_` 后，下一步运行 `/design $1`**。

## 约束

- 只列问题，不要替用户决策。
- 不要修改 `spec.md`。
- 输出固定路径 `$1/clarify.md`。
- 在答案回填完毕之前，禁止运行 `/design` 或 `/plan`。
