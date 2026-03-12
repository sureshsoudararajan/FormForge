import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { AnalyticsData, FormField } from '@/types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  ArrowLeft, Zap, BarChart3, TrendingUp, Sparkles, Loader2, X, AlertTriangle, Network
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics || !form) return null;

  const chartFieldIds = Object.keys(analytics.fieldDistributions);

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
              <span className="font-semibold">{form.title} — Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/responses/${id}`}>
              <Button variant="ghost" size="sm">Responses</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiInsights}
              disabled={aiLoading || analytics.totalResponses === 0}
              className="gap-1"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              AI Insights
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                  <p className="text-3xl font-bold mt-1">{analytics.totalResponses}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Form Fields</p>
                  <p className="text-3xl font-bold mt-1">{form.schema.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Days Active</p>
                  <p className="text-3xl font-bold mt-1">{analytics.submissionsOverTime.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Over Time Chart */}
        {analytics.submissionsOverTime.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Submissions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.submissionsOverTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" />
                  <XAxis dataKey="date" stroke="hsl(217, 10%, 64%)" fontSize={12} />
                  <YAxis stroke="hsl(217, 10%, 64%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(225, 50%, 8%)',
                      border: '1px solid hsl(215, 28%, 17%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(262, 83%, 58%)"
                    strokeWidth={2}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Field Distribution Charts */}
        {chartFieldIds.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {chartFieldIds.map((fieldId) => {
              const field = form.schema.find((f) => f.id === fieldId);
              const data = analytics.fieldDistributions[fieldId];
              if (!data || !field) return null;

              return (
                <Card key={fieldId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{field.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" />
                        <XAxis dataKey="label" stroke="hsl(217, 10%, 64%)" fontSize={11} />
                        <YAxis stroke="hsl(217, 10%, 64%)" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(225, 50%, 8%)',
                            border: '1px solid hsl(215, 28%, 17%)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(262, 83%, 58%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
