"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Timer, Send, Loader2, User, Bot } from "lucide-react"

interface DemoSession {
  id: string
  domain: string
  pages_scraped: number
  expires_at: number
  message_count: number
  max_messages: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface DemoChatInterfaceProps {
  session: DemoSession
  onSendMessage: (message: string) => Promise<string>
}

const suggestedQuestions = [
  "What services do you offer?",
  "Tell me about your company",
  "How can I contact you?"
]

export function DemoChatInterface({ session, onSendMessage }: DemoChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [timeRemaining, setTimeRemaining] = useState('10:00')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = session.expires_at - Date.now()
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [session.expires_at])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Performance: Memoized to prevent recreation on every render
  // and maintain stable reference for form submission and button clicks
  const handleSubmit = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading || messages.length >= session.max_messages) {
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await onSendMessage(messageText)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Failed to get response. Please try again.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages.length, session.max_messages, onSendMessage])

  return (
    <Card className="mt-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Chat with YOUR AI Agent
            </CardTitle>
            <CardDescription className="mt-1">
              Trained on {session.pages_scraped} pages from {session.domain}
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">
            <Timer className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px] pr-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map(q => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubmit(q)}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(input)
          }}
          className="flex w-full gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your website..."
            disabled={isLoading || messages.length >= session.max_messages}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || messages.length >= session.max_messages}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {messages.length >= session.max_messages ? (
          <p className="text-xs text-muted-foreground text-center w-full">
            Demo message limit reached. Ready to get started for real?
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center w-full">
            {session.max_messages - messages.length} messages remaining
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
