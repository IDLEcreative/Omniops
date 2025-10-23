"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"

interface DemoUrlInputProps {
  url: string
  onChange: (url: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function DemoUrlInput({ url, onChange, onSubmit, isLoading }: DemoUrlInputProps) {
  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">See It In Action</h2>
        <p className="text-muted-foreground">
          Enter your website URL to instantly chat with an AI trained on YOUR content
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="example.com or https://example.com"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-12 text-base"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading && url.trim()) {
              e.preventDefault()
              onSubmit()
            }
          }}
        />
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isLoading || !url.trim()}
          className="h-12 px-8 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Try Instant Demo
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </>
  )
}
