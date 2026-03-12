import { useFormStore } from '@/stores/formStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Settings } from 'lucide-react';
import { generateId } from '@/lib/utils';

export default function FieldSettings() {
  const { fields, selectedFieldId, updateField } = useFormStore();
  const field = fields.find((f) => f.id === selectedFieldId);

  if (!field) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Field Settings
      </h3>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="field-label" className="text-xs">Label</Label>
        <Input
          id="field-label"
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      {/* Placeholder */}
      {!hasOptions && field.type !== 'file' && field.type !== 'date' && (
        <div className="space-y-2">
          <Label htmlFor="field-placeholder" className="text-xs">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ''}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
      )}

      {/* Help Text */}
      <div className="space-y-2">
        <Label htmlFor="field-help" className="text-xs">Help Text</Label>
        <Textarea
          id="field-help"
          value={field.helpText || ''}
          onChange={(e) => updateField(field.id, { helpText: e.target.value })}
          className="text-sm min-h-[60px]"
          placeholder="Additional instructions for the user..."
        />
      </div>

      {/* AI Conditional Logic Hint */}
      <div className="space-y-2 pt-2 border-t mt-4 border-dashed border-gray-700/50">
        <div className="flex items-center gap-2">
          <Label htmlFor="field-hint" className="text-xs font-semibold text-blue-400">AI Conditional Logic</Label>
        </div>
        <Textarea
          id="field-hint"
          value={field.hint || ''}
          onChange={(e) => updateField(field.id, { hint: e.target.value })}
          className="text-sm min-h-[60px] bg-blue-500/5 border-blue-500/20 placeholder:text-blue-500/40"
          placeholder="e.g. 'Only ask if they said Yes to the previous question'"
        />
        <p className="text-[10px] text-muted-foreground leading-tight">
          FormMorph's AI will evaluate this rule against previous answers to decide if this question should be asked.
        </p>
      </div>

      {/* Required toggle */}
      <div className="flex items-center justify-between py-2">
        <Label htmlFor="field-required" className="text-xs">Required</Label>
        <Switch
          id="field-required"
          checked={field.required}
          onCheckedChange={(checked) => updateField(field.id, { required: checked })}
        />
      </div>

      {/* Options for dropdown/radio/checkbox */}
      {hasOptions && field.options && (
        <div className="space-y-3">
          <Label className="text-xs">Options</Label>
          <div className="space-y-2">
            {field.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2 mb-2">
                <Input
                  value={opt.label}
                  onChange={(e) => {
                    const newOptions = [...field.options!];
                    newOptions[idx] = {
                      ...opt,
                      label: e.target.value,
                      value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    };
                    updateField(field.id, { options: newOptions });
                  }}
                  className="h-8 text-sm flex-1"
                  placeholder={`Option ${idx + 1}`}
                />
                {field.options!.length > 1 && (
                  <button
                    onClick={() => {
                      const newOptions = field.options!.filter((_, i) => i !== idx);
                      updateField(field.id, { options: newOptions });
                    }}
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              const newOptions = [
                ...field.options!,
                {
                  id: generateId(),
                  label: `Option ${field.options!.length + 1}`,
                  value: `option_${field.options!.length + 1}`,
                },
              ];
              updateField(field.id, { options: newOptions });
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
          </Button>
        </div>
      )}

      {/* Number validation */}
      {field.type === 'number' && (
        <div className="space-y-3">
          <Label className="text-xs">Validation</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="field-min" className="text-xs text-muted-foreground">Min</Label>
              <Input
                id="field-min"
                type="number"
                value={field.validation?.min ?? ''}
                onChange={(e) =>
                  updateField(field.id, {
                    validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-max" className="text-xs text-muted-foreground">Max</Label>
              <Input
                id="field-max"
                type="number"
                value={field.validation?.max ?? ''}
                onChange={(e) =>
                  updateField(field.id, {
                    validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
