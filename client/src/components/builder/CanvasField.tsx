import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/types';
import { useFormStore } from '@/stores/formStore';
import { cn } from '@/lib/utils';
import {
  GripVertical, Trash2, Type, AlignLeft, ChevronDown,
  CircleDot, CheckSquare, Calendar, Mail, Hash, Upload
} from 'lucide-react';

const fieldIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: AlignLeft,
  dropdown: ChevronDown,
  radio: CircleDot,
  checkbox: CheckSquare,
  date: Calendar,
  email: Mail,
  number: Hash,
  file: Upload,
};

interface CanvasFieldProps {
  field: FormField;
}

export default function CanvasField({ field }: CanvasFieldProps) {
  const { selectedFieldId, selectField, removeField } = useFormStore();
  const isSelected = selectedFieldId === field.id;
  const Icon = fieldIcons[field.type] || Type;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={cn(
        "group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border hover:border-primary/30 bg-card hover:bg-card/80",
        isDragging && "opacity-50 shadow-2xl scale-[1.02]"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 p-1 rounded hover:bg-secondary cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Field Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-primary/70" />
          <span className="font-medium text-sm truncate">{field.label}</span>
          {field.required && (
            <span className="text-destructive text-xs">*</span>
          )}
        </div>

        {/* Preview */}
        <div className="mt-2">
          {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
            <div className="h-9 rounded-md border border-input bg-background/50 px-3 flex items-center">
              <span className="text-xs text-muted-foreground">{field.placeholder || 'Enter value...'}</span>
            </div>
          )}
          {field.type === 'textarea' && (
            <div className="h-16 rounded-md border border-input bg-background/50 px-3 pt-2">
              <span className="text-xs text-muted-foreground">{field.placeholder || 'Enter text...'}</span>
            </div>
          )}
          {field.type === 'dropdown' && (
            <div className="h-9 rounded-md border border-input bg-background/50 px-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Select option...</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          {field.type === 'radio' && field.options && (
            <div className="space-y-1.5">
              {field.options.slice(0, 3).map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full border border-input" />
                  <span className="text-xs text-muted-foreground">{opt.label}</span>
                </div>
              ))}
              {field.options.length > 3 && (
                <span className="text-xs text-muted-foreground">+{field.options.length - 3} more</span>
              )}
            </div>
          )}
          {field.type === 'checkbox' && field.options && (
            <div className="space-y-1.5">
              {field.options.slice(0, 3).map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-sm border border-input" />
                  <span className="text-xs text-muted-foreground">{opt.label}</span>
                </div>
              ))}
              {field.options.length > 3 && (
                <span className="text-xs text-muted-foreground">+{field.options.length - 3} more</span>
              )}
            </div>
          )}
          {field.type === 'date' && (
            <div className="h-9 rounded-md border border-input bg-background/50 px-3 flex items-center">
              <span className="text-xs text-muted-foreground">mm/dd/yyyy</span>
            </div>
          )}
          {field.type === 'file' && (
            <div className="h-16 rounded-md border-2 border-dashed border-input bg-background/50 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Drop file or click to upload</span>
            </div>
          )}
        </div>

        {field.helpText && (
          <p className="text-xs text-muted-foreground mt-1.5">{field.helpText}</p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
