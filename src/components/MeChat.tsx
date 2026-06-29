import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, X, MessageCircle, Sparkles, User, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function MeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Сайн уу! 🏀 Цэцмөнхийн хиймэл оюуны туслах Me-AI байна. Би Цэцмөнхийн тухай (түүний дуртай сагсан бөмбөг, волейбол, "The Mask" кино, анимэд дургүй гэх мэт) болон манай Lithos төслийн талаар маш сайн мэднэ. Чамд юугаар туслах вэ? 😊'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1); // Show notification badge at start
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Цэцмөнхийн тухай яриач? ⛹️‍♂️',
    '"The Mask" киноны талаар? 🎭',
    'Сагс, волейболын сонирхол 🏐',
    'Яагаад анимэ үздэггүй вэ? 🚫'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0); // Clear badge when opened
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('API хариу амжилтгүй боллоо');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
    } catch (error) {
      console.error('Error fetching Me-AI:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Сүлжээний алдаа гарлаа. Түр хүлээгээд дахин бичнэ үү! 🔌'
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
    <div id="me-ai-floating-container" className="fixed bottom-24 right-6 sm:bottom-28 sm:right-8 z-[110] flex flex-col items-end">
      {/* Messenger Popup Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="me-ai-chat-popup"
            initial={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-[90vw] sm:w-[380px] h-[500px] flex flex-col bg-slate-900/95 backdrop-blur-md border border-[#e8702a]/30 rounded-2xl shadow-2xl overflow-hidden mb-4"
          >
            {/* Header */}
            <div id="me-ai-header" className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div id="me-ai-avatar-container" className="relative">
                  <div className="w-9 h-9 rounded-full bg-[#e8702a]/20 border border-[#e8702a]/50 flex items-center justify-center text-white font-bold text-sm">
                    TM
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <h4 id="me-ai-name" className="text-white text-sm font-semibold flex items-center gap-1">
                    Me-AI Туслах
                    <Sparkles size={11} className="text-[#e8702a]" />
                  </h4>
                  <p id="me-ai-status" className="text-white/40 text-[10px]">Цэцмөнхийн туслах • Идэвхтэй</p>
                </div>
              </div>
              <button
                id="me-ai-close-btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div id="me-ai-messages-list" className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-950/60 to-slate-900/40 custom-scrollbar">
              {messages.map((m, index) => {
                const isMe = m.role === 'user';
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-[#e8702a] text-white rounded-br-none font-medium'
                          : 'bg-slate-800 text-white/90 rounded-bl-none border border-white/5'
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-white/5 rounded-2xl px-3.5 py-2 rounded-bl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8702a] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8702a] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8702a] animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            {messages.length === 1 && (
              <div id="me-ai-chips" className="px-3 py-2 bg-slate-950/40 border-t border-white/5 flex flex-wrap gap-1.5 justify-center">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[10px] font-medium px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-[#e8702a] text-white/80 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/5"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Form Input */}
            <form id="me-ai-form" onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2">
              <input
                id="me-ai-input-field"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Бичих зүйлээ оруулна уу..."
                className="flex-1 bg-slate-900 border border-white/10 focus:border-[#e8702a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#e8702a] transition-all"
                disabled={isLoading}
              />
              <button
                id="me-ai-send-btn"
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-slate-800 disabled:text-white/20 text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Circle Button */}
      <motion.button
        id="me-ai-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-[#e8702a] to-[#ff8c42] flex items-center justify-center text-white shadow-xl shadow-[#e8702a]/20 cursor-pointer border-2 border-white/20 hover:border-white focus:outline-none relative group"
        aria-label="Open Me-AI Helper"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread Indicator Badge */}
        {!isOpen && unreadCount > 0 && (
          <span id="me-ai-badge" className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 text-xs text-white/95 whitespace-nowrap shadow-xl">
            Me-AI асуулт хариулт
          </div>
        )}
      </motion.button>
    </div>
  );
}
