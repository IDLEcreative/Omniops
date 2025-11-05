import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sparkles, MessageSquare } from "lucide-react";
import { AnimationStyles } from "./AnimationStyles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnimationCardProps {
  animationType: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
  animationSpeed: 'slow' | 'normal' | 'fast';
  animationIntensity: 'subtle' | 'normal' | 'strong';
  buttonGradientStart?: string;
  buttonGradientEnd?: string;
  onChange: (updates: {
    animationType?: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
    animationSpeed?: 'slow' | 'normal' | 'fast';
    animationIntensity?: 'subtle' | 'normal' | 'strong';
  }) => void;
}

export function AnimationCard({
  animationType,
  animationSpeed,
  animationIntensity,
  buttonGradientStart = '#3a3a3a',
  buttonGradientEnd = '#2a2a2a',
  onChange
}: AnimationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          Widget Icon Animation
        </CardTitle>
        <CardDescription>
          Add eye-catching animations to your minimized widget icon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="animationType">Animation Type</Label>
          <Select
            value={animationType}
            onValueChange={(value: any) => onChange({ animationType: value })}
          >
            <SelectTrigger id="animationType">
              <SelectValue placeholder="Select animation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="pulse">Pulse - Subtle scale and fade effect</SelectItem>
              <SelectItem value="bounce">Bounce - Vertical bouncing motion</SelectItem>
              <SelectItem value="rotate">Rotate - Continuous rotation</SelectItem>
              <SelectItem value="fade">Fade - Opacity pulsing effect</SelectItem>
              <SelectItem value="wiggle">Wiggle - Gentle side-to-side rotation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {animationType !== 'none' && (
          <>
            <div className="space-y-3">
              <Label>Animation Speed</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onChange({ animationSpeed: speed })}
                    className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      animationSpeed === speed
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {speed === 'slow' ? '4s' : speed === 'fast' ? '1s' : '2s'}
                    <br />
                    <span className="text-xs opacity-70 capitalize">{speed}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Animation Intensity</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['subtle', 'normal', 'strong'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => onChange({ animationIntensity: intensity })}
                    className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      animationIntensity === intensity
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {intensity === 'subtle' ? '50%' : intensity === 'strong' ? '150%' : '100%'}
                    <br />
                    <span className="text-xs opacity-70 capitalize">{intensity}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50 flex flex-col items-center space-y-4">
              <Label className="text-sm font-medium">Live Preview</Label>
              <AnimationStyles
                animationType={animationType}
                animationSpeed={animationSpeed}
                animationIntensity={animationIntensity}
              />
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg widget-icon-animated"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${buttonGradientStart}, ${buttonGradientEnd})`,
                }}
              >
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Animation: {animationType} • Speed: {animationSpeed} • Intensity: {animationIntensity}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>♿ Accessibility:</strong> Animations automatically respect user&apos;s &quot;prefers-reduced-motion&quot; setting for better accessibility.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
