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
      <main className="max-w-7xl mx-auto px-8 py-10">
        
        {showInsights && aiInsights && (
          <div className="mb-12 space-y-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Bento Executive Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-blue-600 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">Executive Summary</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold leading-tight text-white tracking-tight">
                    {(aiInsights as any).summary || aiInsights}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Sentiment Bento */}
                {(aiInsights as any).sentiment && (
                  <Card className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center border-none">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                       <Activity className="h-3 w-3 text-blue-500" /> Emotional Pulse
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Positive', value: (aiInsights as any).sentiment.positive, color: 'bg-emerald-500' },
                        { label: 'Neutral', value: (aiInsights as any).sentiment.neutral, color: 'bg-blue-400' },
                        { label: 'Negative', value: (aiInsights as any).sentiment.negative, color: 'bg-rose-500' },
                      ].map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-bold text-slate-400">{s.label}</span>
                            <span className="text-[11px] font-black text-white">{s.value}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-800/50 overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Anomalies Bento */}
                {(aiInsights as any).anomalies && (aiInsights as any).anomalies.length > 0 && (
                  <Card className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6 shadow-xl border-none">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-500 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" /> System Alerts
                    </h4>
                    <ul className="space-y-2">
                      {(aiInsights as any).anomalies.slice(0, 2).map((anom: string, i: number) => (
                        <li key={i} className="text-[11px] font-medium text-rose-200/60 leading-relaxed">
                           {anom}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </div>
            <div className="h-px bg-white/5 my-12" />
          </div>
        )}

        {/* Bento Grid Analytics */}
        <div className="grid md:grid-cols-12 grid-rows-none gap-6">
          {/* Main Trend Line - Hero Bento */}
          <Card className="md:col-span-8 bg-slate-900 border-none rounded-[2.5rem] shadow-3xl overflow-hidden p-10 flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-[1.2rem]">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Submission Velocity</h3>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-bold text-slate-400">Live Trend</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.submissionsOverTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: 'none', borderRadius: '1.2rem', fontSize: '11px', fontWeight: 800, padding: '12px 16px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fill="url(#colorCount)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Peak Volume</span>
                  <span className="text-3xl font-black text-white">4.2k <span className="text-emerald-500 text-sm font-bold ml-1">↑</span></span>
               </div>
               <div className="flex -space-x-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                       <div className={`w-full h-full bg-gradient-to-br ${i % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-emerald-400 to-teal-500'}`} />
                    </div>
                  ))}
               </div>
            </div>
          </Card>

          {/* Metric Tiles Bento Column */}
          <div className="md:col-span-4 grid grid-cols-1 gap-6">
            <Card className="bg-slate-900 border-none rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-8 -bottom-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-32 w-32 text-blue-500" />
               </div>
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 mb-4">Total Scale</p>
               <h3 className="text-5xl font-black text-white tracking-tighter">{analytics.totalResponses}</h3>
               <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                 <TrendingUp className="h-3 w-3" /> +14.2% Growth
               </p>
            </Card>
            
            <Card className="bg-slate-900 border-none rounded-[2rem] p-8 shadow-2xl overflow-hidden group">
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 mb-4">DNA Profile</p>
               <ResponsiveContainer width="100%" height={150}>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.03)" />
                    <PolarAngleAxis dataKey="subject" tick={false} />
                    <Radar name="Responses" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  </RadarChart>
               </ResponsiveContainer>
               <p className="text-[10px] font-bold text-center text-slate-500 uppercase tracking-widest mt-4">Engagement Map</p>
            </Card>
          </div>

          {/* Distribution Bento Grid - Horizontal Row */}
          <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {chartFieldIds.slice(0, 4).map((fieldId, idx) => {
              const field = form.schema.find((f) => f.id === fieldId);
              const data = analytics.fieldDistributions[fieldId];
              if (!data || !field) return null;
              const isPieType = field.type === 'radio' || field.type === 'dropdown';

              return (
                <Card key={fieldId} className={`bg-slate-900 border-none rounded-[2rem] p-7 shadow-xl flex flex-col justify-between transition-all hover:bg-slate-800 group ${idx === 0 ? 'md:bg-indigo-600' : ''}`}>
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-white/10 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                          {isPieType ? <PieIcon className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'text-white/60' : 'text-slate-500'}`}>Field Capture</span>
                    </div>
                    <h4 className={`text-xs font-black uppercase tracking-[0.1em] truncate mb-6 ${idx === 0 ? 'text-white' : 'text-slate-300'}`}>
                      {field.label}
                    </h4>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={100}>
                    {isPieType ? (
                      <PieChart>
                        <Pie data={data} innerRadius={30} outerRadius={45} paddingAngle={4} dataKey="count" animationDuration={1000}>
                          {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={idx === 0 ? 'rgba(255,255,255,0.9)' : premiumColors[index % premiumColors.length]} stroke="none" opacity={0.8 - (index * 0.1)} />
                          ))}
                        </Pie>
                      </PieChart>
                    ) : (
                      <BarChart data={data}>
                        <Bar dataKey="count" fill={idx === 0 ? '#fff' : '#3b82f6'} radius={[4, 4, 4, 4]} barSize={idx === 0 ? 6 : 8} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {analytics.totalResponses === 0 && (
          <div className="text-center py-32 bg-slate-900 border-none rounded-[3rem] mt-12">
            <div className="p-6 bg-slate-800 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-inner">
               <TrendingUp className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white tracking-tight">Awaiting Intel</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analytics will initialize upon first form submission</p>
          </div>
        )}
      </main>
    </div>
  );
}
