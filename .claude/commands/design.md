---
description: 把 design/ 文件夹里的设计产物抽象成 design.md 索引（优先读 PDF/截图/NOTES，降级读代码）
argument-hint: <feature 目录路径>
---

你正在执行 Spec-Kit 工作流的 **Design** 阶段。链路上推荐位置：specify → clarify → **design** → plan → tasks → analyze → finish；**但本命令可随时运行、可重复运行**——只要 `$1/design/` 状态变了，重跑一次就把当前内容抽象到 `design.md`。

> 核心职责：把 `$1/design/` 文件夹里**已有的设计产物**抽象成轻量索引 `design.md`。`/plan` 只读 `design.md`，不扫整个 `design/`，避免上下文爆炸。

## `design/` 的理想组织（推荐用户按此整理）

```
design/
├── OVERVIEW.pdf              ← ⭐ 系统总览图（claude.ai/design 的 Print 导出等）
├── screenshots/              ← 逐页/关键组件截图
│   ├── 01-dashboard.png
│   ├── 02-articles-list.png
│   └── ...
├── DESIGN_NOTES.md           ← "为什么"（架构决策、与 Claude 设计聊天的关键内容）
├── tokens.css                ← 只含 :root { --* } 的设计 token（从完整 styles.css 抽出）
├── data-schema.md            ← 数据字段表（比 data.js 可读）
└── prototypes/               ← 原 HTML/CSS/JSX 原型（可选，做交互参考）
```

**即使用户没按这个结构，本命令也能处理任意结构——按下方读取优先级启发式识别。**

## 输入

- `$1`：feature 目录路径（必填）
- 自动读取：`$1/design/` 下所有文件（按下方优先级）
- 可选：`$1/spec.md`（存在则用来映射 FR）、`$1/clarify.md`（仅参考）
- 项目原则：`constitution.md`（如存在则必读）

## 输出

- 写入文件：`$1/design.md`（轻量索引，覆盖写入）

## 前置检查

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/design specs/002-MMP-refine-UI`」并停止。
2. `$1` 目录不存在 → 报错：「目录不存在，请先创建：`mkdir -p $1`」并停止。
3. **不强制要求 spec.md / clarify.md 存在**（用户在 brief 阶段就同步画原型的场景就需要这种独立性）。按存在与否调整行为：
   - 都不存在：纯抽象模式，FR 关联留 `_(待填)_`，后续 spec 出来再回来回填。
   - spec.md 存在：尝试把 design 里的页面/模块映射到 FR 编号。
   - spec.md 含 `## 8. 与已有 design 的关系` 节：说明 spec 已经反向消化过 design，design.md 第 6 节「设计阶段发现的 spec 缺口」自动加一行："本轮 design 在 spec 之前/并行生成，spec 第 8 节已反向消化；若本次 design/ 又有新增模块超出 spec 第 8 节范围，请在此节追加"。
   - clarify.md 含 `_(待填)_`：仅警告不阻断（design 可以先做、clarify 后回填）。
4. 若 `$1/design/` 不存在或为空 → 进入 **Brief 模式**（见下方）。
5. 若项目明确无 UI 界面（纯后端 / 爬虫），且 `$1/design/` 不存在 → 输出「本项目无 UI 界面，跳过 /design，直接运行 `/plan $1`」并停止。

## 执行步骤

### 抽象模式（design/ 存在且非空）——主路径

