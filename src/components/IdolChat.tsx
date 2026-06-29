import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, X, Trophy, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface IdolChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IdolChat({ isOpen, onClose }: IdolChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Сайн уу! Би байна, Ламин Ямал. ⚽ Чамд хөлбөмбөг, бэлтгэл сургуулилт, эсвэл залуу насандаа амжилтанд хүрэх, зорилгодоо үнэнч байх талаар ямар нэгэн зөвлөгөө, дэмжлэг хэрэгтэй байна уу? Би өөрийнхөө амьдрал, туршлагаас хуваалцахад бэлэн байна. Хамтдаа урагшилцгаая! 🏆💪'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Хөлбөмбөгийн гараагаа хэрхэн эхэлсэн бэ? ⚽',
    'Залуу хүмүүст өгөх хамгийн том зөвлөгөө юу вэ? 🌟',
    'Дарамт, хүлээлтийг хэрхэн даван туулдаг вэ? 💪',
    'Сагс, волейболын спортын талаар юу гэж боддог вэ? 🏀'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/idol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('API хариу өгөхөд алдаа гарлаа');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
    } catch (error) {
      console.error('Error fetching chat:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Уучлаарай, сүлжээний холболт амжилтгүй боллоо. Дахин оролдоно уу! 📲'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="idol-chat-modal-overlay" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Main Container */}
          <motion.div
            id="idol-chat-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl h-[85vh] sm:h-[75vh] flex flex-col bg-slate-900 border-2 border-[#e8702a]/40 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header: Barça Red & Blue styling combined with Lithos Orange */}
            <div id="idol-chat-header" className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] border-b border-white/10">
              {/* Decorative Background Stripes */}
              <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-b from-[#991b1b] to-[#1e3a8a]" />
              
              <div className="flex items-center gap-4.5 pl-3">
                <div id="idol-avatar-container" className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-[#e8702a]/80 shadow-md">
                    <img 
                      src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1508098682722-e99c43a406b2%3Fw%3D300%26auto%3Dformat%26fit%3Dcrop%26q%3D60&w=300&q=80" 
                      alt="Lamine Yamal Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse" />
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 id="idol-chat-title" className="text-white text-base font-bold tracking-tight">Lamine Yamal</h3>
                    <Trophy size={14} className="text-yellow-500 fill-yellow-500 animate-bounce" />
                  </div>
                  <p id="idol-chat-subtitle" className="text-white/60 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Идэвхтэй • Idol Coach
                  </p>
                </div>
              </div>

              <button
                id="idol-chat-close"
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div id="idol-chat-messages-area" className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-950/80 to-slate-900/60 custom-scrollbar">
              {messages.map((m, index) => {
                const isMe = m.role === 'user';
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-[#e8702a] text-white rounded-br-none font-medium'
                          : 'bg-slate-800/90 text-white/95 border border-white/5 rounded-bl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start items-center gap-2"
                >
                  <div className="bg-slate-800 border border-white/5 rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e8702a] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-[#e8702a] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#e8702a] animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Container */}
            {messages.length === 1 && (
              <div id="idol-chat-quick-prompts" className="p-4 bg-slate-950/40 border-t border-white/5 flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs font-semibold px-3.5 py-2 rounded-full bg-slate-800 hover:bg-[#e8702a] text-white/90 hover:text-white border border-white/5 hover:border-[#e8702a] transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form id="idol-chat-form" onSubmit={handleSubmit} className="p-4 bg-slate-950 border-t border-white/10 flex items-center gap-3">
              <input
                id="idol-chat-input-field"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ламин Ямалаас асуух зүйлээ бичнэ үү..."
                className="flex-1 bg-slate-900 border border-white/10 focus:border-[#e8702a] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#e8702a] transition-all"
                disabled={isLoading}
              />
              <button
                id="idol-chat-send-btn"
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-3.5 bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-slate-800 disabled:text-white/20 text-white rounded-2xl transition-all shadow-lg hover:scale-[1.03] active:scale-95 disabled:scale-100 cursor-pointer flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
