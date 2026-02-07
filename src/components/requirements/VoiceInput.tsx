"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"

import { Button } from "@/components/ui/button"

type SpeechRecognitionType = typeof window extends any
  ? any
  : any

export function VoiceInput(props: { onText: (text: string) => void }) {
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)

  const Recognition = useMemo(() => {
    if (typeof window === "undefined") return null
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
  }, [])

  useEffect(() => {
    if (!Recognition) {
      setSupported(false)
      return
    }
    setSupported(true)
    const rec = new Recognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "zh-CN"

    rec.onresult = (event: any) => {
      const results = Array.from(event.results || [])
      const text = results.map((r: any) => r?.[0]?.transcript || "").join("")
      if (text.trim()) props.onText(text.trim())
    }

    rec.onend = () => {
      setListening(false)
    }

    recognitionRef.current = rec
  }, [Recognition, props])

  if (!supported) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const rec = recognitionRef.current
        if (!rec) return
        if (listening) {
          rec.stop()
          setListening(false)
        } else {
          rec.start()
          setListening(true)
        }
      }}
    >
      {listening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
      {listening ? "停止语音" : "语音输入"}
    </Button>
  )
}

