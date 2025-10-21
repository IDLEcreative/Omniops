import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Bot, Send, X, MessageSquare } from "lucide-react";
import type { WidgetConfig } from "../enhanced-page";

interface LivePreviewProps {
  config: WidgetConfig;
}

export function LivePreview({ config }: LivePreviewProps) {
  const getPositionClass = () => {
    const base = "absolute";
    switch (config.positionSettings.position) {
      case 'bottom-right':
        return `${base} bottom-6 right-6`;
      case 'bottom-left':
        return `${base} bottom-6 left-6`;
      case 'top-right':
        return `${base} top-6 right-6`;
      case 'top-left':
        return `${base} top-6 left-6`;
      default:
        return `${base} bottom-6 right-6`;
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
          See how your widget will appear to users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gray-100 rounded-lg h-[600px] overflow-hidden">
          {/* Mock browser */}
          <div className="bg-gray-200 p-2 rounded-t-lg">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* Mock website content */}
          <div className="p-4 space-y-2 h-full bg-white relative">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>

            {/* Widget Preview */}
            <div className={getPositionClass()}>
              <div className="flex flex-col space-y-2">
                {/* Chat Window */}
                <div
                  className="w-80 h-96 rounded-lg shadow-lg flex flex-col"
                  style={{
                    backgroundColor: config.themeSettings.backgroundColor,
                    borderRadius: `${config.themeSettings.borderRadius}px`,
                    fontSize: `${config.themeSettings.fontSize}px`,
                    color: config.themeSettings.textColor,
                  }}
                >
                  {/* Header */}
                  <div
                    className="p-3 rounded-t-lg flex items-center justify-between"
                    style={{
                      backgroundColor: config.themeSettings.primaryColor,
                      borderTopLeftRadius: `${config.themeSettings.borderRadius}px`,
                      borderTopRightRadius: `${config.themeSettings.borderRadius}px`,
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      {config.behaviorSettings.showAvatar && (
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <span className="text-white font-medium">
                        {config.behaviorSettings.botName}
                      </span>
                    </div>
                    <X className="h-4 w-4 text-white cursor-pointer" />
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    <div className="flex items-start space-x-2">
                      {config.behaviorSettings.showAvatar && (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                          <Bot className="h-3 w-3 text-gray-500" />
                        </div>
                      )}
                      <div
                        className="rounded-lg px-3 py-2 max-w-xs"
                        style={{
                          backgroundColor: `${config.themeSettings.primaryColor}10`,
                          color: config.themeSettings.textColor,
                        }}
                      >
                        {config.behaviorSettings.welcomeMessage}
                      </div>
                    </div>

                    {config.behaviorSettings.showTypingIndicator && (
                      <div className="flex items-start space-x-2">
                        {config.behaviorSettings.showAvatar && (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                        )}
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={config.behaviorSettings.placeholderText}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
                        style={{
                          borderRadius: `${Math.max(4, parseInt(config.themeSettings.borderRadius) - 2)}px`,
                          fontSize: `${config.themeSettings.fontSize}px`,
                        }}
                      />
                      <button
                        className="p-2 rounded-md text-white"
                        style={{
                          backgroundColor: config.themeSettings.primaryColor,
                          borderRadius: `${Math.max(4, parseInt(config.themeSettings.borderRadius) - 2)}px`,
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Branding */}
                  {config.brandingSettings?.showPoweredBy && (
                    <div className="px-3 pb-2">
                      <p className="text-xs text-gray-500 text-center">
                        {config.brandingSettings.customBrandingText || "Powered by AI Assistant"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Chat Button */}
                <button
                  className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: config.themeSettings.primaryColor }}
                >
                  <MessageSquare className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}