import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"

import { VoiceInput } from "./VoiceInput"

describe("VoiceInput", () => {
  beforeEach(() => {
    ;(window as any).SpeechRecognition = undefined
    ;(window as any).webkitSpeechRecognition = undefined
  })

  it("renders nothing when unsupported", () => {
    const { container } = render(<VoiceInput onText={() => undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it("emits text when supported", () => {
    let instance: any
    class MockRecognition {
      continuous = false
      interimResults = false
      lang = ""
      onresult: any
      onend: any
      constructor() {
        instance = this
      }
      start() {}
      stop() {
        if (this.onend) this.onend()
      }
    }
    ;(window as any).webkitSpeechRecognition = MockRecognition

    const onText = vi.fn()
    const { getByRole } = render(<VoiceInput onText={onText} />)
    fireEvent.click(getByRole("button"))

    instance.onresult({
      results: [[{ transcript: "你好" }]],
    })
    expect(onText).toHaveBeenCalledWith("你好")
  })
})

