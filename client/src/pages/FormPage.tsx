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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="text-center p-12 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl max-w-sm">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">System Error</h2>
          <p className="text-slate-400 font-medium leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="text-center bg-slate-900/40 backdrop-blur-[50px] rounded-[3rem] p-12 max-w-md mx-4 border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative z-10">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20 rotate-3 transform transition-transform hover:rotate-0 transition-500">
            <CheckCircle2 className="h-10 w-10 text-slate-950" />
          </div>
          <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Mission Complete</h2>
          <p className="text-slate-400 font-medium text-lg mb-10 leading-relaxed">Your data has been successfully archived into our engine.</p>
          
          {onBack && (
            <Button 
              onClick={onBack}
              className="w-full py-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-lg transition-all"
            >
              Start New Discovery
            </Button>
          )}

          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-8">
            <Zap className="h-3 w-3 text-blue-500" />
            Powered by FormForge Engine
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] overflow-hidden relative py-12 px-4 selection:bg-blue-500/30">
      {/* Liquid Mesh Background for Standard Form */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 bg-indigo-600 animate-pulse" />
        <div className="absolute top-[40%] -right-[15%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-10 bg-blue-600" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-10 mb-8 border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{form.title}</h1>
          {form.description && (
            <p className="text-slate-400 text-lg leading-relaxed font-medium">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {form.schema.map((field) => (
            <div key={field.id} className="bg-slate-900/30 backdrop-blur-xl rounded-[2rem] p-8 space-y-4 border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block">
                {field.label}
                {field.required && <span className="text-rose-500 ml-1.5">*</span>}
              </label>

              {field.type === 'text' && (
                <Input
                  className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100 placeholder:text-slate-500"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'email' && (
                <Input
                  type="email"
                  className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100 placeholder:text-slate-500"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <Input
                  type="number"
                  className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100 placeholder:text-slate-500"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  min={field.validation?.min}
                  max={field.validation?.max}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  className="bg-slate-950/50 border-white/5 min-h-[120px] rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100 placeholder:text-slate-500 p-4"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'date' && (
                <Input
                  type="date"
                  className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100"
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'dropdown' && (
                <div className="relative group/select">
                  <select
                    className="w-full h-14 rounded-2xl border border-white/5 bg-slate-950/50 px-5 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all appearance-none"
                    value={values[field.id] || ''}
                    onChange={(e) => setValue(field.id, e.target.value)}
                  >
                    <option value="" className="bg-slate-900">Choose an option...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.id} value={opt.value} className="bg-slate-900">{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/select:text-slate-300 transition-colors">
                    <Zap className="w-3 h-3" />
                  </div>
                </div>
              )}

              {field.type === 'radio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {field.options?.map((opt) => (
                    <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      values[field.id] === opt.value
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-slate-950/30 border-white/5 text-slate-400 hover:bg-slate-900/50 hover:border-white/10'
                    }`}>
                      <input
                        type="radio"
                        name={field.id}
                        value={opt.value}
                        checked={values[field.id] === opt.value}
                        onChange={() => setValue(field.id, opt.value)}
                        className="w-5 h-5 rounded-full border-white/10 bg-slate-950 checked:bg-blue-600 focus:ring-0"
                      />
                      <span className="text-[15px] font-medium tracking-wide">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'checkbox' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {field.options?.map((opt) => (
                    <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      (values[field.id] || []).includes(opt.value)
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-slate-950/30 border-white/5 text-slate-400 hover:bg-slate-900/50 hover:border-white/10'
                    }`}>
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
                        className="w-5 h-5 rounded-lg border-white/10 bg-slate-950 checked:bg-blue-600 focus:ring-0"
                      />
                      <span className="text-[15px] font-medium tracking-wide">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'file' && (
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-400 file:bg-blue-600 file:text-white file:border-none file:rounded-lg file:px-4 file:py-1 file:mr-4 file:hover:bg-blue-500 transition-colors cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setValue(field.id, file.name);
                    }}
                  />
                </div>
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

          <Button 
            type="submit" 
            size="lg" 
            className="w-full py-8 rounded-[2rem] bg-white text-slate-950 hover:bg-slate-100 font-bold text-xl shadow-2xl shadow-white/5 transition-all transform active:scale-[0.98]" 
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="h-6 w-6 mr-3 animate-spin" /> Processing...</>
            ) : (
              'Submit Discovery'
            )}
          </Button>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] shadow-inner">
              <Zap className="h-3 w-3 text-blue-500" />
              Powered by FormForge Engine
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
