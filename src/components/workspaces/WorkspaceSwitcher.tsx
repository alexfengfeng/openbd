"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { FolderOpen, Search, Clock, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useWorkspaceStore } from "@/stores/workspaceStore"

function replaceWorkspaceId(pathname: string, nextWorkspaceId: string) {
  if (!pathname.includes("/workspaces/")) {
    return `/workspaces/${nextWorkspaceId}/requirements`
  }
  return pathname.replace(/\/workspaces\/[^/]+/, `/workspaces/${nextWorkspaceId}`)
}

export function WorkspaceSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const {
    workspaces,
    currentWorkspace,
    setWorkspaces,
    setCurrentWorkspace,
    getRecentWorkspaces,
    switchWorkspace,
  } = useWorkspaceStore()

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces")
        if (!response.ok) return

        const data = await response.json()
        const list = Array.isArray(data.workspaces) ? data.workspaces : []
        setWorkspaces(list)

        const match = pathname.match(/\/workspaces\/([^/]+)/)
        const workspaceIdInPath = match?.[1]
        if (workspaceIdInPath) {
          const found = list.find((w: any) => w.id === workspaceIdInPath)
          if (found) setCurrentWorkspace(found)
          return
        }

        if (currentWorkspace && list.some((w: any) => w.id === currentWorkspace.id)) {
          setCurrentWorkspace(currentWorkspace)
          return
        }

        if (list.length > 0) {
          setCurrentWorkspace(list[0])
        }
      } catch {
        return
      }
    }

    fetchWorkspaces()
  }, [pathname, setCurrentWorkspace, setWorkspaces])

  const recent = getRecentWorkspaces()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return workspaces
    return workspaces.filter((w) => w.name.toLowerCase().includes(q))
  }, [search, workspaces])

  const handleSwitch = async (workspaceId: string) => {
    await switchWorkspace(workspaceId)
    router.push(replaceWorkspaceId(pathname, workspaceId))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-3 h-auto py-2 text-ui-on-dark hover:bg-ui-hover"
        >
          <FolderOpen className="h-4 w-4 shrink-0 text-ui-on-dark/65" />
          <span className="truncate text-sm">
            {currentWorkspace?.name || "选择工作空间"}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <Input
              placeholder="搜索工作空间..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {!search && recent.length > 0 && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium opacity-65">
              <Clock className="h-3 w-3" />
              最近使用
            </div>
            {recent.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSwitch(workspace.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm",
                  "hover:bg-accent transition-colors",
                  currentWorkspace?.id === workspace.id && "bg-accent"
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">{workspace.name}</span>
                <span className="text-xs opacity-50">
                  {workspace._count?.requirements ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="px-3 py-2 border-t">
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSwitch(workspace.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm",
                  "hover:bg-accent transition-colors",
                  currentWorkspace?.id === workspace.id && "bg-accent"
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">{workspace.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t">
          <button
            onClick={() => {
              setOpen(false)
              router.push("/workspaces/new")
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            新建工作空间
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

