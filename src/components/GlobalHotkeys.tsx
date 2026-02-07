"use client"

import { useHotkeys } from "react-hotkeys-hook"
import { usePathname, useRouter } from "next/navigation"

import { CommandPalette } from "@/components/command/CommandPalette"
import { useWorkspaceStore } from "@/stores/workspaceStore"

function replaceWorkspaceId(pathname: string, nextWorkspaceId: string) {
  if (!pathname.includes("/workspaces/")) {
    return `/workspaces/${nextWorkspaceId}/requirements`
  }
  return pathname.replace(/\/workspaces\/[^/]+/, `/workspaces/${nextWorkspaceId}`)
}

export function GlobalHotkeys() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentWorkspace, getRecentWorkspaces, switchWorkspace } = useWorkspaceStore()

  useHotkeys(
    "c",
    () => {
      if (currentWorkspace?.id) {
        router.push(`/workspaces/${currentWorkspace.id}/requirements/new`)
      } else {
        router.push("/workspaces/new")
      }
    },
    { preventDefault: true, enableOnFormTags: false }
  )

  useHotkeys(
    "/",
    (e) => {
      e.preventDefault()
      const el =
        (document.querySelector('input[placeholder="搜索需求..."]') as HTMLInputElement | null) ||
        (document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement | null)
      el?.focus()
    },
    { preventDefault: true, enableOnFormTags: false }
  )

  useHotkeys(
    "e",
    () => {
      const button = document.querySelector('[data-quick-edit-button="true"]') as HTMLButtonElement | null
      button?.click()
    },
    { preventDefault: true, enableOnFormTags: false }
  )

  const bindRecent = (index: number) => {
    return async () => {
      const recent = getRecentWorkspaces()
      const target = recent[index]
      if (!target) return
      await switchWorkspace(target.id)
      router.push(replaceWorkspaceId(pathname, target.id))
    }
  }

  useHotkeys("mod+1", bindRecent(0), { preventDefault: true, enableOnFormTags: false })
  useHotkeys("mod+2", bindRecent(1), { preventDefault: true, enableOnFormTags: false })
  useHotkeys("mod+3", bindRecent(2), { preventDefault: true, enableOnFormTags: false })
  useHotkeys("mod+4", bindRecent(3), { preventDefault: true, enableOnFormTags: false })

  return <CommandPalette />
}

