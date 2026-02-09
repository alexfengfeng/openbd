'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Plus, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 6;

export default function TagTemplatesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 新建模板对话框
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('');

  // 编辑模板对话框
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  // 删除确认对话框
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [workspaceId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tag-templates?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        setTotalPages(Math.ceil((data.templates?.length || 0) / PAGE_SIZE));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTemplateName.trim() || !newTemplatePrompt.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/tag-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: newTemplateName.trim(),
          prompt: newTemplatePrompt.trim(),
        }),
      });

      if (response.ok) {
        setNewTemplateName('');
        setNewTemplatePrompt('');
        setShowNewDialog(false);
        fetchTemplates();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || '创建失败');
      }
    } catch (error) {
      alert('创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditPrompt(template.prompt);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !editName.trim() || !editPrompt.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tag-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          prompt: editPrompt.trim(),
        }),
      });

      if (response.ok) {
        setEditingTemplate(null);
        setEditName('');
        setEditPrompt('');
        fetchTemplates();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || '更新失败');
      }
    } catch (error) {
      alert('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tag-templates/${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteId(null);
        fetchTemplates();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 分页数据
  const paginatedTemplates = templates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/workspaces/${workspaceId}/requirements`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI 标签模板管理</h1>
          <p className="text-muted-foreground mt-1">管理用于 AI 解析需求的标签模板</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>模板列表</CardTitle>
              <CardDescription>
                共 {templates.length} 个模板 · 当前第 {page} / {totalPages} 页
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewDialog(true)} disabled={submitting}>
              <Plus className="h-4 w-4 mr-2" />
              新建模板
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              暂无模板，点击上方按钮创建
            </div>
          ) : (
            <>
              {/* 卡片式网格布局 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col h-full space-y-3">
                        {/* 标题区 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{template.name}</h3>
                              <Badge variant="secondary" className="text-xs shrink-0">AI</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              创建于 {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>

                        {/* 提示词预览区 */}
                        <div className="flex-1 bg-muted/50 rounded-md p-3 min-h-[120px]">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 font-mono">
                            {template.prompt}
                          </p>
                        </div>

                        {/* 操作按钮区 */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(template)}
                            disabled={submitting}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(template.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || submitting}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一页
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9"
                        onClick={() => setPage(pageNum)}
                        disabled={submitting}
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || submitting}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 新建模板对话框 */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建标签模板</DialogTitle>
            <DialogDescription>
              创建一个新的 AI 标签识别模板
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模板名称 <span className="text-red-500">*</span></label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="例如：Bug 标签识别"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">AI 提示词模板 <span className="text-red-500">*</span></label>
              <Textarea
                value={newTemplatePrompt}
                onChange={(e) => setNewTemplatePrompt(e.target.value)}
                placeholder="输入 AI 提示词模板，例如：分析以下需求描述，判断是否与软件缺陷相关..."
                rows={10}
                disabled={submitting}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                提示词将帮助 AI 更准确地识别和分类需求标签
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewDialog(false);
                setNewTemplateName('');
                setNewTemplatePrompt('');
              }}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !newTemplateName.trim() || !newTemplatePrompt.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  创建模板
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑模板对话框 */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑标签模板</DialogTitle>
            <DialogDescription>
              修改 AI 标签识别模板的内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模板名称 <span className="text-red-500">*</span></label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例如：Bug 标签识别"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">AI 提示词模板 <span className="text-red-500">*</span></label>
              <Textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="输入 AI 提示词模板..."
                rows={10}
                disabled={submitting}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null);
                setEditName('');
                setEditPrompt('');
              }}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={submitting || !editName.trim() || !editPrompt.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存更改'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个标签模板吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
