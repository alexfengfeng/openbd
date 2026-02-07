# API 文档（摘要）

说明：本项目使用 Next.js Route Handlers，所有受保护接口依赖 `auth-token` Cookie（JWT）。未登录返回 401，无权限返回 403。

## 1. 认证

- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/auth/me`
- POST `/api/auth/logout`

## 2. 工作空间

### 2.1 获取工作空间列表

- GET `/api/workspaces`
- 返回：`{ workspaces: Workspace[] }`
- 排序：`lastVisitedAt desc`（空值置后）→ `updatedAt desc`

### 2.2 记录最近访问

- POST `/api/workspaces/[id]/visit`
- 返回：`{ success: true }`
- 失败：非成员 403

## 3. 需求

### 3.1 获取需求列表

- GET `/api/requirements?workspaceId=...`
- 可选筛选：`status`、`priority`、`assigneeId`
- 可选视图：`view=board`
  - `view=board` 时排序：`status asc`、`order asc`、`updatedAt desc`

### 3.2 创建需求

- POST `/api/requirements`
- Body：
  - `workspaceId`（uuid）
  - `title`（必填）
  - `description`、`priority`、`status`、`tagIds`、`assigneeId`、`dueDate`（可选）

### 3.3 更新需求（含排序字段）

- PUT `/api/requirements/[id]`
- Body（可选字段）：
  - `title`、`description`、`priority`、`status`、`order`、`assigneeId`、`dueDate`、`tagIds`

### 3.4 更新状态

- PATCH `/api/requirements/[id]/status`
- Body：`{ status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" }`

### 3.5 批量更新排序/状态（看板拖拽使用）

- PATCH `/api/requirements/reorder`
- Body：
  - `workspaceId`
  - `updates: Array<{ id, status?, order }>`
- 返回：`{ success: true }`

### 3.6 批量导入（JSON）

- POST `/api/requirements/import`
- Body：
  - `workspaceId`
  - `requirements: Array<{ title, description?, priority?, status?, tags? }>`
- 返回：`{ createdCount, failedCount, results }`

## 4. AI

### 4.1 解析需求描述

- POST `/api/ai/parse-requirement`
- Body：`{ prompt: string }`
- 返回：`{ parsed: { title, description, priority, status, tags } }`
- 特性：
  - 未配置 `DEEPSEEK_API_KEY`：自动降级为本地规则解析（返回 `degraded: true`）
  - 缓存：默认 30 分钟（返回 `cached: true`）
  - 限流：默认 10 次/分钟/用户（返回 429）

### 4.2 建议标题

- POST `/api/ai/suggest-title`
- Body：`{ description: string }`
- 返回：`{ title: string }`

