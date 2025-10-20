"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeDebugger() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading theme...</div>
  }

  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">Theme Debug Info</h3>
      <div className="space-y-1 text-sm">
        <p><strong>Current theme:</strong> {theme}</p>
        <p><strong>Resolved theme:</strong> {resolvedTheme}</p>
        <p><strong>System theme:</strong> {systemTheme}</p>
        <p><strong>HTML class:</strong> {document.documentElement.className}</p>
        <p><strong>LocalStorage:</strong> {localStorage.getItem('theme') || 'not set'}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
        >
          System
        </button>
      </div>
    </div>
  )
}
