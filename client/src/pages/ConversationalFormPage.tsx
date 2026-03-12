import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, CheckCircle, Upload, FileText, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  text?: string;
  label?: string; // fallback for legacy data
  type: 'text' | 'textarea' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'email' | 'number' | 'file';
  hint?: string;
  options?: { id: string; label: string; value: string }[];
}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  questionId?: string;
}

const isFileQuestion = (q: Question | null | undefined) => {
  if (!q) return false;
  const idLower = q.id.toLowerCase();
  const textLower = (q.text || q.label || '').toLowerCase();
  return q.type === 'file' || 
         idLower.includes('file') || 
         idLower.includes('upload') || 
         idLower.includes('resume') || 
         idLower.includes('cover_letter') ||
         textLower.includes('upload your');
};

interface ConversationalFormPageProps {
  shareToken?: string;
  initialData?: any;
  onBack?: () => void;
}

export default function ConversationalFormPage({ shareToken: propToken, initialData, onBack }: ConversationalFormPageProps = {}) {
  const { shareToken: paramsToken } = useParams();
  const shareToken = propToken || paramsToken;
  const navigate = useNavigate();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [isUploading, setIsUploading] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState<string | null>(null);
  const [preFillBuffer, setPreFillBuffer] = useState<Record<string, any>>({});
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Init session
  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await api.post(`/session/start/${shareToken}`);
        const data = res.data;
        
        setSessionId(data.sessionId);
        setTone(data.tone);
        setQuestions(data.allQuestions || []);
        
        // Ask first question
        if (data.firstQuestion) {
          await askQuestion(data.firstQuestion, true);
        }
      } catch (err) {
        console.error(err);
        setMessages([{ id: 'err', type: 'ai', content: "Sorry, I couldn't start the session. Please check your connection." }]);
        setIsTyping(false);
      }
    };
    
    startSession();

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const askQuestion = async (q: Question, isFirst: boolean = false) => {
    setIsTyping(true);
    setCurrentQuestion(q);
    const questionText = q.text || q.label || 'Next question';
    
    try {
      // Rephrase the question based on tone
      const res = await api.post(`/ai/rephrase`, { 
        question: questionText, 
        tone, 
        isFirst,
        sentiment: currentSentiment
      });
      const data = res.data;
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'ai', 
        content: data.rephrased || questionText,
        questionId: q.id
      }]);
    } catch {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'ai', 
        content: questionText,
        questionId: q.id
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !currentQuestion || !sessionId) return;
    
    const userAns = inputValue.trim();
    setInputValue('');
    
    // 1. Add user message to UI immediately
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: userAns }]);
    setIsTyping(true);
    setCurrentQuestion(null); // hide inputs while processing

    try {
      const questionText = currentQuestion.text || currentQuestion.label || '';
      // 2. Parse answer via AI
      const parseRes = await api.post(`/ai/parse-answer`, { 
        question: questionText, 
        answer: userAns 
      });
      const parseData = parseRes.data;

      // 2.5 Detect sentiment
      try {
        const sentimentRes = await api.post('/ai/detect-sentiment', { answer: userAns });
        setCurrentSentiment(sentimentRes.data.sentiment);
      } catch (err) {
        console.error('Sentiment detection failed:', err);
      }

      // 3. Submit answer to session, get next question
      const submitRes = await api.post(`/session/${sessionId}/answer`, { 
        questionId: currentQuestion.id, 
        rawAnswer: userAns,
        parsedAnswer: parseData.parsed
      });
      const submitData = submitRes.data;

      if (submitData.done) {
        // Complete session
        await api.post(`/session/${sessionId}/complete`);
        setIsCompleted(true);
        setIsTyping(false);
      } else {
        // Check if NEXT question is in pre-fill buffer
        const nextQ = submitData.nextQuestion;
        if (preFillBuffer[nextQ.id]) {
          // Auto-submit from buffer
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            type: 'ai', 
            content: `I've found the answer for "${nextQ.text || nextQ.label}" in your document: "${preFillBuffer[nextQ.id]}"` 
          }]);
          
          const autoSubmitRes = await api.post(`/session/${sessionId}/answer`, { 
            questionId: nextQ.id, 
            rawAnswer: preFillBuffer[nextQ.id].toString(),
            parsedAnswer: preFillBuffer[nextQ.id]
          });
          
          if (autoSubmitRes.data.done) {
            await api.post(`/session/${sessionId}/complete`);
            setIsCompleted(true);
            setIsTyping(false);
          } else {
            await askQuestion(autoSubmitRes.data.nextQuestion);
          }
        } else {
          await askQuestion(nextQ);
        }
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: "Sorry, I had trouble saving that. Could you try again?" }]);
      setCurrentQuestion(currentQuestion); // restore input
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentQuestion || !sessionId) return;

    // Restriction check
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isImage = file.type.startsWith('image/');
    
    if (!allowedExtensions.includes(fileExt) && !isImage) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'ai', 
        content: "Sorry, you can only upload PDF, Word, PPT, or images (JPG, PNG, GIF, etc.)." 
      }]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/responses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const filePath = res.data.filePath;
      
      // Add user message with filename
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'user', 
        content: `Uploaded: ${file.name}` 
      }]);
      
      setIsTyping(true);
      setCurrentQuestion(null);

      // Submit the file path as the answer
      const submitRes = await api.post(`/session/${sessionId}/answer`, { 
        questionId: currentQuestion.id, 
        rawAnswer: filePath, // The answer is the URL
        parsedAnswer: filePath
      });
      const submitData = submitRes.data;

      if (submitData.done) {
        await api.post(`/session/${sessionId}/complete`);
        setIsCompleted(true);
        setIsTyping(false);
      } else {
        // TRIGGER MAGIC FILL if it's a doc
        if (fileExt === '.pdf' || fileExt === '.txt' || fileExt === '.docx') {
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            type: 'ai', 
            content: "Magically reading your document to pre-fill the rest of the form... ✨" 
          }]);
          
          try {
            const magicRes = await api.post('/magic-fill/parse-document', {
              filePath,
              questions: questions.filter(q => q.id !== currentQuestion.id)
            });
            setPreFillBuffer(magicRes.data.mapping);
            
            // If the VERY NEXT question is now in buffer, we should handle it
            const nextQ = submitData.nextQuestion;
            if (magicRes.data.mapping[nextQ.id]) {
               // We'll let the handleSend-like logic above handle the chain, or just ask here
               await askQuestion(nextQ); // It will handle rephrasing, then maybe we can auto-submit in a useEffect or similar. 
               // For now, let's keep it simple: next time askQuestion runs, it will show the rephrased question.
               // Actually, let's just trigger another skip cycle.
            } else {
               await askQuestion(nextQ);
            }
          } catch (err) {
            console.error('Magic fill failed:', err);
            await askQuestion(submitData.nextQuestion);
          }
        } else {
          await askQuestion(submitData.nextQuestion);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'ai', 
        content: "Sorry, the file upload failed. Please try again or provide a different response." 
      }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl max-w-md w-full"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-gray-400 mb-8">Thanks for taking the time to chat.</p>
          <button 
            onClick={() => onBack ? onBack() : window.close()}
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-colors"
          >
            {onBack ? 'Fill Again / Change Mode' : 'Close Window'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen font-sans ${isEmbed ? 'bg-transparent' : 'bg-gray-950 text-gray-100'}`}>
      {/* Header - Hidden in Embed Mode */}
      {!isEmbed && (
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="font-semibold text-gray-200">FormMorph</h1>
          </div>
        </header>
      )}

      {/* Chat Area */}
      <main className={`flex-1 overflow-y-auto pb-32 ${isEmbed ? 'p-2' : 'p-4 sm:p-6'}`}>
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/50'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-800 text-gray-400 px-5 py-4 rounded-2xl rounded-bl-sm border border-gray-700/50 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-[bounce_1s_infinite_0ms]" />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-[bounce_1s_infinite_200ms]" />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-[bounce_1s_infinite_400ms]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      {currentQuestion && !isTyping && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${isEmbed ? 'bg-gray-900 border-gray-800' : 'bg-gray-950 border-gray-800'} border-t p-3 sm:p-4 sticky bottom-0 w-full z-20`}
        >
          <div className="max-w-3xl mx-auto">
            {isFileQuestion(currentQuestion) ? (
              <div className="flex flex-col items-center gap-4">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 text-lg shadow-lg shadow-indigo-500/20"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {currentQuestion.hint || 'Select a file to upload'}
                </p>
              </div>
            ) : (
              <div className="relative flex items-end gap-2">
                <div className={`bg-gray-900 rounded-2xl border ${isListening ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-700 focus-within:border-blue-500'} transition-all flex-1 p-2 flex items-center shadow-lg`}>
                  <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-3 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (isListening) toggleListening();
                        handleSend();
                      }
                    }}
                    placeholder={isListening ? "Listening..." : "Type your answer..."}
                    className="w-full bg-transparent border-none text-gray-100 placeholder:text-gray-500 px-2 py-3 focus:outline-none resize-none min-h-[50px] max-h-32 text-[15px]"
                    rows={1}
                    autoFocus
                  />

                  <button
                    onClick={() => {
                      if (isListening) toggleListening();
                      handleSend();
                    }}
                    disabled={!inputValue.trim()}
                    className="p-3"
                  >
                    <div className={`p-2 rounded-xl transition-all ${
                      inputValue.trim() 
                        ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' 
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      <Send className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
