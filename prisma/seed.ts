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

  // ========== 创建第二个工作空间 ==========
  const workspace2 = await prisma.workspace.upsert({
    where: { slug: 'product-team' },
    update: {},
    create: {
      name: '产品研发组',
      slug: 'product-team',
      ownerId: admin.id,
    },
  });
  console.log('创建工作空间:', workspace2.name);

  // 添加工作空间成员
  await prisma.workspaceMember.upsert({
    where: { id: 'admin-member-product' },
    update: {},
    create: {
      id: 'admin-member-product',
      workspaceId: workspace2.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });

  await prisma.workspaceMember.upsert({
    where: { id: 'test-member-product' },
    update: {},
    create: {
      id: 'test-member-product',
      workspaceId: workspace2.id,
      userId: testUser.id,
      role: 'MEMBER',
    },
  });

  // 创建标签
  const tags2 = await Promise.all([
    prisma.tag.upsert({
      where: { id: 'tag-p1-bug' },
      update: {},
      create: {
        id: 'tag-p1-bug',
        workspaceId: workspace2.id,
        name: 'Bug',
        color: '#EF4444',
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-p1-feature' },
      update: {},
      create: {
        id: 'tag-p1-feature',
        workspaceId: workspace2.id,
        name: '新功能',
        color: '#3B82F6',
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-p1-design' },
      update: {},
      create: {
        id: 'tag-p1-design',
        workspaceId: workspace2.id,
        name: '设计',
        color: '#8B5CF6',
      },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-p1-performance' },
      update: {},
      create: {
        id: 'tag-p1-performance',
        workspaceId: workspace2.id,
        name: '性能',
        color: '#EC4899',
      },
    }),
  ]);

  // 创建15条需求
  const requirements2 = [
    {
      title: '实现用户个人中心页面',
      description: '用户可以查看和编辑个人信息、修改密码、上传头像',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      assigneeId: admin.id,
    },
    {
      title: '添加消息通知系统',
      description: '实现站内消息通知，支持实时提醒和历史消息查看',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
    },
    {
      title: '优化搜索功能性能',
      description: '当前搜索在大数据量下响应慢，需要添加索引和优化查询',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      assigneeId: testUser.id,
    },
    {
      title: '支持Markdown编辑器',
      description: '需求描述支持Markdown格式编辑和预览',
      status: 'BACKLOG' as const,
      priority: 'MEDIUM' as const,
    },
    {
      title: '批量操作需求',
      description: '支持批量删除、批量修改状态、批量分配负责人',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
    },
    {
      title: '添加需求评论功能',
      description: '团队成员可以在需求下讨论和交流',
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
    },
    {
      title: '实现需求模板功能',
      description: '可以创建需求模板，快速创建标准化需求',
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
    },
    {
      title: '添加数据统计报表',
      description: '展示需求完成率、成员工作负载等统计图表',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      assigneeId: admin.id,
    },
    {
      title: '支持需求附件上传',
      description: '可以上传图片、文档等附件到需求中',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
    },
    {
      title: '实现需求依赖关系',
      description: '可以设置需求之间的前置依赖关系',
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
    },
    {
      title: '添加工作空间权限管理',
      description: '细化权限控制，支持自定义角色和权限',
      status: 'BACKLOG' as const,
      priority: 'HIGH' as const,
    },
    {
      title: '支持多语言国际化',
      description: '系统支持中英文切换',
      status: 'TODO' as const,
      priority: 'LOW' as const,
    },
    {
      title: '实现需求变更历史',
      description: '记录需求的修改历史，支持查看和回滚',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      assigneeId: testUser.id,
    },
    {
      title: '优化看板拖拽交互',
      description: '当前拖拽操作不够流畅，需要优化动画效果',
      status: 'TODO' as const,
      priority: 'LOW' as const,
    },
    {
      title: '添加邮件通知功能',
      description: '重要变更通过邮件通知相关成员',
      status: 'BACKLOG' as const,
      priority: 'MEDIUM' as const,
    },
  ];

  for (let i = 0; i < requirements2.length; i++) {
    const req = requirements2[i];
    const requirement = await prisma.requirement.create({
      data: {
        workspaceId: workspace2.id,
        ...req,
        order: i,
        createdById: admin.id,
      },
    });

    // 为需求随机添加1-2个标签
    const numTags = Math.floor(Math.random() * 2) + 1;
    const shuffledTags = [...tags2].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numTags; j++) {
      await prisma.requirementTag.create({
        data: {
          requirementId: requirement.id,
          tagId: shuffledTags[j].id,
        },
      });
    }
  }
  console.log('创建示例需求:', requirements2.length, '个');

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
