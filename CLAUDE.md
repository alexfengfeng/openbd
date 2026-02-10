# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 **Next.js 15 + Prisma + MySQL** 的多租户需求管理 SaaS 系统，支持 AI 辅助需求录入功能。

## 常用命令

### 开发与构建
```bash
pnpm dev          # 启动开发服务器 (http://localhost:3000)
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 运行 ESLint 代码检查
```

### 数据库操作
```bash
pnpm db:generate  # 生成 Prisma Client
pnpm db:push      # 推送 schema 到数据库
pnpm db:seed      # 填充种子数据
pnpm db:studio    # 打开 Prisma Studio 管理界面
node scripts/init-db.js  # 重新创建数据库（开发环境专用）
```

### 测试
```bash
pnpm test           # 运行单元测试（交互模式）
pnpm test:unit      # 运行单元测试（单次）
pnpm test:coverage  # 生成覆盖率报告（覆盖率门槛：80% 行/函数/语句，70% 分支）
pnpm test:e2e       # 运行 E2E 测试（Playwright）
```

## 架构设计

### 技术栈
- **前端**: React 19, Next.js 15 (App Router), TailwindCSS, shadcn/ui
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: MySQL 8.0
- **认证**: JWT + bcrypt (使用 jose 库)
- **状态管理**: TanStack React Query
- **表单**: React Hook Form + Zod

### 目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证相关页面组（login, register）
│   ├── (dashboard)/         # 仪表板相关页面组
│   ├── api/                 # API 路由
│   │   ├── auth/           # 认证 API (login, register, me, logout)
│   │   ├── workspaces/     # 工作空间 CRUD
│   │   ├── requirements/   # 需求 CRUD + 状态更新
│   │   ├── tags/           # 标签 CRUD
│   │   └── ai/             # AI 解析需求
│   ├── layout.tsx          # 根布局
│   └── globals.css         # 全局样式
│
├── components/              # React 组件
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── requirements/        # 需求相关组件
│   └── ai/                 # AI 相关组件
│
├── lib/                    # 工具库
│   ├── prisma.ts           # Prisma 客户端单例
│   ├── auth.ts             # 认证工具 (getServerSession, 密码哈希/验证)
│   ├── jwt.ts              # JWT 签名/验证 (使用 jose)
│   ├── rateLimit.ts        # 速率限制
│   └── utils.ts            # 通用工具函数
│
└── middleware.ts           # Next.js 中间件（JWT 验证，路由保护）
```

### 认证流程

1. **JWT 认证**: 使用 `jose` 库实现 JWT 签名和验证
2. **中间件保护**: `src/middleware.ts` 拦截所有请求，验证 `auth-token` cookie
3. **公开路由**: `/login`, `/register`, `/api/auth/login`, `/api/auth/register`
4. **服务端会话**: 使用 `getServerSession()` 从 cookie 获取用户信息
5. **请求头注入**: 中间件将 `x-user-id` 和 `x-user-username` 注入到请求头

### 数据模型

核心实体（位于 `prisma/schema.prisma`）：
- **User**: 用户（username, passwordHash）
- **Workspace**: 工作空间（name, slug, ownerId, deletedAt 支持软删除）
- **WorkspaceMember**: 工作空间成员（workspaceId, userId, role）
- **Requirement**: 需求（workspaceId, title, status, priority, assigneeId, deletedAt 支持软删除）
- **Tag**: 标签（workspaceId, name, color）
- **RequirementTag**: 需求-标签多对多关联
- **TagTemplate**: AI 标签模板（workspaceId, name, prompt），用于 AI 解析需求时识别标签

枚举类型：
- `MemberRole`: OWNER, ADMIN, MEMBER, VIEWER
- `RequirementStatus`: BACKLOG, TODO, IN_PROGRESS, DONE
- `RequirementPriority`: LOW, MEDIUM, HIGH, URGENT

### 路由组织

- **路由组**: 使用 `(auth)` 和 `(dashboard)` 路由组分离布局和逻辑
- **布局继承**: 仪表板页面共享 `(dashboard)/layout.tsx` 布局
- **API 命名**: RESTful 风格，使用动态路由 `[id]` 处理资源 ID

## 环境变量

必需的环境变量（参考 `.env.example`）：
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/fast_json"
JWT_SECRET="至少32字符的随机密钥"
```

可选的环境变量：
```env
DEEPSEEK_API_KEY="sk-..."  # AI 解析功能的 DeepSeek API Key，未配置时自动降级到本地规则解析
```

## UI 组件

- 基于 **shadcn/ui** + **Radix UI** + **TailwindCSS**
- 使用 `class-variance-authority` 管理组件变体
- 使用 `tailwind-merge` 合并 className
- 使用 `cn()` 工具函数组合类名

## 开发注意事项

1. **路径别名**: 使用 `@/*` 指向 `src/*` 目录
2. **Prisma 操作**: 始终使用 `src/lib/prisma.ts` 导出的单例实例
3. **密码处理**: 使用 `hashPassword()` 和 `verifyPassword()` 工具函数
4. **JWT 操作**: 使用 `signToken()` 和 `verifyAuth()` 工具函数
5. **用户会话**: 在服务端组件中使用 `getServerSession()` 获取当前用户
6. **API 路由**: 从请求头获取 `x-user-id` 而非从 cookie（中间件已注入）
7. **Prisma Client 生成**: 若出现 `@prisma/client did not initialize yet`，先执行 `pnpm db:generate`（建议使用 `pnpm dev` 启动）
8. **软删除**: Workspace 和 Requirement 支持软删除（deletedAt），查询时需使用 `where: { deletedAt: null }` 过滤
9. **AI 降级**: DeepSeek API 调用失败时，AI 解析功能会自动降级到本地规则解析

## 架构要点

### AI 需求解析流程
- 客户端：`src/components/ai/AIRequirementCreator.tsx`
- API：`src/app/api/ai/parse-requirement/route.ts`
- 核心逻辑：`src/lib/ai/deepseek-client.ts`（DeepSeek API）、`src/lib/ai/local-parser.ts`（本地降级）
- 标签模板：`src/lib/templates/requirement-templates.ts` 提供需求录入模板

### 拖拽排序
- 使用 `@dnd-kit` 库实现看板拖拽
- 核心逻辑：`src/components/requirements/dragLogic.ts`
- API：`src/app/api/requirements/reorder/route.ts` 批量更新状态与排序

### 测试策略
- **单元测试**：Vitest + jsdom，覆盖率门槛 80%
- **E2E 测试**：Playwright，测试目录 `e2e/`
- **测试配置**：`vitest.config.ts` 和 `playwright.config.ts`

## 测试账号

种子数据创建的测试账号（`prisma/seed.ts`）：
- 用户名: `admin` / 密码: `admin123`（管理员）
- 用户名: `testuser` / 密码: `test123`（普通用户）
