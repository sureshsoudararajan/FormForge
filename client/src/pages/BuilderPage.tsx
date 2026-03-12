import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormStore } from '@/stores/formStore';
import FieldPalette from '@/components/builder/FieldPalette';
import Canvas from '@/components/builder/Canvas';
import FieldSettings from '@/components/builder/FieldSettings';
import AIGenerator from '@/components/builder/AIGenerator';
import AISuggester from '@/components/builder/AISuggester';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import {
  Zap, ArrowLeft, Save, Eye, Globe, Loader2, Copy, Check, X, Code
} from 'lucide-react';

export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    formId, title, fields, published, tone, setFormId, setTitle,
    loadForm, resetForm, setPublished, setTone
  } = useFormStore();

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load existing form
  useEffect(() => {
    if (id) {
      api.get(`/forms/${id}`).then((res) => {
        loadForm(res.data);
      }).catch(() => {
        navigate('/dashboard');
      });
    } else {
      resetForm();
    }
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const questionsData = fields.map(f => ({
        id: f.id,
        text: f.label,
        type: f.type,
        hint: f.hint,
        options: f.options
      }));

      if (formId) {
        await api.put(`/forms/${formId}`, { title, schema: fields, tone, questions: questionsData });
      } else {
        const res = await api.post('/forms', { title, schema: fields, tone, questions: questionsData });
        setFormId(res.data.id);
        navigate(`/builder/${res.data.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [formId, title, fields, tone]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const questionsData = fields.map(f => ({
        id: f.id,
        text: f.label,
        type: f.type,
        hint: f.hint,
        options: f.options
      }));

      // Save first
      let currentId = formId;
      if (!currentId) {
        const res = await api.post('/forms', { title, schema: fields, tone, questions: questionsData });
        currentId = res.data.id;
        setFormId(currentId);
        navigate(`/builder/${currentId}`, { replace: true });
      } else {
        await api.put(`/forms/${currentId}`, { title, schema: fields, tone, questions: questionsData });
      }

      // Publish
      const res = await api.post(`/forms/${currentId}/publish`);
      setPublished(true);
      
      // FormMorph: Use the short share token URL if available
      const url = `${window.location.origin}/f/${res.data.shareToken || currentId}`;
      setShareUrl(url);
      setShowShareModal(true);
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setPublishing(false);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview Modal
  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">Preview Mode</span>
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
            <X className="h-4 w-4 mr-1" /> Close Preview
          </Button>
        </div>
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">{title}</h1>
          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                {field.type === 'text' && <Input placeholder={field.placeholder} disabled />}
                {field.type === 'email' && <Input type="email" placeholder={field.placeholder} disabled />}
                {field.type === 'number' && <Input type="number" placeholder={field.placeholder} disabled />}
                {field.type === 'textarea' && (
                  <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={field.placeholder} disabled />
                )}
                {field.type === 'date' && <Input type="date" disabled />}
                {field.type === 'dropdown' && (
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" disabled>
                    <option>Select...</option>
                    {field.options?.map((o) => <option key={o.id}>{o.label}</option>)}
                  </select>
                )}
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options?.map((o) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm">
                        <input type="radio" name={field.id} disabled /> {o.label}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'checkbox' && (
                  <div className="space-y-2">
                    {field.options?.map((o) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" disabled /> {o.label}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'file' && (
                  <div className="border-2 border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
                    Drop file here or click to upload
                  </div>
                )}
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
          {fields.length > 0 && (
            <Button className="mt-8 w-full" disabled>Submit (Preview)</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm font-medium border-none bg-transparent focus-visible:ring-1 w-48"
            />
          </div>
          <div className="flex items-center gap-2 border-l border-r px-4 mx-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tone:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="h-8 text-sm font-medium bg-transparent border-none rounded focus-visible:ring-1 outline-none text-blue-400 cursor-pointer p-0"
            >
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="empathetic">Empathetic</option>
              <option value="standard">Standard (No AI)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AIGenerator />
          <AISuggester />
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4 mr-1" />}
            {published ? 'Published' : 'Publish'}
          </Button>
        </div>
      </header>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-card border rounded-xl p-6 max-w-lg w-full space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Form Published!</h3>
              <p className="text-sm text-muted-foreground mt-1">Your conversational form is ready for the world.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Direct Link
                </label>
                <div className="flex items-center gap-2">
                  <Input value={shareUrl} readOnly className="text-sm font-mono bg-muted/50" />
                  <Button size="icon" variant="outline" onClick={copyShareUrl}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Code className="h-4 w-4 text-indigo-400" /> Embed Widget
                </label>
                <p className="text-xs text-muted-foreground">Copy this tag into your website's <code className="bg-muted px-1 rounded">&lt;body&gt;</code> to add a floating chat widget.</p>
                <div className="relative">
                  <textarea 
                    readOnly 
                    className="w-full h-24 text-xs font-mono bg-muted/50 border rounded-md p-3 pr-10 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={`<script src="${window.location.origin}/widget.js" data-form="${shareUrl.split('/').pop()}"></script>`}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(`<script src="${window.location.origin}/widget.js" data-form="${shareUrl.split('/').pop()}"></script>`);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowShareModal(false)}>Done</Button>
          </div>
        </div>
      )}

      {/* Builder Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Field Palette */}
        <aside className="w-64 border-r bg-card/50 overflow-y-auto shrink-0">
          <FieldPalette />
        </aside>

        {/* Canvas */}
        <Canvas />

        {/* Right Sidebar — Field Settings */}
        <aside className="w-72 border-l bg-card/50 overflow-y-auto shrink-0">
          <FieldSettings />
        </aside>
      </div>
    </div>
  );
}
