import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { FormField } from '@/types';
import confetti from 'canvas-confetti';
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface FormPageProps {
  id?: string;
  shareToken?: string;
  initialData?: any;
  onBack?: () => void;
}

export default function FormPage({ id: propId, shareToken, initialData, onBack }: FormPageProps = {}) {
  const { id: paramsId } = useParams();
  const id = propId || paramsId;
  
  const [form, setForm] = useState<{
    id: string;
    title: string;
    description?: string;
    schema: FormField[];
    published: boolean;
  } | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) return;

    if (id) {
      api.get(`/forms/${id}`)
        .then((res) => {
          if (!res.data.published) {
            setError('This form is not published yet.');
          } else {
            setForm(res.data);
          }
        })
        .catch(() => setError('Form not found'))
        .finally(() => setLoading(false));
    } else if (shareToken) {
      api.get(`/forms/by-token/${shareToken}`)
        .then((res) => {
          setForm(res.data);
        })
        .catch(() => setError('Form not found'))
        .finally(() => setLoading(false));
    }
  }, [id, shareToken, initialData]);

  const setValue = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};

    form.schema.forEach((field) => {
      const val = values[field.id];

      if (field.required) {
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
          newErrors[field.id] = 'This field is required';
          return;
        }
      }

      if (val && field.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          newErrors[field.id] = 'Please enter a valid email';
        }
      }

      if (val && field.type === 'number' && field.validation) {
        const num = Number(val);
        if (field.validation.min !== undefined && num < field.validation.min) {
          newErrors[field.id] = `Minimum value is ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && num > field.validation.max) {
          newErrors[field.id] = `Maximum value is ${field.validation.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (id) {
        await api.post(`/responses/${id}`, { data: values });
      } else if (shareToken) {
        await api.post(`/responses/by-token/${shareToken}`, { data: values });
      } else {
        throw new Error('No form identifier available');
      }
      
      setSubmitted(true);

      // 🎉 Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#a855f7', '#c084fc', '#e879f9', '#f0abfc'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#7c3aed', '#a855f7', '#c084fc'],
        });
      }, 250);
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#e879f9', '#f0abfc', '#c084fc'],
        });
      }, 400);
    } catch (err) {
      setError('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Oops!</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <div className="text-center glass rounded-2xl p-10 max-w-md mx-4">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
          <p className="text-muted-foreground mb-8">Your response has been submitted successfully.</p>
          
          {onBack && (
            <Button 
              onClick={onBack}
              className="w-full py-6 rounded-xl bg-white text-black hover:bg-gray-100 font-semibold mb-6"
            >
              Fill Again / Change Mode
            </Button>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            Powered by FormForge
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen animated-gradient py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-8 mb-6">
          <h1 className="text-2xl font-bold mb-1">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.schema.map((field) => (
            <div key={field.id} className="glass rounded-xl p-6 space-y-2">
              <label className="text-sm font-medium block">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>

              {field.type === 'text' && (
                <Input
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'email' && (
                <Input
                  type="email"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  min={field.validation?.min}
                  max={field.validation?.max}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'date' && (
                <Input
                  type="date"
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'dropdown' && (
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {field.type === 'radio' && (
                <div className="space-y-2">
                  {field.options?.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name={field.id}
                        value={opt.value}
                        checked={values[field.id] === opt.value}
                        onChange={() => setValue(field.id, opt.value)}
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'checkbox' && (
                <div className="space-y-2">
                  {field.options?.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={(values[field.id] || []).includes(opt.value)}
                        onChange={(e) => {
                          const current = values[field.id] || [];
                          if (e.target.checked) {
                            setValue(field.id, [...current, opt.value]);
                          } else {
                            setValue(field.id, current.filter((v: string) => v !== opt.value));
                          }
                        }}
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'file' && (
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setValue(field.id, file.name);
                  }}
                />
              )}

              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}

              {errors[field.id] && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors[field.id]}
                </p>
              )}
            </div>
          ))}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              'Submit'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 text-primary" /> Powered by FormForge
          </p>
        </form>
      </div>
    </div>
  );
}
