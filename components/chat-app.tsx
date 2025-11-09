"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  text: string
  sender: "me" | "bot"
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ children }) => (
          <code className="bg-opacity-20 bg-foreground px-1 rounded text-sm font-mono">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="bg-opacity-10 bg-foreground p-2 rounded mb-2 overflow-x-auto text-xs font-mono">
            {children}
          </pre>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ children, href }) => (
          <a href={href} className="underline text-primary hover:opacity-80" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  // const [threadId, setThreadId] = useState<string | null>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [threadId, setThreadId] = useState("")
  const [structuredOutput, setStructuredOutput] = useState<"null" | "PROFILE_LIST" | "PROFILE" | null>(null)
 

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message to list
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "me",
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Make API call to backend
      const response = await axios.post("http://localhost:8000/chat", {
        message: input,
        thread_id: threadId,
        output_format: structuredOutput,
      })
      
      setThreadId(response.data.thread_id)

      // Add bot response to list
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.answer,
        sender: "bot",
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error processing your message.",
        sender: "bot",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-4xl h-screen md:h-[800px]">
      <Card className="flex flex-col shadow-lg h-full">
        {/* Messages Container */}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-xl px-4 py-2 rounded-lg ${
                    message.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <div className="text-sm break-words prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownMessage content={message.text} />
                    </div>
                  ) : (
                    <p className="text-sm break-words">{message.text}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className="border-t p-4 flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} className="px-6">
            Send
          </Button>
        </div>
      </Card>
      <div className="absolute top-4 right-4 border p-2 rounded bg-background w-64">
      <div className="p-4 space-y-6 h-full flex flex-col">
          <h3 className="font-semibold text-foreground">Settings</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Thread Id</label>
              <Input
                type="text"
                placeholder="Enter thread ID..."
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Structured Output</label>
              <select
                value={structuredOutput ?? "null"}
                onChange={(e) => {
                  const val = e.target.value
                  setStructuredOutput(val === "null" ? null : (val as "PROFILE_LIST" | "PROFILE"))
                }}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              >
                <option value="null">None</option>
                <option value="PROFILE_LIST">PROFILE_LIST</option>
                <option value="PROFILE">PROFILE</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  )
}
