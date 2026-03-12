import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { FormField, FormResponse } from '@/types';
import {
  ArrowLeft, Download, Trash2, Search, ChevronLeft, ChevronRight,
  Loader2, Zap, FileText, ExternalLink, DownloadCloud
} from 'lucide-react';

export default function ResponsesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<{ title: string; schema: FormField[] } | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (id) {
      api.get(`/forms/${id}`).then((res) => setForm(res.data)).catch(() => navigate('/dashboard'));
      loadResponses();
    }
  }, [id, page]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/responses/${id}?page=${page}&limit=20&search=${search}`);
      setResponses(res.data.responses);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Load responses failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadResponses();
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/responses/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form?.title || 'responses'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDelete = async (responseId: string) => {
    if (!confirm('Delete this response?')) return;
    try {
      await api.delete(`/responses/${id}/${responseId}`);
      setResponses(responses.filter((r) => r.id !== responseId));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">{form?.title || 'Responses'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/analytics/${id}`}>
              <Button variant="ghost" size="sm">Analytics</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Responses</h1>
            <p className="text-sm text-muted-foreground">{total} total responses</p>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
            <p className="text-muted-foreground">Share your form to start collecting responses</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                      {form?.schema.map((field) => (
                        <th key={field.id} className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">
                          {field.label}
                        </th>
                      ))}
                      <th className="text-left p-3 font-medium text-muted-foreground">Submitted</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response, idx) => (
                      <tr key={response.id} className="border-b last:border-0 hover:bg-secondary/10 transition-colors">
                        <td className="p-3 text-muted-foreground">{(page - 1) * 20 + idx + 1}</td>
                        {form?.schema.map((field) => (
                          <td key={field.id} className="p-3 max-w-[200px] truncate">
                            {typeof response.data[field.id] === 'string' && response.data[field.id].startsWith('/uploads/') ? (
                              (() => {
                                const url = response.data[field.id].startsWith('http') 
                                  ? response.data[field.id] 
                                  : `${api.defaults.baseURL?.includes('http') ? api.defaults.baseURL.split('/api')[0] : ''}${response.data[field.id]}`;
                                const isViewable = /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(url);
                                
                                return (
                                  <a 
                                    href={url} 
                                    target={isViewable ? "_blank" : "_self"} 
                                    rel="noopener noreferrer"
                                    download={!isViewable}
                                    className="text-blue-500 hover:underline flex items-center gap-1"
                                  >
                                    {isViewable ? (
                                      <>View <ExternalLink className="h-3 w-3" /></>
                                    ) : (
                                      <>Download <DownloadCloud className="h-3 w-3" /></>
                                    )}
                                  </a>
                                );
                              })()
                            ) : Array.isArray(response.data[field.id])
                              ? response.data[field.id].join(', ')
                              : response.data[field.id]?.toString() || '-'}
                          </td>
                        ))}
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {new Date(response.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDelete(response.id)}
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
