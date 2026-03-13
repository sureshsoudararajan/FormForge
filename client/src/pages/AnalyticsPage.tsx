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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Liquid Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0f172a]" />
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 bg-blue-600 animate-pulse" />
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-10 bg-indigo-600" />
      </div>

      <header className="border-b border-white/5 bg-slate-950/20 backdrop-blur-2xl sticky top-0 z-50 transition-colors duration-1000">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
            >
              <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Analytics Engine</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">{form.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to={`/responses/${id}`}>
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] px-6">Responses</Button>
            </Link>
            <Button
              onClick={handleAiInsights}
              disabled={aiLoading || analytics.totalResponses === 0}
              className="bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] px-6 py-6 rounded-2xl shadow-2xl transition-all active:scale-95"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              )}
              {aiLoading ? 'Processing...' : 'Deep AI Insights'}
            </Button>
          </div>
        </div>
      </header>

      {/* AI Insights Expanded View (Inline instead of Modal) */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {showInsights && aiInsights && (
          <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* AI Summary Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-primary">
                <Sparkles className="h-5 w-5" /> Executive Summary
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-card-foreground/90 relative z-10">
                {(aiInsights as any).summary || aiInsights}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sentiment Analysis */}
              {(aiInsights as any).sentiment && (
                <Card className="border-primary/10 bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" /> Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-emerald-500 font-medium">Positive</span>
                          <span>{(aiInsights as any).sentiment.positive}%</span>
                        </div>
                        <div className="h-2 rounded-full border bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(aiInsights as any).sentiment.positive}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-400 font-medium">Neutral</span>
                          <span>{(aiInsights as any).sentiment.neutral}%</span>
                        </div>
                        <div className="h-2 rounded-full border bg-muted overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(aiInsights as any).sentiment.neutral}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-rose-500 font-medium">Negative</span>
                          <span>{(aiInsights as any).sentiment.negative}%</span>
                        </div>
                        <div className="h-2 rounded-full border bg-muted overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(aiInsights as any).sentiment.negative}%` }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Anomalies */}
              {(aiInsights as any).anomalies && (aiInsights as any).anomalies.length > 0 && (
                <Card className="border-rose-500/20 bg-rose-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-rose-500">
                      <AlertTriangle className="h-4 w-4" /> Flagged Responses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(aiInsights as any).anomalies.map((anom: string, i: number) => (
                        <li key={i} className="text-sm text-card-foreground/80 flex items-start gap-2">
                          <span className="text-rose-500 mt-0.5">•</span>
                          {anom}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Clusters */}
            {(aiInsights as any).clusters && (
              <Card className="border-primary/10 bg-card/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-500" /> Response Clusters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(aiInsights as any).clusters.map((cluster: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border bg-background/50 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm text-primary">{cluster.name}</h4>
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {cluster.count}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-auto">{cluster.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="h-px bg-border my-8" />
          </div>
        )}
        {/* Stats Cards & Radar Map */}
        <div className="grid md:grid-cols-12 gap-6 mb-12">
          {/* Main Metrics */}
          <div className="md:col-span-8 grid grid-cols-2 gap-6">
            {[
              { label: 'Total Responses', value: analytics.totalResponses, icon: BarChart3, color: 'text-blue-500' },
              { label: 'Completion Rate', value: '94%', icon: Activity, color: 'text-emerald-500' },
              { label: 'Deployment Health', value: 'Prime', icon: TrendingUp, color: 'text-purple-500' },
              { label: 'Data Pulse', value: 'Steady', icon: Sparkles, color: 'text-amber-500' },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900/40 backdrop-blur-3xl border-white/5 hover:border-white/10 transition-all rounded-[2rem] shadow-2xl group overflow-hidden border-none active:scale-[0.98]">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <stat.icon className="h-24 w-24" />
                </div>
                <CardContent className="p-8 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                    <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                      <TrendingUp className="h-3 w-3" />
                      <span>+12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form Fingerprint Radar */}
          <Card className="md:col-span-4 bg-slate-900/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] shadow-2xl border-none overflow-hidden flex flex-col items-center justify-center pt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Response DNA Profile</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                <Radar
                  name="Responses"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Submissions Over Time Chart */}
        {analytics.submissionsOverTime.length > 0 && (
          <Card className="mb-12 bg-slate-900/40 backdrop-blur-2xl border-none border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="px-10 py-8 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Response Volatility Trend</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-10 py-8 pt-6">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.submissionsOverTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#334155" 
                    fontSize={9} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#475569', fontWeight: 800 }}
                  />
                  <YAxis 
                    stroke="#334155" 
                    fontSize={9} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#475569', fontWeight: 800 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '1.5rem',
                      fontSize: '10px',
                      fontWeight: 800,
                      boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                    }}
                  />
                  <Area
                    type="step"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorCount)"
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* High-Density Distribution Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {chartFieldIds.map((fieldId) => {
            const field = form.schema.find((f) => f.id === fieldId);
            const data = analytics.fieldDistributions[fieldId];
            if (!data || !field) return null;

            const isPieType = field.type === 'radio' || field.type === 'dropdown';

            return (
              <Card key={fieldId} className="bg-slate-900/40 backdrop-blur-2xl border-none border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all hover:translate-y-[-4px]">
                <CardHeader className="p-8 pb-2">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isPieType ? 'bg-purple-500/10' : 'bg-emerald-500/10'}`}>
                        {isPieType ? <PieIcon className="h-4 w-4 text-purple-500" /> : <BarChart3 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 truncate pr-4">{field.label}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={180}>
                    {isPieType ? (
                      <PieChart>
                        <Pie
                          data={data}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="count"
                          nameKey="label"
                          animationDuration={2000}
                        >
                          {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={premiumColors[index % premiumColors.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{
                             backgroundColor: '#020617',
                             border: 'none',
                             borderRadius: '1rem',
                             fontSize: '9px',
                             fontWeight: 800
                           }}
                        />
                      </PieChart>
                    ) : (
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
                        <XAxis dataKey="label" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            border: 'none',
                            borderRadius: '1rem',
                            fontSize: '9px',
                            fontWeight: 800
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#3b82f6"
                          radius={[6, 6, 6, 6]}
                          barSize={12}
                        >
                          {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={premiumColors[index % premiumColors.length]} opacity={0.8} />
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
