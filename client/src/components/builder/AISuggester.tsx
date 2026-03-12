import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFormStore } from '@/stores/formStore';
import api from '@/lib/api';
import { Lightbulb, Loader2 } from 'lucide-react';

export default function AISuggester() {
  const [loading, setLoading] = useState(false);
  const { fields, addField, updateField } = useFormStore();

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/suggest-field', { existingFields: fields });
      const suggestedField = res.data.field;

      // Add the suggested field
      addField(suggestedField.type);

      // Get the last added field and update with AI suggestions
      const store = useFormStore.getState();
      const lastField = store.fields[store.fields.length - 1];
      if (lastField) {
        updateField(lastField.id, {
          label: suggestedField.label,
          placeholder: suggestedField.placeholder || '',
          helpText: suggestedField.helpText || '',
          required: suggestedField.required || false,
          options: suggestedField.options,
        });
      }
    } catch (err) {
      console.error('AI suggest failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSuggest}
      disabled={loading}
      className="gap-2 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
      title="AI Suggest Next Field"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Lightbulb className="h-4 w-4" />
      )}
      Suggest
    </Button>
  );
}
