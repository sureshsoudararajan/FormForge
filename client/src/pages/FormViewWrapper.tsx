import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FileText, ChevronRight, Loader2, AlertCircle, Zap } from 'lucide-react';
import api from '@/lib/api';
import ConversationalFormPage from './ConversationalFormPage';
import FormPage from './FormPage';

export default function FormViewWrapper() {
  const { shareToken } = useParams();
  const [view, setView] = useState<'select' | 'normal' | 'chat'>('select');
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shareToken) {
      api.get(`/forms/by-token/${shareToken}`)
        .then((res) => {
          setFormData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching form:', err);
          setError('Form not found or no longer available.');
          setLoading(false);
        });
    }
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Loading experience...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (view === 'normal') {
    return <FormPage shareToken={shareToken} initialData={formData} onBack={() => setView('select')} />;
  }

  if (view === 'chat') {
    return <ConversationalFormPage shareToken={shareToken} initialData={formData} onBack={() => setView('select')} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Interactive Experience</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
            How would you like to fill this out?
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl">
            Choose the experience that works best for you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Chat Option */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('chat')}
            className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 hover:border-blue-500/50 p-8 rounded-3xl text-left transition-all duration-300 shadow-2xl overflow-hidden"
          >
            {/* Background Gradient Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-transparent transition-all duration-500" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Chat Interface</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                A conversational, AI-enhanced experience that feels like a natural dialogue.
              </p>
              <div className="flex items-center text-blue-400 font-semibold text-sm">
                Start Chatting <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Normal Form Option */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('normal')}
            className="group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 hover:border-indigo-500/50 p-8 rounded-3xl text-left transition-all duration-300 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:to-transparent transition-all duration-500" />

            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">Standard Form</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                A traditional, clear-cut form layout for quick and focused data entry.
              </p>
              <div className="flex items-center text-indigo-400 font-semibold text-sm">
                Open Form <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>

        <div className="mt-16 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <span>Powered by</span>
          <span className="font-bold text-gray-400 tracking-wider">FORMMORPH</span>
        </div>
      </motion.div>
    </div>
  );
}
