"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, Loader2, Globe, Map, FileText, Brain } from "lucide-react"

interface ScrapingProgressProps {
  progress: number // 0-100
  currentStep: 'homepage' | 'sitemap' | 'pages' | 'embeddings' | 'done'
}

const steps = [
  { id: 'homepage' as const, label: 'Scraping homepage', icon: Globe },
  { id: 'sitemap' as const, label: 'Finding key pages', icon: Map },
  { id: 'pages' as const, label: 'Analyzing content', icon: FileText },
  { id: 'embeddings' as const, label: 'Training AI', icon: Brain },
]

export function ScrapingProgress({ progress, currentStep }: ScrapingProgressProps) {
  return (
    <Card className="mt-6 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Analyzing your website...</h3>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {steps.map((step) => {
            const stepIndex = steps.findIndex(s => s.id === step.id)
            const currentIndex = steps.findIndex(s => s.id === currentStep)
            const isCompleted = stepIndex < currentIndex || currentStep === 'done'
            const isActive = step.id === currentStep

            return (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {isActive && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                )}
                {isCompleted && (
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                {!isActive && !isCompleted && (
                  <step.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={isActive ? 'font-medium' : 'text-muted-foreground'}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
