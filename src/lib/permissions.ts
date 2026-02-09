import { prisma } from './prisma';
import { MemberRole } from '@prisma/client';

/**
 * 权限检查结果类型
 */
export type PermissionCheckResult =
  | { allowed: true; role: MemberRole }
  | { allowed: false; reason: 'not_member' | 'insufficient_role' };

/**
 * 工作空间权限配置
 */
export const WORKSPACE_PERMISSIONS = {
  DELETE: ['OWNER', 'ADMIN'] as const,
  EDIT: ['OWNER', 'ADMIN'] as const,
  VIEW: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const,
} as const;

/**
 * 需求权限配置
 */
export const REQUIREMENT_PERMISSIONS = {
  DELETE: ['OWNER', 'ADMIN'] as const, // ADMIN + 创建者（需要在运行时检查）
  EDIT: ['OWNER', 'ADMIN', 'MEMBER'] as const,
  VIEW: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const,
} as const;

/**
 * 检查用户在工作空间中的权限
 */
export async function checkWorkspacePermission(
  workspaceId: string,
  userId: string,
  requiredRoles: readonly MemberRole[]
): Promise<PermissionCheckResult> {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
    select: { role: true },
  });

  if (!member) {
    return { allowed: false, reason: 'not_member' };
  }

  if (!requiredRoles.includes(member.role)) {
    return { allowed: false, reason: 'insufficient_role' };
  }

  return { allowed: true, role: member.role };
}

/**
 * 检查用户是否有权限删除需求（ADMIN 或创建者）
 */
export async function checkRequirementDeletePermission(
  requirementId: string,
  userId: string
): Promise<PermissionCheckResult> {
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: { workspaceId: true, createdById: true },
  });

  if (!requirement) {
    return { allowed: false, reason: 'not_member' };
  }

  // 创建者可以删除自己的需求
  if (requirement.createdById === userId) {
    return { allowed: true, role: 'MEMBER' };
  }

  // 否则检查是否是 OWNER 或 ADMIN
  return checkWorkspacePermission(
    requirement.workspaceId,
    userId,
    REQUIREMENT_PERMISSIONS.DELETE
  );
}

/**
 * 检查用户是否是工作空间所有者
 */
export async function isWorkspaceOwner(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  return workspace?.ownerId === userId;
}
