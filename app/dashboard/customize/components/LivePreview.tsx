import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Bot, Send, X, MessageSquare } from "lucide-react";
import type { SimplifiedWidgetConfig } from "../page";

interface LivePreviewProps {
  config: SimplifiedWidgetConfig;
}

export function LivePreview({ config }: LivePreviewProps) {
  const getPositionClass = () => {
    const base = "absolute";
    switch (config.essentials.position) {
      case 'bottom-right':
        return `${base} bottom-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'top-left':
        return `${base} top-4 left-4`;
      default:
        return `${base} bottom-4 right-4`;
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Live Preview
        </CardTitle>
        <CardDescription>
          Real-time widget preview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-[600px] overflow-hidden shadow-inner">
          {/* Mock browser chrome */}
          <div className="bg-gray-300 p-2 rounded-t-lg flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">
              yoursite.com
            </div>
          </div>

          {/* Mock website content */}
          <div className="p-6 space-y-3 h-full bg-white relative">
            {/* Fake content */}
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-24 bg-gray-100 rounded"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
            </div>

            {/* Widget Preview */}
            <div className={getPositionClass()}>
              <div className="flex flex-col space-y-2">
                {/* Chat Window */}
                <div
                  className="w-[320px] h-[450px] rounded-xl shadow-2xl flex flex-col overflow-hidden"
                  style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid ${config.essentials.primaryColor}20`,
                  }}
                >
                  {/* Header */}
                  <div
                    className="p-4 flex items-center justify-between"
                    style={{
                      backgroundColor: config.essentials.primaryColor,
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      {config.essentials.showAvatar && (
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div>
                        <span className="text-white font-semibold text-sm">
                          {config.essentials.botName}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-white/80 text-xs">Online</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-white/80 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/50">
                    {/* Welcome message */}
                    <div className="flex items-start space-x-2">
                      {config.essentials.showAvatar && (
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div
                        className="rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[240px] shadow-sm"
                        style={{
                          backgroundColor: `${config.essentials.primaryColor}15`,
                          color: '#1f2937',
                        }}
                      >
                        <p className="text-sm">
                          {config.essentials.welcomeMessage}
                        </p>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex justify-end">
                      <div
                        className="rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[240px] shadow-sm"
                        style={{
                          backgroundColor: config.essentials.primaryColor,
                          color: '#ffffff',
                        }}
                      >
                        <p className="text-sm">
                          What products do you offer?
                        </p>
                      </div>
                    </div>

                    {/* Bot response based on personality */}
                    <div className="flex items-start space-x-2">
                      {config.essentials.showAvatar && (
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div
                        className="rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[240px] shadow-sm"
                        style={{
                          backgroundColor: `${config.essentials.primaryColor}15`,
                          color: '#1f2937',
                        }}
                      >
                        <p className="text-sm">
                          {config.intelligence.personality === 'professional'
                            ? "Thank you for your inquiry. I'd be happy to provide information about our product catalog."
                            : config.intelligence.personality === 'friendly'
                            ? "Great question! 😊 I'd love to show you what we have!"
                            : "We have multiple categories. What interests you?"}
                        </p>
                      </div>
                    </div>

                    {/* Smart suggestions if enabled */}
                    {config.intelligence.enableSmartSuggestions && (
                      <div className="flex flex-wrap gap-2 pl-9">
                        <button
                          className="px-3 py-1.5 text-xs rounded-full border-2 hover:shadow-md transition-all"
                          style={{
                            borderColor: `${config.essentials.primaryColor}40`,
                            color: config.essentials.primaryColor,
                          }}
                        >
                          💡 Show bestsellers
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs rounded-full border-2 hover:shadow-md transition-all"
                          style={{
                            borderColor: `${config.essentials.primaryColor}40`,
                            color: config.essentials.primaryColor,
                          }}
                        >
                          💡 Contact us
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={config.essentials.placeholderText}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                        disabled
                      />
                      <button
                        className="p-2 rounded-lg text-white transition-all hover:shadow-md"
                        style={{
                          backgroundColor: config.essentials.primaryColor,
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Powered by AI
                    </p>
                  </div>
                </div>

                {/* Chat Button (minimized state) */}
                <button
                  className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                  style={{ backgroundColor: config.essentials.primaryColor }}
                >
                  <MessageSquare className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Quick Summary</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Personality:</span>
              <span className="font-medium capitalize">{config.intelligence.personality}</span>
            </div>
            <div className="flex justify-between">
              <span>Position:</span>
              <span className="font-medium">{config.essentials.position.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Smart Features:</span>
              <span className="font-medium">
                {config.intelligence.enableSmartSuggestions ? '✓' : '✗'} Suggestions
                {config.intelligence.enableWebSearch ? ', ✓ Web Search' : ''}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
