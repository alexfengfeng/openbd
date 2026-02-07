"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Command } from "cmdk"
import { FolderOpen, Plus } from "lucide-react"

import { useWorkspaceStore } from "@/stores/workspaceStore"

function replaceWorkspaceId(pathname: string, nextWorkspaceId: string) {
  if (!pathname.includes("/workspaces/")) {
    return `/workspaces/${nextWorkspaceId}/requirements`
  }
  return pathname.replace(/\/workspaces\/[^/]+/, `/workspaces/${nextWorkspaceId}`)
}

export function CommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return workspaces
    return workspaces.filter((w) => w.name.toLowerCase().includes(q))
  }, [search, workspaces])

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="命令面板">
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="搜索工作空间、操作..."
      />
      <Command.List>
        <Command.Empty>无结果</Command.Empty>

        {filtered.length > 0 && (
          <Command.Group heading="工作空间">
            {filtered.map((ws) => (
              <Command.Item
                key={ws.id}
                onSelect={async () => {
                  await switchWorkspace(ws.id)
                  router.push(replaceWorkspaceId(pathname, ws.id))
                  setOpen(false)
                }}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {ws.name}
                {ws.id === currentWorkspace?.id && (
                  <span className="ml-auto text-xs opacity-70">当前</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="快速操作">
          <Command.Item
            onSelect={() => {
              if (currentWorkspace?.id) {
                router.push(`/workspaces/${currentWorkspace.id}/requirements/new`)
              } else {
                router.push("/workspaces/new")
              }
              setOpen(false)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            创建需求
          </Command.Item>
          <Command.Item
            onSelect={() => {
              router.push("/workspaces/new")
              setOpen(false)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            创建工作空间
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

