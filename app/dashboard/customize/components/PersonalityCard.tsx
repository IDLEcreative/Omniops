import { Card, CardContent } from "@/components/ui/card";
import { Check, Briefcase, Users, Zap } from "lucide-react";

interface PersonalityCardProps {
  value: 'professional' | 'friendly' | 'concise';
  selected: boolean;
  onClick: () => void;
}

const personalityData = {
  professional: {
    icon: Briefcase,
    title: "Professional",
    description: "Formal and business-oriented",
    example: "Thank you for your inquiry. I'd be happy to provide detailed information about our offerings.",
  },
  friendly: {
    icon: Users,
    title: "Friendly",
    description: "Warm and conversational",
    example: "Hey there! Great question! I'd love to help you find exactly what you're looking for.",
  },
  concise: {
    icon: Zap,
    title: "Concise",
    description: "Quick and to-the-point",
    example: "I can help with that. What specific information do you need?",
  },
};

export function PersonalityCard({ value, selected, onClick }: PersonalityCardProps) {
  const data = personalityData[value];
  const Icon = data.icon;

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200
        hover:shadow-md
        ${selected ? 'border-primary border-2 shadow-md' : 'border-gray-200'}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${selected ? 'bg-primary/10' : 'bg-gray-100'}`}>
              <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-gray-600'}`} />
            </div>
            <h3 className="font-semibold text-lg">{data.title}</h3>
          </div>
          {selected && (
            <div className="bg-primary text-white rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{data.description}</p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-600 italic">&quot;{data.example}&quot;</p>
        </div>
      </CardContent>
    </Card>
  );
}