6. **按以下优先级读取**（高优先级能拿到的信息就不用读低优先级了；Claude 是多模态，直接 Read 图片/PDF 即可）：

   | 优先级 | 文件类型 | 识别 | 用来填 design.md 的哪节 |
   |---|---|---|---|
   | **P0 必读** | `OVERVIEW.pdf` / `overview*.pdf` / 任意顶层 PDF | 文件名含 overview/system/总览，或唯一 PDF | §1 产品概述、§2 页面清单、§4 产物索引 |
   | **P0 必读** | `screenshots/*.png` / `*.jpg` / 截图目录 | 目录名含 screenshots/screens/shots | §2 每页的视觉 ground truth |
   | **P0 必读** | `DESIGN_NOTES.md` / `NOTES.md` / `README.md` | Markdown 文件 | §1 产品概述、§5 关键设计决策、§6 spec 缺口 |
   | **P1 必读** | `tokens.css` / 含 `:root { --* }` 的 CSS | grep `:root` 或 `@theme` | §3 全局约束中的设计 token 表 |
   | **P1 必读** | `data-schema.md` / `*.schema.md` | 文件名含 schema | §2 每页的数据模型 |
   | **P2 按需** | `data.js` / `data.json` / `mock*.js` | 扫字段名即可，不读逻辑 | §2 数据字段（如无 data-schema.md） |
   | **P2 按需** | 顶层 HTML（`*.html`） | 扫布局骨架、章节标题、文案 | §2 每页布局（如无截图） |
   | **P3 按需** | 顶层组件（`components/*.jsx` / `*.tsx`） | 读前 60 行拿 imports + 注释 + props 签名 | §2 模块职责（如其他来源不够） |
   | **跳过** | 工具函数、utils、vendor、node_modules | 一律跳过 | — |

   **读取原则**：
   - 多模态优先——**有 PDF/截图就 Read 图片/PDF**，别去脑补 CSS/JSX 渲染成什么样
   - 按需读取——设计 token 从 `tokens.css` 就能拿到，就别读整份 `styles.css`
   - 单文件 token 预算：PDF 当 1 份 Read（整份），CSS `:root` 段当 1 份 Read（只抽变量），jsx 组件头 60 行

7. **如果 `OVERVIEW.pdf` / 截图都没有，但有一堆代码**：给 design.md 顶部加警告横幅：「⚠️ design/ 中缺少 PDF / 截图，本索引仅从代码结构和 token 推断，视觉保真度不保证。建议补充 OVERVIEW.pdf 或 screenshots/ 后重跑 /design」。

