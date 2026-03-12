import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFormStore } from '@/stores/formStore';
import api from '@/lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIGenerator() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loadSchema, setTitle } = useFormStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/generate-form', { prompt });
      loadSchema(res.data.schema);
      // Extract a title from the prompt
      const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      setTitle(title);
      setOpen(false);
      setPrompt('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate form. Make sure GEMINI_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Job application form for a software engineer',
    'Customer feedback survey for a restaurant',
    'Event registration form for a tech conference',
    'Student enrollment form for online courses',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Form Generator
          </DialogTitle>
          <DialogDescription>
            Describe the form you want and AI will generate it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="e.g., Create a job application form for a software engineer role with fields for personal info, experience, and skills..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />

          {/* Quick suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Form
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
