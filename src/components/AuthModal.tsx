import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Loader2, LogIn, Fingerprint, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'mn' | 'en';
}

export default function AuthModal({ isOpen, onClose, lang = 'mn' }: AuthModalProps) {
  const { loginWithGoogle, loginAnonymously, registerWithEmail, loginWithEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [guestName, setGuestName] = useState(() => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return lang === 'mn' ? `Аялагч #${randomNum}` : `Explorer #${randomNum}`;
  });

  // State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = {
    mn: {
      title: 'Нэвтрэх хэсэг',
      subtitle: 'Tsetsmunkh-ийн ертөнцөд нэгдэж, оноогоо бүртгүүлээрэй!',
      signIn: 'Нэвтрэх',
      signUp: 'Бүртгүүлэх',
      guest: 'Зочин',
      email: 'И-мэйл хаяг',
      password: 'Нууц үг',
      name: 'Нэр',
      guestNameLabel: 'Зочны нэр',
      guestDesc: 'Бүртгэл үүсгэхгүйгээр шууд зочны нэрээр нэвтэрч, онооны самбарт өрсөлдөх боломжтой.',
      submitSignIn: 'Нэвтрэх',
      submitSignUp: 'Бүртгэл Үүсгэх',
      submitGuest: 'Зочноор Нэвтрэх',
      googleSignIn: 'Google-ээр нэвтрэх',
      googleNote: 'Ифрэймээс хамаарч Google нэвтрэлт ажиллахгүй бол зочноор нэвтэрнэ үү.',
      passwordPlaceholder: 'Нууц үгээ оруулна уу (хамгийн багадаа 6 тэмдэгт)',
      namePlaceholder: 'Өөрийн нэрээ оруулна уу',
      emailPlaceholder: 'И-мэйл хаягаа оруулна уу',
      errorGeneric: 'Алдаа гарлаа. Та дахин оролдоно уу.',
    },
    en: {
      title: 'Sign In / Sign Up',
      subtitle: 'Join Tsetsmunkh’s world and track your scores!',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      guest: 'Guest',
      email: 'Email Address',
      password: 'Password',
      name: 'Name',
      guestNameLabel: 'Guest Username',
      guestDesc: 'Enter a nickname to instantly play and save your high scores without a full registration.',
      submitSignIn: 'Sign In',
      submitSignUp: 'Create Account',
      submitGuest: 'Enter as Guest',
      googleSignIn: 'Sign In with Google',
      googleNote: 'If Google popup is blocked in the iframe preview, please use Guest or Email sign-in.',
      passwordPlaceholder: 'Enter your password (min. 6 characters)',
      namePlaceholder: 'Enter your name',
      emailPlaceholder: 'Enter your email',
      errorGeneric: 'An error occurred. Please try again.',
    }
  }[lang];

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'signin') {
        if (!email || !password) throw new Error(lang === 'mn' ? 'И-мэйл болон нууц үгээ оруулна уу.' : 'Please enter email and password.');
        await loginWithEmail(email, password);
      } else if (activeTab === 'signup') {
        if (!email || !password || !displayName) {
          throw new Error(lang === 'mn' ? 'Бүх талбарыг бөглөнө үү.' : 'Please fill out all fields.');
        }
        if (password.length < 6) {
          throw new Error(lang === 'mn' ? 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.' : 'Password must be at least 6 characters.');
        }
        await registerWithEmail(email, password, displayName);
      } else if (activeTab === 'guest') {
        if (!guestName.trim()) {
          throw new Error(lang === 'mn' ? 'Зочны нэрийг оруулна уу.' : 'Please enter a guest name.');
        }
        await loginAnonymously(guestName);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message || t.errorGeneric;
      
      // Map Firebase codes to friendly language
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMessage = lang === 'mn' ? 'И-мэйл эсвэл нууц үг буруу байна.' : 'Incorrect email or password.';
      } else if (err.code === 'auth/invalid-credential') {
        friendlyMessage = lang === 'mn' ? 'Нэвтрэх мэдээлэл буруу байна.' : 'Invalid sign in credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = lang === 'mn' ? 'Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн байна.' : 'This email is already in use.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = lang === 'mn' ? 'Нууц үг хэтэрхий богино байна.' : 'Password is too weak.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = lang === 'mn' ? 'Буруу и-мэйл хаяг байна.' : 'Invalid email address.';
      }

      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden z-10"
        >
          {/* Subtle accent glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#e8702a]/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e8702a]/20 to-orange-500/20 text-[#e8702a] border border-[#e8702a]/20 mb-3.5">
              {activeTab === 'guest' ? <Fingerprint size={24} /> : <LogIn size={24} />}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{t.title}</h2>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 gap-1 mb-6">
            {(['signin', 'signup', 'guest'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#e8702a] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'signin' ? t.signIn : tab === 'signup' ? t.signUp : t.guest}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-5 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <User size={14} className="text-[#e8702a]" />
                  {t.name}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.namePlaceholder}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e8702a] focus:ring-1 focus:ring-[#e8702a]/20 transition-all"
                />
              </div>
            )}

            {activeTab !== 'guest' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Mail size={14} className="text-[#e8702a]" />
                    {t.email}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e8702a] focus:ring-1 focus:ring-[#e8702a]/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Lock size={14} className="text-[#e8702a]" />
                    {t.password}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e8702a] focus:ring-1 focus:ring-[#e8702a]/20 transition-all"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-400 text-xs leading-relaxed bg-white/5 border border-white/5 p-3 rounded-xl">
                  {t.guestDesc}
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <User size={14} className="text-[#e8702a]" />
                    {t.guestNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Guest name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e8702a] focus:ring-1 focus:ring-[#e8702a]/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#e8702a] to-orange-600 text-white font-semibold py-3.5 rounded-xl hover:from-[#d2611f] hover:to-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-[#e8702a]/10 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {activeTab === 'signin' ? t.submitSignIn : activeTab === 'signup' ? t.submitSignUp : t.submitGuest}
                </>
              )}
            </button>
          </form>

          {/* Google login & separation */}
          {activeTab !== 'guest' && (
            <>
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">OR</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white text-zinc-900 font-semibold py-3.5 rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{t.googleSignIn}</span>
                </button>
                <div className="flex gap-1 items-start text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto text-center mt-1">
                  <Sparkles size={12} className="shrink-0 text-amber-500/60 mt-0.5 mx-auto" />
                  <p>{t.googleNote}</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
