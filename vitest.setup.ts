import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

;(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || ResizeObserverMock

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {}
}

afterEach(() => cleanup())

