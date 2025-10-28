"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please copy manually";
      toast({
        title: "Failed to copy",
        description: errorMessage,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 px-2"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre
        className="bg-[#1e1e1e] text-gray-100 p-4 pr-12 rounded-lg overflow-x-auto text-xs leading-relaxed"
        data-language={language}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
