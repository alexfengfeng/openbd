import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      email: 'admin@example.com',
    },
  });
  console.log('创建管理员用户:', admin.username);

  // 创建测试用户
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      passwordHash: testPassword,
      email: 'test@example.com',
    },
  });
  console.log('创建测试用户:', testUser.username);

  // 创建示例工作空间
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: '演示工作空间',
      slug: 'demo-workspace',
      ownerId: admin.id,
    },
  });
  console.log('创建工作空间:', workspace.name);

  // 添加工作空间成员
  await prisma.workspaceMember.upsert({
    where: {
      id: 'admin-member-demo',
    },
    update: {},
    create: {
      id: 'admin-member-demo',
      workspaceId: workspace.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      id: 'test-member-demo',
    },
    update: {},
    create: {
      id: 'test-member-demo',
      workspaceId: workspace.id,
      userId: testUser.id,
      role: 'MEMBER',
    },
  });

  // 创建示例标签
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { id: 'tag-bug' },
      update: {},
      create: {
        id: 'tag-bug',
        workspaceId: workspace.id,
        name: 'Bug',
        color: '#EF4444',
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-feature' },
      update: {},
      create: {
        id: 'tag-feature',
        workspaceId: workspace.id,
        name: '新功能',
        color: '#3B82F6',
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-improvement' },
      update: {},
      create: {
        id: 'tag-improvement',
        workspaceId: workspace.id,
        name: '优化',
        color: '#10B981',
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-urgent' },
      update: {},
      create: {
        id: 'tag-urgent',
        workspaceId: workspace.id,
        name: '紧急',
        color: '#F59E0B',
      },
    }),
  ]);
  console.log('创建标签:', tags.length, '个');

  // 创建示例需求
  const requirements = [
    {
      title: '实现用户登录功能',
      description: '需要实现用户名密码登录，支持记住登录状态',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      assigneeId: admin.id,
    },
    {
      title: '添加需求看板视图',
      description: '类似于 Trello 的看板视图，可以拖拽需求卡片',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      assigneeId: testUser.id,
    },
    {
      title: '优化移动端显示',
      description: '在手机上访问时界面需要适配',
      status: 'TODO' as const,
      priority: 'LOW' as const,
    },
    {
      title: '导出需求为 PDF',
      description: '用户可以将需求列表导出为 PDF 文件',
      status: 'BACKLOG' as const,
      priority: 'MEDIUM' as const,
    },
    {
      title: '修复需求标签删除bug',
      description: '删除标签后关联需求没有正确移除',
      status: 'TODO' as const,
      priority: 'URGENT' as const,
      assigneeId: admin.id,
    },
  ];

  for (const req of requirements) {
    const requirement = await prisma.requirement.create({
      data: {
        workspaceId: workspace.id,
        ...req,
        createdById: admin.id,
      },
    });

    // 为需求添加标签
    const tagIndex = Math.floor(Math.random() * tags.length);
    await prisma.requirementTag.create({
      data: {
        requirementId: requirement.id,
        tagId: tags[tagIndex].id,
      },
    });
  }
  console.log('创建示例需求:', requirements.length, '个');

  console.log('种子数据完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
