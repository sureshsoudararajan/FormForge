import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { AnalyticsData, FormField } from '@/types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  ArrowLeft, Zap, BarChart3, TrendingUp, Sparkles, Loader2, X, AlertTriangle, Network, PieChart as PieIcon, Activity
} from 'lucide-react';

export default function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<{ title: string; schema: FormField[] } | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/forms/${id}`),
        api.get(`/analytics/${id}`),
      ]).then(([formRes, analyticsRes]) => {
        setForm(formRes.data);
        setAnalytics(analyticsRes.data);
      }).catch(() => navigate('/dashboard'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAiInsights = async () => {
    setAiLoading(true);
    try {
      const responsesRes = await api.get(`/responses/${id}?limit=50`);
      // FormMorph uses analyze endpoint
      const res = await api.post('/ai/analyze', {
        formTitle: form?.title,
        questions: form?.schema,
        responses: responsesRes.data.responses.map((r: any) => r.data),
      });
      setAiInsights(res.data);
      setShowInsights(true);
    } catch (err) {
      console.error('AI insights failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-6">
        <div className="relative w-16 h-16">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Scanning Neural Data</p>
      </div>
    );
  }

  if (!analytics || !form) return null;

  const chartFieldIds = Object.keys(analytics.fieldDistributions);
  
  // Aggregate data for Radar Chart (Form Fingerprint)
  const radarData = chartFieldIds.map(id => {
    const field = form.schema.find(f => f.id === id);
    const distributions = analytics.fieldDistributions[id] || [];
    const totalCount = distributions.reduce((acc, curr) => acc + curr.count, 0);
    return {
      subject: field?.label || id,
      A: totalCount,
      fullMark: Math.max(...chartFieldIds.map(fid => {
        const dist = analytics.fieldDistributions[fid] || [];
        return dist.reduce((a, c) => a + c.count, 0);
      }), 10)
    };
  });

  const premiumColors = ['#3b82f6', '#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-all group"
            >
              <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white tracking-tight">{form.title}</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Analytics Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/responses/${id}`}>
              <Button variant="ghost" className="text-slate-400 hover:text-white font-bold uppercase tracking-widest text-[10px]">Responses</Button>
            </Link>
            <Button
              onClick={handleAiInsights}
              disabled={aiLoading || analytics.totalResponses === 0}
              className="bg-blue-600 text-white hover:bg-blue-500 font-bold uppercase tracking-widest text-[10px] px-5 h-10 rounded-xl transition-all shadow-lg active:scale-95"
            >
              {aiLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-3 w-3 mr-2" />
              )}
              {aiLoading ? 'Processing' : 'AI Analysis'}
            </Button>
          </div>
        </div>
      </header>

      {/* AI Insights Expanded View (Inline instead of Modal) */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {showInsights && aiInsights && (
          <div className="mb-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* AI Summary Banner */}
            <div className="bg-blue-600 border border-blue-500 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
               <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-white/90 uppercase tracking-widest">
                <Sparkles className="h-4 w-4" /> Intelligence Summary
              </h3>
              <p className="text-base md:text-lg font-medium leading-relaxed text-white relative z-10">
                {(aiInsights as any).summary || aiInsights}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sentiment Analysis */}
              {(aiInsights as any).sentiment && (
                <Card className="border-white/5 bg-slate-900 shadow-xl rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                      <BarChart3 className="h-4 w-4 text-blue-500" /> Sentiment Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {[
                        { label: 'Positive', value: (aiInsights as any).sentiment.positive, color: 'bg-emerald-500' },
                        { label: 'Neutral', value: (aiInsights as any).sentiment.neutral, color: 'bg-blue-400' },
                        { label: 'Negative', value: (aiInsights as any).sentiment.negative, color: 'bg-rose-500' },
                      ].map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[11px] font-bold mb-1.5">
                            <span className="text-slate-400">{s.label}</span>
                            <span>{s.value}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Anomalies */}
              {(aiInsights as any).anomalies && (aiInsights as any).anomalies.length > 0 && (
                <Card className="border-rose-500/10 bg-rose-500/5 shadow-xl rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-rose-500/80">
                      <AlertTriangle className="h-4 w-4" /> Anomalous Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(aiInsights as any).anomalies.map((anom: string, i: number) => (
                        <li key={i} className="text-xs font-medium text-rose-200/70 flex items-start gap-3">
                          <span className="h-1 w-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {anom}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        {/* Stats Cards & Radar Map */}
        <div className="grid md:grid-cols-12 gap-6 mb-8">
          {/* Main Metrics */}
          <div className="md:col-span-8 grid grid-cols-2 gap-6">
            {[
              { label: 'Total Responses', value: analytics.totalResponses, icon: BarChart3 },
              { label: 'Completion Rate', value: '94%', icon: Activity },
              { label: 'Deployment Health', value: 'Prime', icon: TrendingUp },
              { label: 'Data Pulse', value: 'Steady', icon: Sparkles },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900 border border-white/5 rounded-3xl group overflow-hidden transition-all hover:bg-slate-800/50">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <stat.icon className="h-20 w-20 text-blue-500" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                    <div className="flex items-center gap-1 text-emerald-500 text-[9px] font-bold">
                      <TrendingUp className="h-2.5 w-2.5" />
                      <span>12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form Fingerprint Radar */}
          <Card className="md:col-span-4 bg-slate-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-6">Response DNA Profile</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.03)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 700 }} />
                <Radar
                  name="Responses"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Submissions Over Time Chart */}
        {analytics.submissionsOverTime.length > 0 && (
          <Card className="mb-8 bg-slate-900 border border-white/5 rounded-3xl overflow-hidden">
            <CardHeader className="px-8 py-6 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Submission Velocity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-8 py-6 pt-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics.submissionsOverTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#475569' }} />
                  <YAxis stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCount)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Field Distribution Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {chartFieldIds.map((fieldId) => {
            const field = form.schema.find((f) => f.id === fieldId);
            const data = analytics.fieldDistributions[fieldId];
            if (!data || !field) return null;
            const isPieType = field.type === 'radio' || field.type === 'dropdown';

            return (
              <Card key={fieldId} className="bg-slate-900 shadow-xl border border-white/5 rounded-3xl overflow-hidden transition-all hover:bg-slate-800/50">
                <CardHeader className="px-6 py-6 pb-2">
                   <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isPieType ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {isPieType ? <PieIcon className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                      </div>
                      <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">{field.label}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="px-6 py-6 pt-2">
                  <ResponsiveContainer width="100%" height={160}>
                    {isPieType ? (
                      <PieChart>
                        <Pie data={data} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="count" nameKey="label" animationDuration={1000}>
                          {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={premiumColors[index % premiumColors.length]} stroke="rgba(255,255,255,0.05)" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '9px' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
                        <XAxis dataKey="label" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '9px' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={8}>
                          {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={premiumColors[index % premiumColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {analytics.totalResponses === 0 && (
          <div className="text-center py-20">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No analytics yet</h3>
            <p className="text-muted-foreground">Analytics will appear once your form receives responses</p>
          </div>
        )}
      </main>
    </div>
  );
}
