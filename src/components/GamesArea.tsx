import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Heart, Timer, RotateCcw, Play, CheckCircle2, AlertTriangle, Sparkles, HelpCircle, Gamepad2, Compass, ArrowRight, Award, User, Check, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

// Web Audio API Synthesizer for high-quality, lightweight arcade game sound effects
function playSound(type: 'ding' | 'buzz' | 'swish' | 'brick') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'ding') {
      // High-pitched pleasant dual chime for correct answers
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.0, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);

    } else if (type === 'buzz') {
      // Low dual buzzing sound for mistakes / timeouts
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);
      
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      
      osc.start(now);
      osc.stop(now + 0.26);

    } else if (type === 'swish') {
      // Swoosh sound followed by a cheerful ping for scored basketball hoops
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.4);
      
    } else if (type === 'brick') {
      // Dull block thud for a missed shot
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.2);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (err) {
    console.warn('Web Audio synthesis not permitted by browser autoplay guidelines yet', err);
  }
}

interface Question {
  id: number;
  type?: string;
  questionMN?: string;
  questionEN?: string;
  emojis?: string;
  answer: string;
  options: string[];
  image?: string;
  video?: string;
}

const ANIME_TRIVIA_QUESTIONS: Question[] = [
  {
    id: 1,
    questionMN: "Naruto анимэний гол дүрийн хамгийн дуртай хоол юу вэ?",
    questionEN: "What is Naruto's favorite food in the Naruto anime?",
    options: ["Суши (Sushi)", "Рамэн (Ramen)", "Бургер (Burger)", "Такояки (Takoyaki)"],
    answer: "Рамэн (Ramen)",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQqd74f9BY40VnFFdvzQCOTxE-m3SeqS81BGXm2BsHQw&s=10",
    video: "2duK6O8uGk4"
  },
  {
    id: 2,
    questionMN: "One Piece анимэний гол дүр Luffy ямар чөтгөрийн жимс идсэн бэ?",
    questionEN: "Which Devil Fruit did Luffy eat in One Piece?",
    options: ["Mera Mera no Mi", "Gomu Gomu no Mi", "Ope Ope no Mi", "Hito Hito no Mi"],
    answer: "Gomu Gomu no Mi",
    image: "https://m.media-amazon.com/images/S/pv-target-images/1595dc2f5bd3654d3d263b4fce60780b118bb31ee3af7a9dc9c99f89ba415934._SX1080_FMjpg_.jpg",
    video: "M10XW0S_qZ0"
  },
  {
    id: 3,
    questionMN: "Demon Slayer анимэний гол дүрийг хэн гэдэг вэ?",
    questionEN: "What is the name of the main character in Demon Slayer?",
    options: ["Tanjiro Kamado", "Zenitsu Agatsuma", "Inosuke Hashibira", "Nezuko Kamado"],
    answer: "Tanjiro Kamado",
    image: "https://storage.ghost.io/c/2b/7f/2b7f69fc-a243-4d2f-ae8e-db8312c6653a/content/images/size/w1200/2025/10/Demon-Slayer-en-421-c-1.png",
    video: "pX899gZpBf8"
  },
  {
    id: 4,
    questionMN: "Death Note анимэний гол дүр Light Yagami-ийн үхлийн бурхан (Shinigami)-ийг хэн гэдэг вэ?",
    questionEN: "What is the name of Light Yagami's Shinigami in Death Note?",
    options: ["Rem", "Ryuk", "Sidoh", "Gelus"],
    answer: "Ryuk",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1bKYCuQ_o9NhMb-rS9eW-8dnYCB4-DmH_hRhABa5-Cg&s=10",
    video: "XdJj9nFdfW0"
  },
  {
    id: 5,
    questionMN: "Dragon Ball анимэний гол дүрийн Саяан (Saiyan) баатрыг хэн гэдэг вэ?",
    questionEN: "Who is the main Saiyan hero of Dragon Ball?",
    options: ["Vegeta", "Gohan", "Goku", "Trunks"],
    answer: "Goku",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd5BcDY3Z4RJQgKh7s0_X-wDhlhL-7ofLfrD-oWudcvQ&s=10",
    video: "O7L_A6K7_L4"
  },
  {
    id: 6,
    questionMN: "Attack on Titan анимэний гол дүр Eren Yeager анх ямар титан болж хувирдаг вэ?",
    questionEN: "What titan does Eren Yeager transform into in Attack on Titan?",
    options: ["Colossal Titan", "Attack Titan", "Armored Titan", "Beast Titan"],
    answer: "Attack Titan",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5dcxR3i6uybbb6m0fEV2F74NJv-eX42t08XxZ0dDqiw&s=10",
    video: "8OkpRKIP344"
  },
  {
    id: 7,
    questionMN: "Jujutsu Kaisen анимэний хамгийн хүчирхэг хараалч (Sorcerer)-ийг хэн гэдэг вэ?",
    questionEN: "Who is the strongest sorcerer in Jujutsu Kaisen?",
    options: ["Yuji Itadori", "Megumi Fushiguro", "Satoru Gojo", "Kento Nanami"],
    answer: "Satoru Gojo",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzDlw5A217c10ne53n7I2-B8i01gWUZArc_vqGDXDwcg&s=10",
    video: "1t_SMLIymSg"
  },
  {
    id: 8,
    questionMN: "Spirited Away анимэ киног найруулсан алдарт найруулагч хэн бэ?",
    questionEN: "Who directed the legendary anime movie Spirited Away?",
    options: ["Makoto Shinkai", "Hayao Miyazaki", "Mamoru Hosoda", "Satoshi Kon"],
    answer: "Hayao Miyazaki",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKr83uM8RZl2Hkh_e6Mk-4kgdScnv5X78K2RrzZ0WN-Q&s=10",
    video: "ByXuk9QqQkk"
  },
  {
    id: 9,
    questionMN: "My Hero Academia анимэний гол дүр Midoriya-ийн баатарлаг чадвар (Quirk) юу вэ?",
    questionEN: "What is the quirk of Midoriya in My Hero Academia?",
    options: ["One For All", "All For One", "Explosion", "Half-Cold Half-Hot"],
    answer: "One For All",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6R4qbLGU03ze2Tu1URPSqcklZGeQoZ7YJBKxPJPb4mA&s=10",
    video: "yM7Uv_oD9ic"
  },
  {
    id: 10,
    questionMN: "Hunter x Hunter анимэний гол дүр Gon-ийн хамгийн сайн найз хэн бэ?",
    questionEN: "Who is the best friend of Gon in Hunter x Hunter?",
    options: ["Kurapika", "Killua Zoldyck", "Leorio", "Hisoka"],
    answer: "Killua Zoldyck",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5Q9ewOIKkv8ncSRTEU9vZXZYr_RNP1iKJCINdo9jKJw&s=10",
    video: "faqmNMaz_S0"
  }
];

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1,
    emojis: "🦊🍥🍜🥋⚡",
    answer: "Naruto",
    options: ["My Hero Academia", "Naruto", "Dragon Ball", "Jujutsu Kaisen"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQqd74f9BY40VnFFdvzQCOTxE-m3SeqS81BGXm2BsHQw&s=10",
    video: "2duK6O8uGk4"
  },
  {
    id: 2,
    emojis: "🏴‍☠️👒🍖🌊⚔️",
    answer: "One Piece",
    options: ["One Piece", "Attack on Titan", "Hunter x Hunter", "Fairy Tail"],
    image: "https://m.media-amazon.com/images/S/pv-target-images/1595dc2f5bd3654d3d263b4fce60780b118bb31ee3af7a9dc9c99f89ba415934._SX1080_FMjpg_.jpg",
    video: "M10XW0S_qZ0"
  },
  {
    id: 3,
    emojis: "👹⚔️🐗⚡🌸",
    answer: "Demon Slayer",
    options: ["Bleach", "Demon Slayer", "Inuyasha", "Jujutsu Kaisen"],
    image: "https://storage.ghost.io/c/2b/7f/2b7f69fc-a243-4d2f-ae8e-db8312c6653a/content/images/size/w1200/2025/10/Demon-Slayer-en-421-c-1.png",
    video: "pX899gZpBf8"
  },
  {
    id: 4,
    emojis: "📓🍎🕵️‍♂️💀📓",
    answer: "Death Note",
    options: ["Code Geass", "Monster", "Death Note", "Tokyo Ghoul"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1bKYCuQ_o9NhMb-rS9eW-8dnYCB4-DmH_hRhABa5-Cg&s=10",
    video: "XdJj9nFdfW0"
  },
  {
    id: 5,
    emojis: "☄️🐒🥋🟡🐉",
    answer: "Dragon Ball",
    options: ["Dragon Ball", "Naruto", "One Punch Man", "Yu-Gi-Oh!"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd5BcDY3Z4RJQgKh7s0_X-wDhlhL-7ofLfrD-oWudcvQ&s=10",
    video: "O7L_A6K7_L4"
  },
  {
    id: 6,
    emojis: "🧱🦖🗡️🩸🕊️",
    answer: "Attack on Titan",
    options: ["Fullmetal Alchemist", "Attack on Titan", "Neon Genesis Evangelion", "Vinland Saga"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5dcxR3i6uybbb6m0fEV2F74NJv-eX42t08XxZ0dDqiw&s=10",
    video: "8OkpRKIP344"
  },
  {
    id: 7,
    emojis: "🏫🦸‍♂️💥🥦🔥",
    answer: "My Hero Academia",
    options: ["Assassination Classroom", "Mob Psycho 100", "My Hero Academia", "Black Clover"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6R4qbLGU03ze2Tu1URPSqcklZGeQoZ7YJBKxPJPb4mA&s=10",
    video: "yM7Uv_oD9ic"
  },
  {
    id: 8,
    emojis: "🤞🕶️😈🏫📿",
    answer: "Jujutsu Kaisen",
    options: ["Jujutsu Kaisen", "Chainsaw Man", "Bleach", "Tokyo Ghoul"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzDlw5A217c10ne53n7I2-B8i01gWUZArc_vqGDXDwcg&s=10",
    video: "1t_SMLIymSg"
  },
  {
    id: 9,
    emojis: "🎣⚡🐜🃏🎲",
    answer: "Hunter x Hunter",
    options: ["Yu Yu Hakusho", "Hunter x Hunter", "One Piece", "Fairy Tail"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5Q9ewOIKkv8ncSRTEU9vZXZYr_RNP1iKJCINdo9jKJw&s=10",
    video: "faqmNMaz_S0"
  },
  {
    id: 10,
    emojis: "🐖🐉🐉⛩️♨️",
    answer: "Spirited Away",
    options: ["My Neighbor Totoro", "Howl's Moving Castle", "Princess Mononoke", "Spirited Away"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKr83uM8RZl2Hkh_e6Mk-4kgdScnv5X78K2RrzZ0WN-Q&s=10",
    video: "ByXuk9QqQkk"
  }
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getYouTubeId = (urlOrId: string | undefined): string | null => {
  if (!urlOrId) return null;
  // If it's already just a 11-character alphanumeric ID, return it
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  try {
    // Try to parse as URL
    const url = new URL(urlOrId);
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v');
    }
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1);
    }
  } catch (e) {
    // Fallback regex if URL parsing fails
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
  }
  return null;
};

export default function GamesArea() {
  const [lang, setLang] = useState<'mn' | 'en'>('mn');
  const [activeGame, setActiveGame] = useState<'none' | 'anime' | 'anime-emoji' | 'anime-character' | 'basketball'>('none');

  // Leaderboard & Persistent states
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard'>('games');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');
  const [sessionAnswers, setSessionAnswers] = useState<{ question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]>([]);
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [leaderboardScores, setLeaderboardScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);

  // Load questions from data.json or fallback
  const [questions, setQuestions] = useState<Question[]>(FALLBACK_QUESTIONS);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetch('/data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load data.json, using fallback emoji questions:', err);
      });
  }, []);

  // Anime Guesser Game States
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'gameover' | 'victory'>('welcome');
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [emojiHighScore, setEmojiHighScore] = useState(0);
  const [characterHighScore, setCharacterHighScore] = useState(0);
  const [showBonusNotification, setShowBonusNotification] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  // Basketball Mini Game States (Bonus sport themed game matching Tsetsmunkh's hobbies!)
  const [bbScore, setBbScore] = useState(0);
  const [bbHighScore, setBbHighScore] = useState(0);
  const [ballPos, setBallPos] = useState({ x: 50, y: 80 });
  const [ballState, setBallState] = useState<'idle' | 'shooting' | 'scored' | 'missed'>('idle');
  const [bbMessage, setBbMessage] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load High Scores
  useEffect(() => {
    const savedAnimeHS = localStorage.getItem('anime_guesser_high_score');
    if (savedAnimeHS) setHighScore(parseInt(savedAnimeHS));

    const savedEmojiHS = localStorage.getItem('anime_emoji_high_score');
    if (savedEmojiHS) setEmojiHighScore(parseInt(savedEmojiHS));

    const savedCharHS = localStorage.getItem('anime_character_high_score');
    if (savedCharHS) setCharacterHighScore(parseInt(savedCharHS));

    const savedBbHS = localStorage.getItem('basketball_high_score');
    if (savedBbHS) setBbHighScore(parseInt(savedBbHS));
  }, []);

  // Get current game's question list
  const getActiveQuestionsList = () => {
    if (activeQuestions.length > 0) return activeQuestions;
    if (activeGame === 'anime') return ANIME_TRIVIA_QUESTIONS;
    if (activeGame === 'anime-emoji') {
      return questions.filter((q) => q.type === 'emoji' || !q.type);
    }
    if (activeGame === 'anime-character') {
      return questions.filter((q) => q.type === 'character');
    }
    return questions;
  };

  const fetchLeaderboard = async () => {
    setLoadingScores(true);
    try {
      const scoresCol = collection(db, 'scores');
      const q = query(scoresCol, orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setLeaderboardScores(fetched);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoadingScores(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    setSavingScore(true);
    try {
      const scoresCol = collection(db, 'scores');
      await addDoc(scoresCol, {
        playerName: playerName.trim(),
        score: score,
        gameType: activeGame,
        answers: sessionAnswers,
        createdAt: serverTimestamp(),
      });
      setScoreSaved(true);
      localStorage.setItem('player_name', playerName.trim());
      fetchLeaderboard();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    } finally {
      setSavingScore(false);
    }
  };

  const recordAnswer = (userAnswer: string, isAnswerCorrect: boolean) => {
    const activeList = getActiveQuestionsList();
    const currentQ = activeList[currentQIdx];
    if (!currentQ) return;
    
    let questionText = '';
    if (activeGame === 'anime-emoji') {
      questionText = `${lang === 'mn' ? 'Эможи таавар' : 'Emoji Guess'}: ${currentQ.emojis}`;
    } else if (activeGame === 'anime-character') {
      questionText = `${lang === 'mn' ? 'Баатрын зураг таах' : 'Character Image Guess'}`;
    } else {
      questionText = lang === 'mn' ? (currentQ.questionMN || '') : (currentQ.questionEN || '');
    }

    setSessionAnswers((prev) => [
      ...prev,
      {
        question: questionText,
        userAnswer,
        correctAnswer: currentQ.answer,
        isCorrect: isAnswerCorrect,
      },
    ]);
  };

  // Anime Guesser Timer Effect
  useEffect(() => {
    if ((activeGame === 'anime' || activeGame === 'anime-emoji' || activeGame === 'anime-character') && gameState === 'playing' && selectedAnswer === null) {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        // Time ran out! Counted as wrong answer
        handleTimeout();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState, activeGame, selectedAnswer]);

  const handleTimeout = () => {
    setIsCorrect(false);
    setSelectedAnswer(''); // Empty string represents timeout/no answer
    setStreak(0);
    const newLives = lives - 1;
    setLives(newLives);
    playSound('buzz');
    recordAnswer(lang === 'mn' ? 'Хугацаа дууссан' : 'Timeout', false);

    if (newLives <= 0) {
      setTimeout(() => {
        setGameState('gameover');
        updateAnimeHighScore(score);
      }, 1500);
    } else {
      setShowReveal(true);
    }
  };

  const updateAnimeHighScore = (finalScore: number) => {
    if (activeGame === 'anime') {
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('anime_guesser_high_score', finalScore.toString());
      }
    } else if (activeGame === 'anime-emoji') {
      if (finalScore > emojiHighScore) {
        setEmojiHighScore(finalScore);
        localStorage.setItem('anime_emoji_high_score', finalScore.toString());
      }
    } else if (activeGame === 'anime-character') {
      if (finalScore > characterHighScore) {
        setCharacterHighScore(finalScore);
        localStorage.setItem('anime_character_high_score', finalScore.toString());
      }
    }
  };

  const startAnimeGame = (gameType?: 'anime' | 'anime-emoji' | 'anime-character') => {
    const targetGame = gameType || activeGame;
    const finalGame = (targetGame === 'anime' || targetGame === 'anime-emoji' || targetGame === 'anime-character') ? targetGame : 'anime';
    
    let rawList: Question[] = [];
    if (finalGame === 'anime') {
      rawList = ANIME_TRIVIA_QUESTIONS;
    } else if (finalGame === 'anime-emoji') {
      rawList = questions.filter((q) => q.type === 'emoji' || !q.type);
    } else if (finalGame === 'anime-character') {
      rawList = questions.filter((q) => q.type === 'character');
    }

    const shuffled = shuffleArray(rawList);
    setActiveQuestions(shuffled);

    setGameState('playing');
    setCurrentQIdx(0);
    setScore(0);
    setLives(3);
    setStreak(0);
    setTimeLeft(15);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowBonusNotification(false);
    setShowReveal(false);
    setSessionAnswers([]); // reset answers for the new session
    setScoreSaved(false); // reset score saved state
  };

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedAnswer(option);

    const activeList = getActiveQuestionsList();
    const isAnsCorrect = option === activeList[currentQIdx].answer;
    setIsCorrect(isAnsCorrect);
    recordAnswer(option, isAnsCorrect);

    if (isAnsCorrect) {
      playSound('ding');
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      let pointsGained = 10;

      // Rule: 3 correct answers in a row gives bonus +20 points
      if (nextStreak % 3 === 0) {
        pointsGained += 20;
        setShowBonusNotification(true);
        setTimeout(() => setShowBonusNotification(false), 2000);
      }

      setScore((prev) => prev + pointsGained);
      setShowReveal(true);
    } else {
      playSound('buzz');
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setTimeout(() => {
          setGameState('gameover');
          updateAnimeHighScore(score);
        }, 1500);
      } else {
        setShowReveal(true);
      }
    }
  };

  const goToNextQuestion = () => {
    setCurrentQIdx((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeLeft(15);
    setShowReveal(false);
  };

  const handleNextClick = () => {
    const activeList = getActiveQuestionsList();
    if (currentQIdx === activeList.length - 1) {
      setGameState('victory');
      const finalScore = score;
      updateAnimeHighScore(finalScore);
      setShowReveal(false);
    } else {
      goToNextQuestion();
    }
  };

  // Basketball micro game logic
  const startBasketballGame = () => {
    setBbScore(0);
    setBallState('idle');
    setBallPos({ x: 50, y: 80 });
    setBbMessage(lang === 'mn' ? 'Бөмбөгийг чирэх эсвэл товшиж шиднэ үү! 🏀' : 'Click or Tap to shoot the ball! 🏀');
  };

  const shootBasketball = () => {
    if (ballState !== 'idle') return;
    setBallState('shooting');
    setBbMessage(lang === 'mn' ? 'Нисэж байна...' : 'Flying...');

    // Simulate physics shooting towards the hoop (hoop center is around x=50, y=15)
    // Randomize whether it goes in or misses
    const accuracy = Math.random();
    const isGoal = accuracy > 0.35; // 65% chance of scoring

    setTimeout(() => {
      if (isGoal) {
        playSound('swish');
        setBallPos({ x: 50, y: 15 });
        setBallState('scored');
        const newScore = bbScore + 1;
        setBbScore(newScore);
        if (newScore > bbHighScore) {
          setBbHighScore(newScore);
          localStorage.setItem('basketball_high_score', newScore.toString());
        }
        setBbMessage(lang === 'mn' ? 'ГООЛ! +1 Оноо! 🎉🏀' : 'SWISH! +1 Point! 🎉🏀');
      } else {
        playSound('brick');
        // Random miss position
        const missX = Math.random() > 0.5 ? 25 : 75;
        setBallPos({ x: missX, y: 30 });
        setBallState('missed');
        setBbMessage(lang === 'mn' ? 'АЛДЛАА! Дахин оролдоорой! ❌🏀' : 'MISSED! Try again! ❌🏀');
      }

      // Reset to idle
      setTimeout(() => {
        setBallPos({ x: 50, y: 80 });
        setBallState('idle');
      }, 1500);
    }, 800);
  };

  return (
    <section
      id="lithos-games-section"
      className="relative w-full bg-zinc-950 text-white py-24 px-6 md:px-12 border-t border-zinc-900 overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e8702a]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[#e8702a] text-xs font-mono uppercase tracking-widest mb-3">
              <Gamepad2 size={16} className="animate-pulse" />
              <span>Lithos Arcade & Games</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair italic font-medium leading-tight">
              {lang === 'mn' ? 'Тоглоомын Төв' : 'Games Hub'}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mt-3 font-light">
              {lang === 'mn' 
                ? 'Хэдийгээр Цэцмөнх анимэ үздэггүй ч найзууддаа зориулан энэхүү хөгжилтэй "Anime Guesser" тоглоомыг бэлтгэлээ! Мөн түүний дуртай спорт болох сагсан бөмбөгийг ч хамт тоглож болно.'
                : 'Even though Tsetsmunkh doesn’t watch anime, he made this exciting "Anime Guesser" game for friends! You can also shoot some hoops in his favorite basketball game.'}
            </p>
          </div>

          {/* Local language switcher */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-full self-start md:self-end">
            <button
              onClick={() => setLang('mn')}
              className={`relative px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                lang === 'mn' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {lang === 'mn' && (
                <motion.div
                  layoutId="activeGameLangTab"
                  className="absolute inset-0 bg-[#e8702a] rounded-full z-[-1]"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              Монгол
            </button>
            <button
              onClick={() => setLang('en')}
              className={`relative px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                lang === 'en' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {lang === 'en' && (
                <motion.div
                  layoutId="activeGameLangTab"
                  className="absolute inset-0 bg-[#e8702a] rounded-full z-[-1]"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              English
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        {activeGame === 'none' && (
          <div className="flex border-b border-zinc-900 mb-8 space-x-6">
            <button
              onClick={() => setActiveTab('games')}
              className={`pb-4 text-sm font-semibold tracking-wide uppercase transition-all duration-300 border-b-2 relative cursor-pointer ${
                activeTab === 'games' ? 'text-[#e8702a] border-[#e8702a]' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {lang === 'mn' ? '🎮 Тоглоомууд' : '🎮 Games'}
            </button>
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                fetchLeaderboard();
              }}
              className={`pb-4 text-sm font-semibold tracking-wide uppercase transition-all duration-300 border-b-2 relative cursor-pointer ${
                activeTab === 'leaderboard' ? 'text-[#e8702a] border-[#e8702a]' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {lang === 'mn' ? '🏆 ТОП 10 Оноо' : '🏆 TOP 10 Leaderboard'}
            </button>
          </div>
        )}

        {/* Game Selection Cards or Active Game Container */}
        {activeGame === 'none' ? (
          activeTab === 'leaderboard' ? (
            <div id="leaderboard-container" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-[#e8702a] to-amber-500" />
              
              <div className="pl-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-500" size={24} />
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {lang === 'mn' ? 'ТОП 10 Тоглогчид' : 'TOP 10 Leaderboard'}
                    </h3>
                  </div>
                  <button
                    onClick={fetchLeaderboard}
                    disabled={loadingScores}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
                  >
                    <RotateCcw size={12} className={loadingScores ? "animate-spin" : ""} />
                    {lang === 'mn' ? 'Шинэчлэх' : 'Refresh'}
                  </button>
                </div>

                {loadingScores ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 size={36} className="text-[#e8702a] animate-spin" />
                    <p className="text-xs text-zinc-500 font-mono tracking-wider">
                      {lang === 'mn' ? 'АЧААЛЖ БАЙНА...' : 'RETRIEVING LEADERBOARD...'}
                    </p>
                  </div>
                ) : leaderboardScores.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <div className="text-4xl">🏆</div>
                    <p className="text-sm font-semibold text-zinc-400">
                      {lang === 'mn' ? 'Одоогоор оноо бүртгэгдээгүй байна' : 'No records yet'}
                    </p>
                    <p className="text-xs text-zinc-600 max-w-xs mx-auto">
                      {lang === 'mn' ? 'Эхний тоглогч болж аниме таах тоглоом тоглоод оноогоо хадгалаарай!' : 'Be the first to submit a high score by playing the anime guessing game!'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          <th className="pb-3 pl-2 w-16">{lang === 'mn' ? 'Байр' : 'Rank'}</th>
                          <th className="pb-3">{lang === 'mn' ? 'Тоглогч' : 'Player'}</th>
                          <th className="pb-3">{lang === 'mn' ? 'Төрөл' : 'Mode'}</th>
                          <th className="pb-3 text-right">{lang === 'mn' ? 'Оноо' : 'Score'}</th>
                          <th className="pb-3 text-right pr-2 w-28">{lang === 'mn' ? 'Огноо' : 'Date'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {leaderboardScores.map((scoreDoc, index) => {
                          const rank = index + 1;
                          let rankBadge = "text-zinc-400";
                          if (rank === 1) rankBadge = "text-yellow-500 font-bold text-base flex items-center justify-center bg-yellow-500/10 rounded-full w-7 h-7 border border-yellow-500/20";
                          else if (rank === 2) rankBadge = "text-zinc-300 font-bold text-sm flex items-center justify-center bg-zinc-300/10 rounded-full w-7 h-7 border border-zinc-300/20";
                          else if (rank === 3) rankBadge = "text-amber-600 font-bold text-xs flex items-center justify-center bg-amber-600/10 rounded-full w-7 h-7 border border-amber-600/20";
                          else rankBadge = "text-zinc-500 font-mono text-xs flex items-center justify-center w-7 h-7";

                          const gameModeName = scoreDoc.gameType === 'anime-emoji' 
                            ? (lang === 'mn' ? '🧩 Эможи' : '🧩 Emoji')
                            : scoreDoc.gameType === 'anime-character'
                            ? (lang === 'mn' ? '🦸‍♂️ Баатар' : '🦸‍♂️ Character')
                            : (lang === 'mn' ? '📚 Тривиа' : '📚 Trivia');

                          let dateStr = '';
                          if (scoreDoc.createdAt) {
                            try {
                              const date = scoreDoc.createdAt.seconds 
                                ? new Date(scoreDoc.createdAt.seconds * 1000) 
                                : new Date(scoreDoc.createdAt);
                              dateStr = date.toLocaleDateString(lang === 'mn' ? 'mn-MN' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              dateStr = 'N/A';
                            }
                          }

                          const hasAnswers = scoreDoc.answers && scoreDoc.answers.length > 0;
                          const isExpanded = expandedScoreId === scoreDoc.id;

                          return (
                            <Fragment key={scoreDoc.id}>
                              <tr 
                                onClick={() => hasAnswers && setExpandedScoreId(isExpanded ? null : scoreDoc.id)}
                                className={`group text-sm hover:bg-zinc-800/30 transition-all duration-200 cursor-pointer ${
                                  isExpanded ? 'bg-zinc-800/20' : ''
                                }`}
                              >
                                <td className="py-4 pl-2">
                                  <div className="flex items-center">
                                    <span className={rankBadge}>{rank}</span>
                                  </div>
                                </td>
                                <td className="py-4 font-semibold text-white group-hover:text-[#e8702a] transition-colors">
                                  <div className="flex items-center space-x-2">
                                    <span>{scoreDoc.playerName}</span>
                                    {hasAnswers && (
                                      <span className="text-[9px] text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800/60 bg-zinc-950 font-light group-hover:border-[#e8702a]/30 group-hover:text-zinc-400 transition-colors">
                                        {isExpanded ? (lang === 'mn' ? 'Хураах' : 'Hide') : (lang === 'mn' ? 'Дэлгэрэнгүй' : 'Answers')}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 text-zinc-400 text-xs">
                                  {gameModeName}
                                </td>
                                <td className="py-4 text-right font-mono font-bold text-[#e8702a] text-base">
                                  {scoreDoc.score}
                                </td>
                                <td className="py-4 text-right pr-2 text-xs text-zinc-500 font-light">
                                  {dateStr}
                                </td>
                              </tr>
                              
                              {/* Expandable row for details */}
                              {isExpanded && hasAnswers && (
                                <tr>
                                  <td colSpan={5} className="p-0 border-none">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="bg-zinc-950/60 p-4 border-l-2 border-r-2 border-zinc-800/40 rounded-b-xl"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-[10px] font-mono text-[#e8702a] uppercase tracking-wider">
                                          {lang === 'mn' ? 'Хариултын дэлгэрэнгүй:' : 'Session Summary:'}
                                        </h5>
                                        <span className="text-[9px] text-zinc-600 font-mono">
                                          {scoreDoc.answers.filter((a: any) => a.isCorrect).length} / {scoreDoc.answers.length} {lang === 'mn' ? 'Зөв' : 'Correct'}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        {scoreDoc.answers.map((ans: any, idx: number) => (
                                          <div key={idx} className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-xl flex items-start space-x-3 text-xs">
                                            <div className={`mt-0.5 rounded-full p-1 flex-shrink-0 flex items-center justify-center ${
                                              ans.isCorrect ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`} style={{ width: '18px', height: '18px' }}>
                                              {ans.isCorrect ? (
                                                <span className="text-[10px] font-bold">✓</span>
                                              ) : (
                                                <span className="text-[10px] font-bold">✕</span>
                                              )}
                                            </div>
                                            <div className="space-y-1 overflow-hidden">
                                              <p className="text-zinc-300 font-medium truncate">{ans.question}</p>
                                              <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                                                <span>{lang === 'mn' ? 'Сонгосон:' : 'Picked:'}</span>
                                                <span className={ans.isCorrect ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{ans.userAnswer || 'N/A'}</span>
                                              </div>
                                              {!ans.isCorrect && (
                                                <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                                                  <span>{lang === 'mn' ? 'Зөв хариулт:' : 'Correct:'}</span>
                                                  <span className="text-green-400 font-medium">{ans.correctAnswer}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div id="games-selection-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-6">
            
            {/* Game 1 Card: Anime Guesser */}
            <motion.div
              id="anime-guesser-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-2 border-zinc-800 hover:border-[#e8702a]/60 rounded-3xl p-8 flex flex-col justify-between h-96 relative overflow-hidden group shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#e8702a]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#e8702a]/20 transition-all duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#e8702a]/10 border border-[#e8702a]/30 flex items-center justify-center text-[#e8702a] font-bold">
                    AT
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full">
                    {lang === 'mn' ? 'АНИМЕ ТРИВИА' : 'ANIME TRIVIA'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#e8702a] transition-colors">
                  Anime Trivia Guesser
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mb-4 line-clamp-3">
                  {lang === 'mn'
                    ? 'Асуултанд 15 секундад зөв хариулж оноо цуглуул. Дараалан 3 зөв хариулбал +20 онооны бонус! Гэхдээ чамд ердөө 3 амь байгаа шүү.'
                    : 'Answer text-based anime trivia questions correctly within 15 seconds. Get 3 streak for a +20 bonus! You only have 3 lives.'}
                </p>

                {/* Score badge */}
                <div className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 mt-2">
                  <Trophy size={14} className="text-yellow-500" />
                  <span>{lang === 'mn' ? 'Дээд оноо:' : 'High Score:'} <strong className="text-zinc-300">{highScore}</strong></span>
                </div>
              </div>

              <button
                id="btn-play-anime"
                onClick={() => {
                  setActiveGame('anime');
                  startAnimeGame('anime');
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-[#e8702a] to-[#ff8c42] hover:from-[#d2611f] hover:to-[#e8702a] text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.01]"
              >
                <Play size={14} fill="currentColor" />
                {lang === 'mn' ? 'Тривиа Тоглох' : 'Play Trivia'}
              </button>
            </motion.div>

            {/* Game 2 Card: Anime Emoji Guesser */}
            <motion.div
              id="anime-emoji-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-2 border-zinc-800 hover:border-yellow-500/60 rounded-3xl p-8 flex flex-col justify-between h-96 relative overflow-hidden group shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-yellow-500/20 transition-all duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 text-xl font-bold">
                    🔮
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">
                    {lang === 'mn' ? 'ШИНЭ ЭМОЖИ' : 'NEW EMOJI'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-500 transition-colors">
                  Anime Emoji Guesser
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mb-4 line-clamp-3">
                  {lang === 'mn'
                    ? 'Анимег илэрхийлсэн эможиг ашиглан таагаарай! data.json файлаас динамикаар уншдаг. Дараалсан 3 зөв хариултанд бонус оноотой!'
                    : 'Guess the anime from creative emoji combinations loaded dynamically from data.json. Includes streak bonuses and live counters!'}
                </p>

                {/* Score badge */}
                <div className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 mt-2">
                  <Trophy size={14} className="text-yellow-500" />
                  <span>{lang === 'mn' ? 'Дээд оноо:' : 'High Score:'} <strong className="text-zinc-300">{emojiHighScore}</strong></span>
                </div>
              </div>

              <button
                id="btn-play-anime-emoji"
                onClick={() => {
                  setActiveGame('anime-emoji');
                  startAnimeGame('anime-emoji');
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.01]"
              >
                <Play size={14} fill="currentColor" />
                {lang === 'mn' ? 'Эможи Тоглох' : 'Play Emoji Quiz'}
              </button>
            </motion.div>

            {/* Game 3 Card: Anime Character Guesser */}
            <motion.div
              id="anime-character-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-2 border-zinc-800 hover:border-purple-500/60 rounded-3xl p-8 flex flex-col justify-between h-96 relative overflow-hidden group shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl font-bold">
                    🦸‍♂️
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                    {lang === 'mn' ? 'ШИНЭ БААТАР' : 'NEW HERO'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  Character Guesser
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mb-4 line-clamp-3">
                  {lang === 'mn'
                    ? 'Luffy, Naruto, Tanjiro, Goku зэрэг анимэ баатруудын зургийг хараад хэн болохыг нь 4 сонголтоос зөв таагаарай!'
                    : 'Guess the name of famous anime heroes like Luffy, Naruto, Tanjiro, Goku and others from 4 choices!'}
                </p>

                {/* Score badge */}
                <div className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 mt-2">
                  <Trophy size={14} className="text-yellow-500" />
                  <span>{lang === 'mn' ? 'Дээд оноо:' : 'High Score:'} <strong className="text-zinc-300">{characterHighScore}</strong></span>
                </div>
              </div>

              <button
                id="btn-play-anime-character"
                onClick={() => {
                  setActiveGame('anime-character');
                  startAnimeGame('anime-character');
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.01]"
              >
                <Play size={14} fill="currentColor" />
                {lang === 'mn' ? 'Баатруудыг Таах' : 'Play Characters'}
              </button>
            </motion.div>

            {/* Game 3 Card: Basketball Shootout */}
            <motion.div
              id="basketball-shootout-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-[#e8702a]/30 rounded-3xl p-8 flex flex-col justify-between h-96 relative overflow-hidden group shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                    🏀
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
                    {lang === 'mn' ? 'СПОРТ СУРГУУЛИЛТ' : 'SPORTS MINI'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  Basketball Shootout
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mb-4 line-clamp-3">
                  {lang === 'mn'
                    ? 'Цэцмөнхийн хамгийн дуртай спорт болох сагсан бөмбөгийн цагираг руу шид. Дараалан гоолдож дээд амжилтаа шинэчлээрэй!'
                    : 'Shoot hoops in Tsetsmunkh’s favorite basketball game. Score consecutive baskets to build up a high score!'}
                </p>

                {/* Score badge */}
                <div className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 mt-2">
                  <Trophy size={14} className="text-yellow-500" />
                  <span>{lang === 'mn' ? 'Дээд амжилт:' : 'Best Streak:'} <strong className="text-zinc-300">{bbHighScore}</strong></span>
                </div>
              </div>

              <button
                id="btn-play-basketball"
                onClick={() => {
                  setActiveGame('basketball');
                  startBasketballGame();
                }}
                className="w-full mt-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-[#e8702a]/30 rounded-xl font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" />
                {lang === 'mn' ? 'Сургуулилт хийх' : 'Practice Hoops'}
              </button>
            </motion.div>

          </div>
          )
        ) : (activeGame === 'anime' || activeGame === 'anime-emoji' || activeGame === 'anime-character') ? (() => {
          const activeList = getActiveQuestionsList();
          const isEmojiMode = activeGame === 'anime-emoji';
          const isCharacterMode = activeGame === 'anime-character';
          const activeHighScore = isEmojiMode ? emojiHighScore : isCharacterMode ? characterHighScore : highScore;
          const gameTitleMN = isEmojiMode ? 'Аниме Эможи Таавар' : isCharacterMode ? 'Баатрын Дүр Таах' : 'Аниме Тривиа Асуулт';
          const gameTitleEN = isEmojiMode ? 'Anime Emoji Guesser' : isCharacterMode ? 'Guess the Character' : 'Anime Trivia Guesser';

          return (
            /* Anime Guesser Console Container */
            <div id="anime-game-console" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
              {/* Decorative sidebar indicating game style */}
              <div className={`absolute top-0 bottom-0 left-0 w-2 ${
                isEmojiMode 
                  ? 'bg-gradient-to-b from-yellow-500 via-amber-500 to-orange-600' 
                  : isCharacterMode
                  ? 'bg-gradient-to-b from-purple-500 via-fuchsia-500 to-indigo-600'
                  : 'bg-gradient-to-b from-[#e8702a] via-[#991b1b] to-[#1e3a8a]'
              }`} />

              <div className="pl-4 flex flex-col">
                
                {/* Game Play Top Dashboard */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-mono font-bold tracking-wider uppercase ${
                      isEmojiMode ? 'text-yellow-500' : isCharacterMode ? 'text-purple-400' : 'text-[#e8702a]'
                    }`}>
                      {lang === 'mn' ? gameTitleMN : gameTitleEN}
                    </span>
                    <div className="flex bg-zinc-950 px-3 py-1 rounded-full items-center gap-1.5 border border-zinc-800">
                      <Trophy size={14} className="text-yellow-500" />
                      <span className="text-xs text-zinc-400 font-mono">
                        HighScore: <strong className="text-white">{activeHighScore}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-back-to-lobby-anime"
                    onClick={() => setActiveGame('none')}
                    className="text-xs text-zinc-500 hover:text-white transition-colors uppercase font-mono tracking-wider border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800"
                  >
                    {lang === 'mn' ? 'Гарах' : 'Exit Lobby'}
                  </button>
                </div>

                {/* Game State Conditional Rendering */}
                {gameState === 'playing' && (
                  <div className="space-y-6">
                    {/* Hearts, Streak, Score, Timer Header */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl items-center">
                      
                      {/* Lives (Hearts) */}
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {lang === 'mn' ? 'Амь' : 'Lives'}
                        </span>
                        <div className="flex gap-1.5 mt-0.5">
                          {[1, 2, 3].map((heartNum) => (
                            <Heart
                              key={heartNum}
                              size={18}
                              className={`${
                                heartNum <= lives
                                  ? 'text-red-500 fill-red-500 animate-pulse'
                                  : 'text-zinc-800 fill-zinc-900'
                              } transition-colors duration-300`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Streak (Streak Flame) */}
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {lang === 'mn' ? 'Дараалсан' : 'Streak'}
                        </span>
                        <div className="flex items-center gap-1 text-orange-400 font-bold text-sm">
                          <Flame size={16} className={streak > 0 ? 'animate-bounce' : ''} />
                          <span className="font-mono">x{streak}</span>
                        </div>
                      </div>

                      {/* Points Gained */}
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {lang === 'mn' ? 'Оноо' : 'Points'}
                        </span>
                        <p className="font-mono font-bold text-white text-lg leading-none mt-0.5">
                          {score} <span className="text-xs font-normal text-zinc-500">pts</span>
                        </p>
                      </div>

                      {/* Circular Timer representation */}
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {lang === 'mn' ? 'Хугацаа' : 'Timer'}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-sm mt-0.5">
                          <Timer size={16} className={`${timeLeft <= 5 ? 'text-red-500 animate-spin-slow' : 'text-zinc-400'}`} />
                          <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500 text-lg' : 'text-white'}`}>
                            {timeLeft}s
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Bonus Notification Animation banner */}
                    <AnimatePresence>
                      {showBonusNotification && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs py-2 px-4 rounded-xl text-center font-semibold flex items-center justify-center gap-2"
                        >
                          <Sparkles size={14} className="animate-spin-slow" />
                          <span>{lang === 'mn' ? 'Гайхалтай! Дараалсан 3 зөв хариулт! Bonus +20 оноо!' : 'Incredible! 3 correct answers streak! Bonus +20 points!'}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Question and Options Area with smooth slide/fade transition */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="space-y-6"
                      >
                        {/* Question Prompt Card */}
                        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-inner relative overflow-hidden text-center flex flex-col items-center justify-center space-y-4 min-h-[180px]">
                          <div className="absolute top-2 right-3 text-zinc-700 font-mono text-[10px]">
                            Q {currentQIdx + 1} / {activeList.length}
                          </div>

                          {isEmojiMode ? (
                            <>
                              <div className="text-5xl sm:text-6xl tracking-widest animate-pulse select-none mb-2 filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.2)]">
                                {activeList[currentQIdx]?.emojis}
                              </div>
                              <h4 className="text-zinc-300 text-sm sm:text-base font-medium leading-relaxed">
                                {lang === 'mn' ? 'Эдгээр эможи аль алдартай анимег илэрхийлж байна вэ?' : 'Which famous anime do these emojis represent?'}
                              </h4>
                            </>
                          ) : isCharacterMode ? (
                            <>
                              {activeList[currentQIdx]?.image && (
                                <div className="relative group">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300 animate-pulse-slow"></div>
                                  <img 
                                    src={activeList[currentQIdx]?.image} 
                                    className="relative w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-2xl border border-zinc-800 shadow-xl select-none" 
                                    alt="character" 
                                    referrerPolicy="no-referrer" 
                                  />
                                </div>
                              )}
                              <h4 className="text-zinc-300 text-sm sm:text-base font-medium leading-relaxed">
                                {lang === 'mn' ? 'Зураг дээрх анимений баатар хэн бэ?' : 'Who is the anime character in the picture?'}
                              </h4>
                            </>
                          ) : (
                            <h4 className="text-white text-base sm:text-xl font-medium leading-relaxed max-w-[90%] font-sans py-4">
                              {lang === 'mn' ? activeList[currentQIdx]?.questionMN : activeList[currentQIdx]?.questionEN}
                            </h4>
                          )}
                        </div>

                        {/* Options List (4 selections) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {activeList[currentQIdx]?.options.map((option) => {
                            const isSelected = selectedAnswer === option;
                            const isCorrectAnswer = option === activeList[currentQIdx]?.answer;
                            let buttonStyle = "bg-zinc-950 border-zinc-800 text-white hover:border-zinc-600";

                            if (selectedAnswer !== null) {
                              if (isSelected) {
                                buttonStyle = isCorrectAnswer 
                                  ? "bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/10" 
                                  : "bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/10";
                              } else if (isCorrectAnswer) {
                                // Show what the correct answer was on error
                                buttonStyle = "bg-green-500/10 border-green-500/40 text-green-400/80";
                              } else {
                                buttonStyle = "bg-zinc-950/20 border-zinc-900/60 text-zinc-600 cursor-not-allowed";
                              }
                            }

                            return (
                              <motion.button
                                key={option}
                                disabled={selectedAnswer !== null}
                                onClick={() => handleAnswerSelect(option)}
                                whileHover={selectedAnswer === null ? {
                                  scale: 1.03,
                                  boxShadow: isEmojiMode ? "0 0 15px rgba(234, 179, 8, 0.15)" : isCharacterMode ? "0 0 15px rgba(168, 85, 247, 0.15)" : "0 0 15px rgba(232, 112, 42, 0.15)",
                                  borderColor: isEmojiMode ? "rgba(234, 179, 8, 0.5)" : isCharacterMode ? "rgba(168, 85, 247, 0.5)" : "rgba(232, 112, 42, 0.5)",
                                  backgroundColor: "rgba(24, 24, 27, 0.8)"
                                } : {}}
                                whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                                animate={isSelected && !isCorrectAnswer ? {
                                  x: [-8, 8, -6, 6, -4, 4, 0]
                                } : isSelected && isCorrectAnswer ? {
                                  scale: [1, 1.04, 1]
                                } : {}}
                                transition={{
                                  x: { type: "spring", stiffness: 400, damping: 15 },
                                  scale: { duration: 0.25 }
                                }}
                                className={`w-full py-4 px-5 rounded-xl border text-left text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${buttonStyle}`}
                              >
                                <span>{option}</span>
                                {selectedAnswer !== null && isCorrectAnswer && (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                )}
                                {selectedAnswer !== null && isSelected && !isCorrectAnswer && (
                                  <AlertTriangle size={16} className="text-red-500" />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Beautiful Media Reveal Panel for correct or incorrect answers */}
                        {showReveal && (
                          <motion.div
                            id="anime-media-reveal"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-5 sm:p-6 bg-zinc-950 border-2 rounded-2xl space-y-5 ${
                              isCorrect 
                                ? 'border-emerald-500/30' 
                                : 'border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                              <div className={`flex items-center gap-2 font-bold text-xs sm:text-sm ${
                                isCorrect ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {isCorrect ? (
                                  <Sparkles size={16} className="animate-pulse" />
                                ) : (
                                  <AlertTriangle size={16} className="animate-pulse" />
                                )}
                                <span className="uppercase tracking-wider">
                                  {isCorrect 
                                    ? (lang === 'mn' ? 'Зөв хариуллаа! 🎉' : 'Correct Answer! 🎉')
                                    : (lang === 'mn' ? 'Буруу хариуллаа! 😢' : 'Incorrect Answer! 😢')
                                  }
                                </span>
                              </div>
                              <span className={`text-[10px] sm:text-xs font-mono border px-2.5 py-0.5 rounded-full ${
                                isCorrect 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {activeList[currentQIdx]?.answer}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                              {/* Anime High Quality Image */}
                              {activeList[currentQIdx]?.image && (
                                <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-md aspect-video h-full min-h-[140px] bg-zinc-900 flex items-center justify-center">
                                  <img
                                    src={activeList[currentQIdx].image}
                                    alt={activeList[currentQIdx].answer}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              )}

                              {/* YouTube Video iframe */}
                              {getYouTubeId(activeList[currentQIdx]?.video) && (
                                <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-md aspect-video h-full min-h-[140px] bg-zinc-900">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${getYouTubeId(activeList[currentQIdx].video)}`}
                                    title="Anime Video Trailer/OST"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full border-0"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end pt-3 border-t border-zinc-900">
                              <button
                                id="btn-reveal-next"
                                onClick={handleNextClick}
                                className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs sm:text-sm transition-all duration-300 shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                  isCorrect 
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 shadow-emerald-500/10 hover:shadow-emerald-500/25' 
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-rose-600 hover:to-red-500 shadow-red-500/10 hover:shadow-red-500/25'
                                }`}
                              >
                                <span>{lang === 'mn' ? 'Дараагийн асуулт' : 'Next Question'}</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                  </div>
                )}

                {/* Game Over Screen */}
                {gameState === 'gameover' && (
                  <div className="text-center py-12 space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-2">
                      <AlertTriangle size={32} />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {lang === 'mn' ? 'Тоглоом дууслаа!' : 'Game Over!'}
                      </h3>
                      <p className="text-zinc-400 text-sm max-w-sm">
                        {lang === 'mn' 
                          ? 'Харамсалтай нь чи бүх амиа алдлаа. Санаа зоволтгүй дахин оролдоод оноогоо ахиулаарай!'
                          : 'Unfortunately, you have run out of lives. Keep practicing to build a legendary score!'}
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl w-64">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                        {lang === 'mn' ? 'Миний оноо' : 'Final Score'}
                      </span>
                      <span className="text-3xl font-mono font-black text-white">{score}</span>
                      <span className="text-xs text-zinc-500 block mt-2">
                        {lang === 'mn' ? 'Дээд амжилт:' : 'High Score:'} {activeHighScore}
                      </span>
                    </div>

                    {/* Score Submit Form */}
                    <div className="bg-zinc-950/60 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-inner">
                      <h4 className="text-xs font-mono text-[#e8702a] uppercase tracking-wider text-center">
                        {lang === 'mn' ? 'Оноогоо Бүртгүүлэх' : 'Submit Your Score'}
                      </h4>
                      {scoreSaved ? (
                        <div className="flex flex-col items-center justify-center py-2 space-y-2">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
                            <Check size={20} />
                          </div>
                          <p className="text-xs text-zinc-400 font-medium text-center">
                            {lang === 'mn' ? 'Оноог амжилттай хадгаллаа! 🎉' : 'Score successfully saved! 🎉'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                            <input
                              type="text"
                              maxLength={30}
                              placeholder={lang === 'mn' ? 'Таны нэр...' : 'Your Name...'}
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e8702a]/60 transition-colors"
                            />
                          </div>
                          <button
                            disabled={savingScore || !playerName.trim()}
                            onClick={handleSaveScore}
                            className="w-full py-2.5 bg-gradient-to-r from-[#e8702a] to-[#ff8c42] hover:from-[#d2611f] hover:to-[#e8702a] disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            {savingScore ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>{lang === 'mn' ? 'Хадгалж байна...' : 'Saving...'}</span>
                              </>
                            ) : (
                              <>
                                <Award size={14} />
                                <span>{lang === 'mn' ? 'Бүртгүүлэх' : 'Register Score'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      id="btn-retry-anime"
                      onClick={startAnimeGame}
                      className={`px-6 py-3 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95 ${
                        isEmojiMode 
                          ? 'bg-yellow-500 hover:bg-yellow-600' 
                          : 'bg-[#e8702a] hover:bg-[#d2611f]'
                      }`}
                    >
                      <RotateCcw size={16} />
                      {lang === 'mn' ? 'Дахин тоглох' : 'Try Again'}
                    </button>
                  </div>
                )}

                {/* Victory Screen */}
                {gameState === 'victory' && (
                  <div className="text-center py-12 space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 mb-2 animate-bounce">
                      <Trophy size={32} />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 text-yellow-500">
                        {lang === 'mn' ? 'БАЯР ХҮРГЭЕ! 🏆🎉' : 'VICTORY! 🏆🎉'}
                      </h3>
                      <p className="text-zinc-400 text-sm max-w-sm">
                        {lang === 'mn' 
                          ? 'Чи бүх асуултанд амжилттай хариулж ялагч боллоо! Чи үнэхээр мундаг юмаа!'
                          : 'You have answered all anime guesser questions successfully and won! Incredible memory!'}
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl w-64">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                        {lang === 'mn' ? 'Миний оноо' : 'Total Score'}
                      </span>
                      <span className="text-3xl font-mono font-black text-yellow-500">{score}</span>
                      <span className="text-xs text-zinc-500 block mt-2">
                        {lang === 'mn' ? 'Дээд амжилт:' : 'High Score:'} {activeHighScore}
                      </span>
                    </div>

                    {/* Score Submit Form */}
                    <div className="bg-zinc-950/60 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-inner">
                      <h4 className="text-xs font-mono text-[#e8702a] uppercase tracking-wider text-center">
                        {lang === 'mn' ? 'Оноогоо Бүртгүүлэх' : 'Submit Your Score'}
                      </h4>
                      {scoreSaved ? (
                        <div className="flex flex-col items-center justify-center py-2 space-y-2">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
                            <Check size={20} />
                          </div>
                          <p className="text-xs text-zinc-400 font-medium text-center">
                            {lang === 'mn' ? 'Оноог амжилттай хадгаллаа! 🎉' : 'Score successfully saved! 🎉'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                            <input
                              type="text"
                              maxLength={30}
                              placeholder={lang === 'mn' ? 'Таны нэр...' : 'Your Name...'}
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e8702a]/60 transition-colors"
                            />
                          </div>
                          <button
                            disabled={savingScore || !playerName.trim()}
                            onClick={handleSaveScore}
                            className="w-full py-2.5 bg-gradient-to-r from-[#e8702a] to-[#ff8c42] hover:from-[#d2611f] hover:to-[#e8702a] disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            {savingScore ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>{lang === 'mn' ? 'Хадгалж байна...' : 'Saving...'}</span>
                              </>
                            ) : (
                              <>
                                <Award size={14} />
                                <span>{lang === 'mn' ? 'Бүртгүүлэх' : 'Register Score'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        id="btn-replay-anime-victory"
                        onClick={startAnimeGame}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                      >
                        <RotateCcw size={16} />
                        {lang === 'mn' ? 'Дахин тоглох' : 'Play Again'}
                      </button>
                      <button
                        id="btn-lobby-anime-victory"
                        onClick={() => setActiveGame('none')}
                        className={`px-6 py-3 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                          isEmojiMode 
                            ? 'bg-yellow-500 hover:bg-yellow-600' 
                            : 'bg-[#e8702a] hover:bg-[#d2611f]'
                        }`}
                      >
                        <Gamepad2 size={16} />
                        {lang === 'mn' ? 'Лобби руу буцах' : 'Back to Lobby'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })() : (
          /* Basketball Shootout Game Console Container */
          <div id="basketball-game-console" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-[#e8702a] to-[#ff8c42]" />

            <div className="pl-4 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-orange-400 text-sm font-mono font-bold tracking-wider uppercase">
                    Basketball Shootout
                  </span>
                  <div className="flex bg-zinc-950 px-3 py-1 rounded-full items-center gap-1.5 border border-zinc-800">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="text-xs text-zinc-400 font-mono">
                      Best Streak: <strong className="text-white">{bbHighScore}</strong>
                    </span>
                  </div>
                </div>

                <button
                  id="btn-back-to-lobby-basketball"
                  onClick={() => setActiveGame('none')}
                  className="text-xs text-zinc-500 hover:text-white transition-colors uppercase font-mono tracking-wider border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800"
                >
                  {lang === 'mn' ? 'Гарах' : 'Exit Lobby'}
                </button>
              </div>

              {/* Game Area court */}
              <div className="relative w-full h-80 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col items-center justify-between p-4">
                {/* Basketball Hoop */}
                <div className="relative flex flex-col items-center">
                  {/* Backboard */}
                  <div className="w-24 h-16 bg-white/5 border-2 border-white rounded-lg flex items-center justify-center relative shadow-md">
                    {/* Inner square */}
                    <div className="w-10 h-8 border border-white" />
                    {/* Rim (Orange line) */}
                    <div className="absolute bottom-1 w-8 h-2 bg-orange-600 rounded-full border border-orange-500 shadow-lg shadow-orange-600/50" />
                    {/* Net */}
                    <div className="absolute bottom-[-14px] w-6 h-6 border-l border-r border-dashed border-white/50 bg-gradient-to-b from-white/20 to-transparent clip-path" style={{ borderRadius: '0 0 50% 50%' }} />
                  </div>
                </div>

                {/* Score and Message center */}
                <div className="text-center z-10">
                  <p className="text-2xl font-mono font-bold text-white mb-1">
                    {lang === 'mn' ? 'Оноо:' : 'Score:'} <span className="text-orange-400">{bbScore}</span>
                  </p>
                  <p className="text-xs text-zinc-400 italic bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 inline-block">
                    {bbMessage}
                  </p>
                </div>

                {/* Court Ball Container */}
                <div className="w-full h-24 relative flex items-center justify-center">
                  {/* Ball Animation */}
                  <motion.button
                    id="basketball-ball"
                    onClick={shootBasketball}
                    disabled={ballState !== 'idle'}
                    animate={{
                      x: ballState === 'shooting' ? 0 : ballState === 'scored' ? 0 : ballState === 'missed' ? (ballPos.x === 25 ? -100 : 100) : 0,
                      y: ballState === 'shooting' ? -200 : ballState === 'scored' ? -210 : ballState === 'missed' ? -150 : 0,
                      scale: ballState === 'shooting' ? 0.6 : ballState === 'scored' ? 0.45 : ballState === 'missed' ? 0.6 : 1,
                      rotate: ballState === 'shooting' ? 360 : ballState === 'scored' ? 720 : ballState === 'missed' ? 180 : 0
                    }}
                    transition={{
                      duration: ballState === 'idle' ? 0 : 0.8,
                      ease: ballState === 'idle' ? 'linear' : 'easeOut'
                    }}
                    className={`w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-[#d2611f] border-2 border-[#b84e12] flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25 ${
                      ballState !== 'idle' ? 'pointer-events-none' : ''
                    }`}
                  >
                    🏀
                  </motion.button>
                </div>

              </div>

              {/* Instructions and Controls */}
              <div className="mt-6 flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-400 font-light max-w-xs">
                  {lang === 'mn' 
                    ? 'Сагсан бөмбөг дээр дараад цагираг руу шиднэ үү. Тоглогчийн амжилт санамсаргүй байдлаар бодогдоно.'
                    : 'Click or tap on the basketball to shoot into the rim. Score as many in a row as possible!'}
                </span>
                
                <button
                  id="btn-restart-basketball"
                  onClick={startBasketballGame}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  {lang === 'mn' ? 'Шинээр эхлэх' : 'Reset Game'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
