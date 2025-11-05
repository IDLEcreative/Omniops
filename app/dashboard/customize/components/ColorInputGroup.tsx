import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorInputGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultValue?: string;
}

export function ColorInputGroup({ label, value, onChange, defaultValue = '#000000' }: ColorInputGroupProps) {
  const colorValue = value || defaultValue;

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center space-x-2">
        <Input
          type="color"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-1 border cursor-pointer"
        />
        <Input
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
