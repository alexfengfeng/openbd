"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AIDescriptionOptimizer } from "@/components/ai/AIDescriptionOptimizer"

export function QuickEditDialog(props: {
  requirement: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { title: string; description: string; status: string; priority: string }) => Promise<void>
  onAiTitle?: (description: string) => Promise<string>
  workspaceId?: string
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("BACKLOG")
  const [priority, setPriority] = useState("MEDIUM")
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (!props.requirement) return
    setTitle(props.requirement.title ?? "")
    setDescription(props.requirement.description ?? "")
    setStatus(props.requirement.status ?? "BACKLOG")
    setPriority(props.requirement.priority ?? "MEDIUM")
  }, [props.requirement])

  const handleSave = async () => {
    setSaving(true)
    try {
      await props.onSave({ title, description, status, priority })
      props.onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleAi = async () => {
    if (!props.onAiTitle) return
    if (!description.trim()) return
    setAiLoading(true)
    try {
      const next = await props.onAiTitle(description)
      if (next) setTitle(next)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>快速编辑需求</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">标题</label>
              {props.onAiTitle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAi}
                  disabled={aiLoading || !description.trim()}
                >
                  <Sparkles className="h-3 w-3" />
                  AI 优化
                </Button>
              )}
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="需求标题" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述..."
              rows={6}
            />
            {/* AI 描述优化器 */}
            {props.workspaceId && (
              <AIDescriptionOptimizer
                description={description}
                workspaceId={props.workspaceId}
                onOptimized={(optimized) => setDescription(optimized)}
                disabled={saving}
                buttonText="AI 优化描述"
                size="sm"
              />
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">待办</SelectItem>
                  <SelectItem value="TODO">待处理</SelectItem>
                  <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                  <SelectItem value="DONE">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">优先级</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">紧急</SelectItem>
                  <SelectItem value="HIGH">高</SelectItem>
                  <SelectItem value="MEDIUM">中</SelectItem>
                  <SelectItem value="LOW">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              保存更改
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