8. 生成 `design.md`，**严格按以下结构**：

   ```markdown
   # Design: <功能名称>

   > 入口：本文件是 plan 阶段的设计上下文。`design/` 文件夹下的 PDF / 截图 / tokens.css 才是 tasks 实施时的视觉 ground truth——**本 md 不替代它们**。
   > 来源：$1/spec.md（若存在）、$1/clarify.md（若存在）、$1/design/ 全部产物

   ## 1. 产品概述
   （从 DESIGN_NOTES.md / OVERVIEW.pdf 概述；一段话）

   ## 2. 页面 / 模块清单

   ### P1. <页面名称>
   - **视觉 ground truth**：
     - PDF 位置：`design/OVERVIEW.pdf` 第 N 页（若来自 OVERVIEW）
     - 截图：`design/screenshots/01-<name>.png`
   - **原型代码**（可选交互参考）：`design/prototypes/<file>`
   - **用途**：这个页面做什么
   - **用户角色**：谁在用
   - **数据模型**（从 data-schema.md 或 data.js 提取，列字段）：
     - `Entity { field: type, ... }`
   - **核心功能 / 交互**：
     - 功能点 1（来自 FR-XXX）
     - 功能点 2（来自 FR-XXX）
   - **布局要点**（一两句话，不细描视觉——视觉请看截图）
   - **关联 FR**：FR-001, FR-002, ...

   ### P2. ...

   ## 3. 全局约束 & 设计 token

   ### 3.1 通用约束
   - 响应式要求、无障碍要求等

   ### 3.2 设计 token（从 tokens.css 提取，coding 时严格匹配）

   | Token | 值 | 用途 |
   |---|---|---|
   | `--sidebar-bg` | `#0E1729` | 暗色侧边栏背景 |
   | `--accent` | `#2563EB` | 主色 / 选中态 |
   | ... | ... | ... |

   ## 4. 设计产物索引

   ### 4.1 系统级产物（实施前先看）
   - **OVERVIEW**：`design/OVERVIEW.pdf`（系统全景；coding agent 实施前必读）
   - **DESIGN_NOTES**：`design/DESIGN_NOTES.md`（架构决策 / "为什么"）
   - **tokens.css**：`design/tokens.css`（设计 token 源文件）
   - **data-schema**：`design/data-schema.md`

   ### 4.2 每页产物映射
   | 页面 | 截图 | 原型 | 关联 FR |
   |---|---|---|---|
   | P1. xxx | `design/screenshots/01-xxx.png` | `design/prototypes/xxx.jsx` | FR-001 |
   | P2. yyy | `design/screenshots/02-yyy.png` | — | FR-002 |

   ## 5. 关键设计决策（从 DESIGN_NOTES.md 归纳）
   - 架构：…
   - 数据流：…
   - 与现有目录的集成点：…

   ## 6. 设计阶段发现的 spec 缺口

   > 写原型/出稿时才暴露、spec 没覆盖的事项。/plan 会读这一节。
   > 如缺口大到要改 FR，请先回 /specify $1 重跑（在 brief.md 里加上新需求）再继续。

   - （可空。若 spec.md 含 §8，在此节顶部自动写："本轮 design 已被 spec §8 反向消化；如本次扫描到 §8 没列的新模块，请追加"）

   ## 7. Design 产出（定稿后回填）

   | 页面 | Design URL / Handoff / 原型路径 | 状态 |
   |------|-------------------------------|------|
   | P1. xxx | `design/screenshots/01-xxx.png` | 已出稿 |
   | P2. yyy | _(待填)_ | 待设计 |
   ```

9. 写入 `$1/design.md`。

### Brief 模式（design/ 不存在或为空）——备用路径

10. 如果 spec.md 存在：从 spec 提取页面/模块清单，按第 8 步结构生成 design.md，第 2 节每页留占位：

    ```
    ### P1. <页面名称>
    - **视觉 ground truth**：_(待出稿后回填)_
    - **原型代码**：_(待出稿后回填)_
    - ...
    ```

    第 3.2 / 4 节也留 `_(待填)_`，等用户出稿后**重跑 /design**。

11. 如果 spec.md 也不存在：仅生成 design.md 的空模板，提示用户先写 brief.md 跑 /specify，或直接开始在 design/ 下画原型。

## 输出提示

12. 按当前模式输出对应提示：

    - **抽象模式**：

      ```text
      已基于 $1/design/ 抽象出 design.md。
      读取摘要：PDF x N、截图 x N、NOTES、tokens、原型若干。

      请用户核对：
      - 第 4.2 节「每页产物映射」是否准确（FR 关联可能要补）
      - 第 5 节「关键设计决策」是否需要补充
      - 第 6 节「设计阶段发现的 spec 缺口」请填
      - 第 3.2 节 token 表是否完整

      核对完成后运行 /plan $1。
      ```

13. **在 `$1/design.md` 末尾追加开发注意事项**（固定写入，每次覆盖）：

    ```markdown

    ---

    ## 8. 开发注意事项

    > ⚠️ **开发人员必读——不要跳过这一节直接开始写代码。**

    ### 8.1 先看原型再动手
    design/ 下有完整的交互原型，**写代码前必须先跑起来看一遍**：
    ```bash
    cd "$1/design" && npx serve .
    ```
    打开浏览器访问后，逐页点击，理解每个页面的布局、交互、数据。
    截图在 `design/shotscreen/`（或 `design/screenshots/`），原型代码是视觉真相的补充——**截图优先，代码参考**。

    ### 8.2 逐批实现，每批验证
    - **禁止一口气实现所有功能**。按 tasks.md 的顺序，每完成一批就在浏览器里验证
    - 验证不是 `pnpm typecheck`——是**打开页面，看数据有没有渲染出来，交互能不能点**
    - 数据层（migration / API）和 UI 层不要放在同一批。先确认 API 返回正确数据，再做页面

    ### 8.3 对照设计图自检
    每个页面写完后，打开原型截图和实际页面**左右对比**：
    - 布局是否一致（几列、间距、对齐）
    - 组件是否齐全（有没有漏掉某个面板/表格/按钮）
    - 数据是否渲染（不能全是空/0/placeholder）
    ```

    - **Brief 模式**：

      ```text
      design/ 为空，已生成 Design Brief 模板：$1/design.md

      下一步（人工操作）：
      1. 在 claude.ai/design / Figma / 代码工具里出原型
      2. 把产物整理到 $1/design/：
         - OVERVIEW.pdf（系统全景）
         - screenshots/（每页截图）
         - DESIGN_NOTES.md（架构决策）
         - tokens.css（设计 token）
      3. 重跑 /design $1，本命令会切到抽象模式

      全部回填完成后运行 /plan $1。
      ```

## 约束

- 不要生成 plan 或 tasks。
- 不要修改 spec.md / clarify.md / design/ 下任何文件。
- `design.md` 是必产物。
- **优先读 PDF/截图/NOTES/tokens，降级读代码**。有 OVERVIEW.pdf 就别从 jsx 脑补系统全景。
- 不要把 PDF/截图/源码的完整内容塞进 design.md——`design.md` 只承担"索引 + 数据/token 摘要 + 指向文件"职责。实施时 coding agent 会自己 Read 这些文件。
- 项目无 UI 时直接放行到 `/plan`，不要强制建空的 design 产物。
