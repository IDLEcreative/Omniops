import { Label } from "@/components/ui/label";

interface PositionPickerProps {
  value: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onChange: (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => void;
}

export function PositionPicker({ value, onChange }: PositionPickerProps) {
  const positions = [
    { value: 'top-left', label: 'Top Left', row: 0, col: 0 },
    { value: 'top-right', label: 'Top Right', row: 0, col: 1 },
    { value: 'bottom-left', label: 'Bottom Left', row: 1, col: 0 },
    { value: 'bottom-right', label: 'Bottom Right', row: 1, col: 1 },
  ];

  return (
    <div className="space-y-3">
      <Label>Widget Position</Label>
      <div className="grid grid-cols-2 gap-3">
        {positions.map((pos) => (
          <button
            key={pos.value}
            onClick={() => onChange(pos.value as any)}
            className={`
              relative h-24 rounded-lg border-2 transition-all
              hover:border-primary/50 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${value === pos.value ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200'}
            `}
            aria-label={`Position widget at ${pos.label}`}
          >
            {/* Mini preview of position */}
            <div className="absolute inset-0 p-2">
              <div className="relative w-full h-full bg-gray-50 rounded border border-gray-200">
                <div
                  className={`
                    absolute w-3 h-3 rounded-full
                    ${value === pos.value ? 'bg-primary' : 'bg-gray-400'}
                    ${pos.row === 0 ? 'top-1' : 'bottom-1'}
                    ${pos.col === 0 ? 'left-1' : 'right-1'}
                  `}
                />
              </div>
            </div>
            <span className="absolute bottom-1 left-0 right-0 text-xs font-medium text-center">
              {pos.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
