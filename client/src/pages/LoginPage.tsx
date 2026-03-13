import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google-login', { 
        token: credentialResponse.credential 
      });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-500/30">
      {/* Advanced Liquid Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 bg-blue-600 animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-10 bg-indigo-600" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-slate-900/40 backdrop-blur-[40px] border border-white/5 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5">
          <CardHeader className="text-center pt-10 pb-6 px-10 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50" />
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-white text-slate-950 rounded-2xl shadow-xl">
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-[0.3em] text-white uppercase">FormForge <span className="text-blue-500">Pro</span></span>
            </div>
            <CardTitle className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400 font-medium tracking-wide">Enter the next generation of data collection</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold uppercase tracking-wider text-center"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identity Access</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100 placeholder:text-slate-500"
                  placeholder="you@formforge.pro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Secure Key</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all text-slate-100 placeholder:text-slate-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full py-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-lg transition-all shadow-2xl active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Authorize Access'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5"></span>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                  <span className="bg-[#1e293b]/50 px-4 text-slate-500 backdrop-blur-sm">Social Protocol</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </div>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                New to the platform?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold tracking-tight transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
