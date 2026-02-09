import { prisma } from './prisma';

/**
 * 软删除资源类型
 */
export type SoftDeleteResource = 'workspace' | 'requirement';

/**
 * 软删除操作结果
 */
export interface SoftDeleteResult {
  success: boolean;
  resourceId: string;
  resourceType: SoftDeleteResource;
  error?: string;
}

/**
 * 软删除工作空间
 */
export async function softDeleteWorkspace(workspaceId: string): Promise<SoftDeleteResult> {
  try {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    return { success: true, resourceId: workspace.id, resourceType: 'workspace' };
  } catch (error) {
    console.error('Error soft deleting workspace:', error);
    return {
      success: false,
      resourceId: workspaceId,
      resourceType: 'workspace',
      error: 'Failed to delete workspace',
    };
  }
}

/**
 * 软删除需求
 */
export async function softDeleteRequirement(requirementId: string): Promise<SoftDeleteResult> {
  try {
    const requirement = await prisma.requirement.update({
      where: { id: requirementId },
      data: { deletedAt: new Date() },
    });

    return { success: true, resourceId: requirement.id, resourceType: 'requirement' };
  } catch (error) {
    console.error('Error soft deleting requirement:', error);
    return {
      success: false,
      resourceId: requirementId,
      resourceType: 'requirement',
      error: 'Failed to delete requirement',
    };
  }
}

/**
 * 恢复软删除的工作空间
 */
export async function restoreWorkspace(workspaceId: string): Promise<SoftDeleteResult> {
  try {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: null },
    });

    return { success: true, resourceId: workspace.id, resourceType: 'workspace' };
  } catch (error) {
    console.error('Error restoring workspace:', error);
    return {
      success: false,
      resourceId: workspaceId,
      resourceType: 'workspace',
      error: 'Failed to restore workspace',
    };
  }
}

/**
 * 恢复软删除的需求
 */
export async function restoreRequirement(requirementId: string): Promise<SoftDeleteResult> {
  try {
    const requirement = await prisma.requirement.update({
      where: { id: requirementId },
      data: { deletedAt: null },
    });

    return { success: true, resourceId: requirement.id, resourceType: 'requirement' };
  } catch (error) {
    console.error('Error restoring requirement:', error);
    return {
      success: false,
      resourceId: requirementId,
      resourceType: 'requirement',
      error: 'Failed to restore requirement',
    };
  }
}
