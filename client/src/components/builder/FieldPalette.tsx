import {
  Type, AlignLeft, ChevronDown, CircleDot, CheckSquare,
  Calendar, Mail, Hash, Upload
} from 'lucide-react';
import { FieldType } from '@/types';
import { useFormStore } from '@/stores/formStore';
import { cn } from '@/lib/utils';

interface FieldTypeItem {
  type: FieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const fieldTypes: FieldTypeItem[] = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'radio', label: 'Multiple Choice', icon: CircleDot },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { type: 'date', label: 'Date Picker', icon: Calendar },
  { type: 'file', label: 'File Upload', icon: Upload },
];

export default function FieldPalette() {
  const { addField } = useFormStore();

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        Field Types
      </h3>
      {fieldTypes.map((item) => (
        <button
          key={item.type}
          onClick={() => addField(item.type)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium",
            "hover:bg-primary/10 hover:text-primary",
            "transition-all duration-200 group cursor-grab active:cursor-grabbing",
            "border border-transparent hover:border-primary/20"
          )}
        >
          <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
