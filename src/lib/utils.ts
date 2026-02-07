import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

// 生成工作空间 slug
export function generateSlug(name: string): string {
  const timestamp = Date.now().toString(36);
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${timestamp}`.slice(0, 50);
}

// 格式化日期
export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 格式化日期时间
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 获取优先级颜色
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    URGENT: 'text-red-600 bg-red-50 border-red-200',
    HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
    MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    LOW: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[priority] || colors.MEDIUM;
}

// 获取状态颜色
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DONE: 'text-green-600 bg-green-50 border-green-200',
    IN_PROGRESS: 'text-blue-600 bg-blue-50 border-blue-200',
    TODO: 'text-purple-600 bg-purple-50 border-purple-200',
    BACKLOG: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[status] || colors.BACKLOG;
}

// 获取优先级标签
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    URGENT: '紧急',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return labels[priority] || priority;
}

// 获取状态标签
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DONE: '已完成',
    IN_PROGRESS: '进行中',
    TODO: '待处理',
    BACKLOG: '待办',
  };
  return labels[status] || status;
}
