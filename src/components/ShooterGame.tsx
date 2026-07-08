import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Gamepad2, Heart, Award, Shield, Zap, Sparkles, Volume2, VolumeX, ArrowLeft, Loader2, User, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface ShooterGameProps {
  lang: 'mn' | 'en';
  onBackToLobby: () => void;
  onSaveScore: (score: number) => void;
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

// Custom Synthesizer Sound Effects for Galaxy Striker
const playSynthesizerSound = (type: 'shoot' | 'explosion' | 'powerup' | 'damage' | 'gameover' | 'brick', soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'shoot') {
      // Classic arcade sci-fi laser sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'brick') {
      // Metallic pluck sound for shield deflection
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'explosion') {
      // Noise-like low rumble explosion
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.35);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'powerup') {
      // Ascending musical chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (type === 'damage') {
      // Low dual buzzer thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'gameover') {
      // Descending sad synth slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.8);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.82);
    }
  } catch (e) {
    console.warn('Audio play restricted', e);
  }
};

export default function ShooterGame({ lang, onBackToLobby, onSaveScore, highScore, onUpdateHighScore }: ShooterGameProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerUpDuration, setPowerUpDuration] = useState(0); // in seconds

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');

  useEffect(() => {
    if (user && user.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const handleLocalSaveScore = async () => {
    if (!playerName.trim()) return;
    setSavingScore(true);
    try {
      const scoresCol = collection(db, 'scores');
      await addDoc(scoresCol, {
        playerName: playerName.trim(),
        score: score,
        gameType: 'shooter',
        answers: [{
          question: lang === 'mn' ? 'Ламин Галакси Буудагч' : 'Lamine Galaxy Striker',
          userAnswer: 'Match Completed',
          correctAnswer: 'Victory',
          isCorrect: true
        }],
        createdAt: serverTimestamp(),
      });
      setScoreSaved(true);
      localStorage.setItem('player_name', playerName.trim());
      onSaveScore(score); // trigger parent update
    } catch (error) {
      console.error('Failed to save score:', error);
    } finally {
      setSavingScore(false);
    }
  };
  
  // Controls state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchLeftRef = useRef(false);
  const touchRightRef = useRef(false);
  const touchShootRef = useRef(false);

  // Game elements references
  const playerRef = useRef({
    x: 0,
    y: 0,
    width: 48,
    height: 48,
    speed: 8,
    shield: false,
    shieldTimer: 0,
    tripleTimer: 0,
    fireCooldown: 0,
    maxCooldown: 12, // frames between shots
  });

  const projectilesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }[]>([]);
  const enemiesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; hp: number; maxHp: number; type: 'ball' | 'card' | 'whistle'; angle: number; rotSpeed: number; color: string }[]>([]);
  const powerUpsRef = useRef<{ x: number; y: number; vy: number; type: 'triple' | 'shield' | 'heal' | 'gold'; radius: number; color: string }[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number; life: number; maxLife: number }[]>([]);
  const scoreFloatsRef = useRef<{ x: number; y: number; text: string; color: string; alpha: number; life: number }[]>([]);

  // Dimension tracking
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 480 });

  // Handle Resize using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Keep a neat 4:3 or 16:10 aspect ratio, bounded between 320px and 700px height
        const targetWidth = Math.max(320, Math.min(width, 800));
        const targetHeight = Math.max(400, Math.min(Math.round(targetWidth * 0.75), 520));
        
        setCanvasDimensions({ width: targetWidth, height: targetHeight });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Set up Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' && isPlaying && !gameOver) {
        e.preventDefault(); // Prevent page scrolling
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver]);

  // Start / Reset Game
  const startGame = () => {
    // Reset player variables
    playerRef.current.x = canvasDimensions.width / 2 - 24;
    playerRef.current.y = canvasDimensions.height - 70;
    playerRef.current.shield = false;
    playerRef.current.shieldTimer = 0;
    playerRef.current.tripleTimer = 0;
    playerRef.current.fireCooldown = 0;

    // Reset list refs
    projectilesRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    scoreFloatsRef.current = [];

    // Reset react states
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setActivePowerUp(null);
    setPowerUpDuration(0);
    setScoreSaved(false);

    playSynthesizerSound('shoot', soundEnabled);
  };

  // Trigger floating text
  const addFloatingText = (x: number, y: number, text: string, color = '#e8702a') => {
    scoreFloatsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      life: 45, // frames
    });
  };

  // Trigger beautiful particle explosion
  const addExplosionParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 25 + 15,
      });
    }
  };

  // Main Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let animFrameId: number;
    let frameCount = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      frameCount++;
      const { width, height } = canvasDimensions;

      // 1. UPDATE CONTROLS & PLAYER MOVEMENT
      const p = playerRef.current;
      
      // Update limits on dimensions changes
      if (p.x < 0) p.x = 0;
      if (p.x > width - p.width) p.x = width - p.width;
      p.y = height - 70; // Pin to bottom

      // Keyboard & Touch movement
      let movingLeft = keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A'] || touchLeftRef.current;
      let movingRight = keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D'] || touchRightRef.current;
      
      if (movingLeft) {
        p.x -= p.speed;
      }
      if (movingRight) {
        p.x += p.speed;
      }

      // Constrain player to screen bounds
      if (p.x < 0) p.x = 0;
      if (p.x > width - p.width) p.x = width - p.width;

      // Update Cooldowns and Powerups
      if (p.fireCooldown > 0) p.fireCooldown--;
      if (p.shieldTimer > 0) {
        p.shieldTimer--;
        if (p.shieldTimer === 0) {
          p.shield = false;
          setActivePowerUp(null);
        } else {
          setPowerUpDuration(Math.ceil(p.shieldTimer / 60));
        }
      }
      if (p.tripleTimer > 0) {
        p.tripleTimer--;
        if (p.tripleTimer === 0) {
          setActivePowerUp(null);
        } else {
          setPowerUpDuration(Math.ceil(p.tripleTimer / 60));
        }
      }

      // Shooting logic
      const shootingInput = keysRef.current[' '] || keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W'] || touchShootRef.current;
      if (shootingInput && p.fireCooldown === 0) {
        playSynthesizerSound('shoot', soundEnabled);
        p.fireCooldown = p.maxCooldown;

        const centerX = p.x + p.width / 2;
        const centerY = p.y;

        if (p.tripleTimer > 0) {
          // Triple Shot (Neon balls in 3 angles)
          projectilesRef.current.push({ x: centerX, y: centerY, vx: -3, vy: -10, radius: 6, color: '#facc15' }); // Left
          projectilesRef.current.push({ x: centerX, y: centerY, vx: 0, vy: -11, radius: 7, color: '#3b82f6' });  // Center
          projectilesRef.current.push({ x: centerX, y: centerY, vx: 3, vy: -10, radius: 6, color: '#facc15' });  // Right
        } else {
          // Single classic kick shot
          projectilesRef.current.push({ x: centerX, y: centerY, vx: 0, vy: -10, radius: 6, color: '#ff781f' });
        }
      }

      // 2. ENEMY SPAWNER
      // Harder as score increases
      const spawnChance = Math.min(0.015 + (score / 15000), 0.05);
      if (Math.random() < spawnChance && enemiesRef.current.length < 15) {
        const randType = Math.random();
        let type: 'ball' | 'card' | 'whistle' = 'ball';
        let radius = 18;
        let hp = 1;
        let color = '#a1a1aa';
        let speedY = Math.random() * 2 + 1.5;

        if (randType < 0.25) {
          // Evil Referee Card (Red Card!) - Fast but weak
          type = 'card';
          radius = 12;
          hp = 1;
          color = '#ef4444';
          speedY = Math.random() * 3 + 3.0;
        } else if (randType < 0.45) {
          // Heavy Golden Trophy Whistle - Slow but tough
          type = 'whistle';
          radius = 24;
          hp = 3;
          color = '#eab308';
          speedY = Math.random() * 1.0 + 1.0;
        } else {
          // Standard Meteor Soccer Ball
          type = 'ball';
          radius = 16;
          hp = 1;
          color = '#2563eb';
        }

        enemiesRef.current.push({
          x: Math.random() * (width - radius * 2) + radius,
          y: -radius,
          vx: (Math.random() - 0.5) * 1.5,
          vy: speedY,
          radius,
          hp,
          maxHp: hp,
          type,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          color
        });
      }

      // 3. UPDATE PROJECTILES
      projectilesRef.current = projectilesRef.current.filter((proj) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        // Keep in bounds
        return proj.y > -proj.radius && proj.x > -proj.radius && proj.x < width + proj.radius;
      });

      // 4. UPDATE ENEMIES
      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.angle += enemy.rotSpeed;

        // Bounce horizontally off walls
        if (enemy.x - enemy.radius < 0 || enemy.x + enemy.radius > width) {
          enemy.vx *= -1;
        }

        // Reaching the bottom damages the player
        if (enemy.y - enemy.radius > height) {
          if (!p.shield) {
            setLives((prev) => {
              const next = prev - 1;
              if (next <= 0) {
                setGameOver(true);
                playSynthesizerSound('gameover', soundEnabled);
              } else {
                playSynthesizerSound('damage', soundEnabled);
              }
              return next;
            });
            addFloatingText(width / 2, height - 120, lang === 'mn' ? 'АМЬ -1!' : 'LFE -1!', '#f87171');
          } else {
            playSynthesizerSound('brick', soundEnabled);
            addFloatingText(enemy.x, height - 80, lang === 'mn' ? 'ХАМГААЛСАН!' : 'BLOCKED!', '#60a5fa');
          }
          return false; // Remove enemy
        }

        // Collision with player
        const distToPlayer = Math.hypot(enemy.x - (p.x + p.width / 2), enemy.y - (p.y + p.height / 2));
        if (distToPlayer < enemy.radius + p.width / 2 - 4) {
          if (!p.shield) {
            setLives((prev) => {
              const next = prev - 1;
              if (next <= 0) {
                setGameOver(true);
                playSynthesizerSound('gameover', soundEnabled);
              } else {
                playSynthesizerSound('damage', soundEnabled);
              }
              return next;
            });
            addFloatingText(p.x + p.width / 2, p.y - 20, lang === 'mn' ? 'МӨРГӨЛДЛӨӨ! -1' : 'CRASH! -1', '#f87171');
          } else {
            playSynthesizerSound('brick', soundEnabled);
            addFloatingText(p.x + p.width / 2, p.y - 20, lang === 'mn' ? 'ХАМГААЛАЛТ!' : 'SHIELDED!', '#60a5fa');
          }
          addExplosionParticles(enemy.x, enemy.y, enemy.color, 16);
          return false; // Destroy enemy
        }

        return true;
      });

      // 5. UPDATE POWERUPS
      // Spawn powerup occasionally on frameCount
      if (frameCount % 600 === 0) {
        const types: ('triple' | 'shield' | 'heal' | 'gold')[] = ['triple', 'shield', 'heal', 'gold'];
        const type = types[Math.floor(Math.random() * types.length)];
        let color = '#a855f7';
        if (type === 'triple') color = '#fbbf24';
        if (type === 'shield') color = '#3b82f6';
        if (type === 'heal') color = '#22c55e';
        if (type === 'gold') color = '#e8702a';

        powerUpsRef.current.push({
          x: Math.random() * (width - 40) + 20,
          y: -20,
          vy: 2.0,
          type,
          radius: 14,
          color,
        });
      }

      powerUpsRef.current = powerUpsRef.current.filter((pow) => {
        pow.y += pow.vy;

        // Collision with player
        const dist = Math.hypot(pow.x - (p.x + p.width / 2), pow.y - (p.y + p.height / 2));
        if (dist < pow.radius + p.width / 2) {
          playSynthesizerSound('powerup', soundEnabled);
          addExplosionParticles(pow.x, pow.y, pow.color, 20);

          if (pow.type === 'triple') {
            p.tripleTimer = 480; // 8 seconds of triple fire
            p.shieldTimer = 0;
            p.shield = false;
            setActivePowerUp('triple');
            addFloatingText(pow.x, pow.y - 20, lang === 'mn' ? 'ГҮРЭЭ СУПЕР ХҮЧ!' : 'TRIPLE KICK!', '#fbbf24');
          } else if (pow.type === 'shield') {
            p.shield = true;
            p.shieldTimer = 480; // 8 seconds shield
            p.tripleTimer = 0;
            setActivePowerUp('shield');
            addFloatingText(pow.x, pow.y - 20, lang === 'mn' ? 'ТИТАН ХАМГААЛАЛТ!' : 'FORCE SHIELD!', '#3b82f6');
          } else if (pow.type === 'heal') {
            setLives((prev) => Math.min(prev + 1, 4)); // max 4 lives
            addFloatingText(pow.x, pow.y - 20, lang === 'mn' ? '+1 ЭРЧ ХҮЧ!' : '+1 LIFE BOOST!', '#22c55e');
          } else if (pow.type === 'gold') {
            // Instantly gives +150 score and fires fireworks
            setScore((prev) => prev + 250);
            addFloatingText(pow.x, pow.y - 20, lang === 'mn' ? '+250 АЛТАН БӨМБӨГ!' : '+250 GOLD BALL!', '#e8702a');
            addExplosionParticles(pow.x, pow.y, '#e8702a', 30);
          }
          return false; // Picked up
        }

        return pow.y < height + pow.radius;
      });

      // 6. COLLISIONS: PROJECTILES VS ENEMIES
      projectilesRef.current.forEach((proj, pIdx) => {
        enemiesRef.current.forEach((enemy, eIdx) => {
          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (dist < proj.radius + enemy.radius) {
            // Collision!
            playSynthesizerSound('explosion', soundEnabled);
            addExplosionParticles(proj.x, proj.y, enemy.color, 8);
            
            // Remove laser
            projectilesRef.current.splice(pIdx, 1);
            
            // Damage enemy
            enemy.hp--;
            if (enemy.hp <= 0) {
              addExplosionParticles(enemy.x, enemy.y, enemy.color, 18);
              
              let pts = 50;
              if (enemy.type === 'card') pts = 100;
              if (enemy.type === 'whistle') pts = 150;

              setScore((prev) => prev + pts);
              addFloatingText(enemy.x, enemy.y - 15, `+${pts}`, enemy.color);
              
              // Remove enemy
              enemiesRef.current.splice(eIdx, 1);
            }
          }
        });
      });

      // 7. PARTICLES
      particlesRef.current = particlesRef.current.filter((part) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;
        part.alpha = 1.0 - (part.life / part.maxLife);
        return part.life < part.maxLife;
      });

      // 8. FLOATING SCORE TEXTS
      scoreFloatsRef.current = scoreFloatsRef.current.filter((txt) => {
        txt.y -= 1.0; // Float upwards
        txt.life--;
        txt.alpha = txt.life / 45;
        return txt.life > 0;
      });


      // 9. RENDER ALL
      ctx.clearRect(0, 0, width, height);

      // A. Grid & Nebula background effect
      ctx.strokeStyle = 'rgba(232, 112, 42, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw active background nebula dusts
      ctx.fillStyle = 'rgba(232, 112, 42, 0.02)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 3, 120, 0, Math.PI * 2);
      ctx.fill();

      // B. Draw Projectiles (glowing trailing footballs)
      projectilesRef.current.forEach((proj) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = proj.color;
        ctx.fillStyle = proj.color;
        
        // Render stylized football core
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        // Soccer line markings inside laser projectile
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // C. Draw Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.shadowBlur = 8;
        ctx.shadowColor = enemy.color;

        if (enemy.type === 'ball') {
          // Draw a stylized futuristic meteor soccer ball
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw hexagon stitches inside meteor
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
          
          // Outer spikes (meteor trail)
          ctx.fillStyle = 'rgba(232, 112, 42, 0.15)';
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius + 6, 0, Math.PI * 2);
          ctx.fill();

        } else if (enemy.type === 'card') {
          // Evil red referee card
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(-8, -12, 16, 24, 4);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Exclamation mark on whistle/card
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', 0, 0);

        } else if (enemy.type === 'whistle') {
          // Heavy golden trophy/whistle shape
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();

          // Draw base cup handle
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4;
          ctx.strokeRect(-enemy.radius * 0.9, -enemy.radius * 0.2, enemy.radius * 1.8, enemy.radius * 0.4);

          ctx.fillStyle = '#ffffff';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏆', 0, 0);
        }

        // Draw Health Bar for heavy enemies
        if (enemy.maxHp > 1) {
          ctx.restore(); // momentarily exit rotation
          ctx.save();
          const barW = enemy.radius * 1.6;
          const barH = 4;
          const barX = enemy.x - barW / 2;
          const barY = enemy.y - enemy.radius - 8;

          ctx.fillStyle = '#27272a';
          ctx.fillRect(barX, barY, barW, barH);

          const hpPercent = enemy.hp / enemy.maxHp;
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(barX, barY, barW * hpPercent, barH);
        }

        ctx.restore();
      });

      // D. Draw PowerUps
      powerUpsRef.current.forEach((pow) => {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = pow.color;
        ctx.fillStyle = pow.color;

        // Draw floating powerup circle
        ctx.beginPath();
        ctx.arc(pow.x, pow.y, pow.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw icon inside circle
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '⚡';
        if (pow.type === 'shield') icon = '🛡️';
        if (pow.type === 'heal') icon = '❤️';
        if (pow.type === 'gold') icon = '⚽';

        ctx.fillText(icon, pow.x, pow.y);
        ctx.restore();
      });

      // E. Draw Particles
      particlesRef.current.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // F. Draw Floating Texts
      scoreFloatsRef.current.forEach((txt) => {
        ctx.save();
        ctx.globalAlpha = txt.alpha;
        ctx.fillStyle = txt.color;
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
      });

      // G. Draw Player (Anime Striker Spaceship / Soccer Hero)
      ctx.save();
      // Neon glow under player
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.shield ? '#3b82f6' : '#e8702a';
      
      // Draw cool vector-based futuristic soccer spaceship
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;

      // Draw custom wings
      ctx.fillStyle = p.shield ? 'rgba(59,130,246,0.3)' : 'rgba(232,112,42,0.3)';
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 15);
      ctx.lineTo(cx, cy - 24);
      ctx.lineTo(cx + 24, cy + 15);
      ctx.closePath();
      ctx.fill();

      // Main cockpit (football-shaped center pod)
      ctx.fillStyle = '#1e1b4b'; // Deep navy
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.shield ? '#3b82f6' : '#e8702a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Jet exhaust flames (pulsating)
      const flameHeight = 10 + Math.random() * 8;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 14);
      ctx.lineTo(cx, cy + 14 + flameHeight);
      ctx.lineTo(cx + 6, cy + 14);
      ctx.closePath();
      ctx.fill();

      // Mini soccer-ball cockpit decal
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // If protected by Force Shield
      if (p.shield) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // LOOP CONTINUATION
      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, gameOver, canvasDimensions, soundEnabled, lang, score]);

  // Handle high-score and termination
  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        onUpdateHighScore(score);
        localStorage.setItem('shooter_high_score', score.toString());
      }
    }
  }, [gameOver, score]);

  return (
    <div ref={containerRef} className="w-full bg-zinc-950 rounded-3xl border border-zinc-900 overflow-hidden shadow-2xl relative flex flex-col items-center">
      
      {/* Background Star Ambient Dust */}
      <div className="absolute inset-0 bg-radial-gradient from-zinc-900/40 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Header Stat Panel */}
      <div className="w-full border-b border-zinc-900 bg-zinc-900/30 px-6 py-4 flex flex-wrap items-center justify-between z-10 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLobby}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[11px] font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>{lang === 'mn' ? 'Буцах' : 'Back'}</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-[#e8702a] text-xs font-mono font-black tracking-widest uppercase">
              🚀 Lamine Galaxy Striker
            </span>
          </div>
        </div>

        {/* Dynamic game indicators */}
        {isPlaying && !gameOver && (
          <div className="flex items-center space-x-4">
            {/* Health Bars */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Heart
                  key={idx}
                  size={14}
                  className={`transition-colors duration-300 ${
                    idx < lives ? 'text-red-500 fill-red-500' : 'text-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Score */}
            <div className="bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-900/60 font-mono text-xs text-zinc-400">
              {lang === 'mn' ? 'Оноо:' : 'Score:'} <span className="text-white font-black">{score}</span>
            </div>

            {/* High score */}
            <div className="hidden sm:flex items-center space-x-1 text-xs text-zinc-500 font-mono">
              <Trophy size={13} className="text-yellow-500" />
              <span>Best: <strong className="text-zinc-300">{highScore}</strong></span>
            </div>
          </div>
        )}

        {/* Audio Toggle & Help */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Sound FX"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      {/* Screen Interface */}
      <div className="relative w-full flex-1 flex items-center justify-center p-3 sm:p-5">
        
        <AnimatePresence mode="wait">
          {!isPlaying && (
            // Welcome screen
            <motion.div
              key="welcome-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-sm flex flex-col items-center py-12 px-6 z-10"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#e8702a] to-amber-500 flex items-center justify-center shadow-lg shadow-[#e8702a]/20 text-white text-3xl font-bold mb-6 animate-bounce">
                🚀
              </div>
              
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Galaxy Striker
              </h2>
              <p className="text-[10px] font-mono text-[#e8702a] uppercase tracking-wider mb-4">
                ⚽ Lamine Yamal Special Edition ⚽
              </p>

              <p className="text-zinc-400 text-xs font-light leading-relaxed mb-6">
                {lang === 'mn'
                  ? 'Кампу Ноугийн агуу довтлогч Ламин Ямалын сансрын тулаанд тавтай морил! Неон бөмбөг өшиглөж, сансрын улаан хуудас, шүгэл, сагсан бөмбөгийн дайралтуудыг устгаарай!'
                  : 'Welcome to the futuristic soccer space battles of Lamine Yamal! Kick energized neon footballs to disintegrate red cards, whistle asteroids, and goalie gloves!'}
              </p>

              {/* Best score */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 px-4 py-2.5 rounded-2xl w-full flex items-center justify-between mb-6">
                <span className="text-xs text-zinc-500 font-mono uppercase">{lang === 'mn' ? 'Дээд оноо:' : 'Personal Best:'}</span>
                <span className="text-sm font-mono font-black text-yellow-500">{highScore} pts</span>
              </div>

              {/* Desktop controls manual */}
              <div className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-2xl text-[10px] text-zinc-500 text-left font-mono mb-6 space-y-1 sm:block hidden">
                <p className="text-zinc-400 font-bold mb-1 uppercase tracking-wide">🎮 Controls:</p>
                <p>• Move: <span className="text-zinc-300">← / A</span> and <span className="text-zinc-300">→ / D</span></p>
                <p>• Shoot / Kick: <span className="text-zinc-300">Spacebar</span> or <span className="text-zinc-300">W / ↑</span></p>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3.5 bg-gradient-to-r from-[#e8702a] to-[#ff8c42] hover:from-[#d2611f] hover:to-[#e8702a] text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#e8702a]/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play size={13} fill="currentColor" />
                <span>{lang === 'mn' ? 'Сансрын Тулаан Эхлэх' : 'Launch Space Strike'}</span>
              </button>
            </motion.div>
          )}

          {isPlaying && gameOver && (
            // Game Over Screen
            <motion.div
              key="gameover-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-sm flex flex-col items-center py-10 px-6 z-10"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
                💥
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                {lang === 'mn' ? 'Амь дууслаа!' : 'Mission Failed!'}
              </h3>
              
              <p className="text-zinc-400 text-xs font-light max-w-xs mb-6">
                {lang === 'mn'
                  ? 'Сансрын сагсан бөмбөг болон шүүгчийн картууд Ламины хамгаалалтыг нэвтэллээ! Дараагийн тоглолтод илүү хүчтэй эргэн ирээрэй.'
                  : 'The red cards and whistle meteors broke through Lamine’s defense grid! Train harder for the next major match.'}
              </p>

              {/* Game Score badge */}
              <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl w-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  {lang === 'mn' ? 'Эцсийн оноо:' : 'Final Match Score:'}
                </span>
                <span className="text-3xl font-mono font-black text-white block">{score}</span>
                <span className="text-xs text-zinc-500 font-mono mt-1 block">
                  {lang === 'mn' ? 'Миний дээд оноо:' : 'Personal Best:'} {highScore}
                </span>
              </div>

              {/* Leaderboard saving form integrated */}
              <div className="w-full bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-mono text-[#e8702a] uppercase tracking-wider mb-3">
                  {lang === 'mn' ? 'Шилдгүүдийн жагсаалтад бүртгүүлэх' : 'Register in Hall of Fame'}
                </p>
                {scoreSaved ? (
                  <div className="flex items-center justify-center space-x-2 py-2 text-xs font-semibold text-emerald-500">
                    <Check size={14} />
                    <span>{lang === 'mn' ? 'Оноо амжилттай хадгалагдлаа!' : 'Score Saved Successfully!'}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        maxLength={30}
                        placeholder={lang === 'mn' ? 'Таны нэр...' : 'Your Name...'}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e8702a]/60 transition-colors"
                      />
                    </div>
                    <button
                      disabled={savingScore || !playerName.trim()}
                      onClick={handleLocalSaveScore}
                      className="w-full py-2.5 bg-gradient-to-r from-[#e8702a] to-[#ff8c42] hover:from-[#d2611f] hover:to-[#e8702a] disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      {savingScore ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>{lang === 'mn' ? 'Бүртгэж байна...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <>
                          <Award size={14} />
                          <span>{lang === 'mn' ? 'Оноогоо бүртгүүлэх' : 'Submit Score'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={startGame}
                  className="flex-1 py-3 bg-gradient-to-r from-[#e8702a] to-amber-600 hover:from-amber-600 hover:to-[#e8702a] text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>{lang === 'mn' ? 'Дахин тоглуулах' : 'Rematch'}</span>
                </button>
                <button
                  onClick={onBackToLobby}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium border border-zinc-800 transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'mn' ? 'Гарах' : 'Lobby'}
                </button>
              </div>
            </motion.div>
          )}

          {isPlaying && !gameOver && (
            // Active Game Screen rendering the Canvas
            <motion.div
              key="gameplay-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col items-center"
            >
              {/* Canvas element */}
              <div className="relative border border-zinc-900 rounded-2xl bg-[#030303] overflow-hidden shadow-inner flex justify-center items-center">
                <canvas
                  ref={canvasRef}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  className="block select-none pointer-events-none"
                />

                {/* PowerUp overlay notification */}
                {activePowerUp && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-zinc-950/80 border border-zinc-800/80 px-3 py-1.5 rounded-xl text-[10px] font-mono tracking-wide z-10 animate-pulse">
                    {activePowerUp === 'triple' ? (
                      <>
                        <Zap size={12} className="text-yellow-400" />
                        <span className="text-yellow-400">TRIPLE KICK: {powerUpDuration}s</span>
                      </>
                    ) : (
                      <>
                        <Shield size={12} className="text-blue-400" />
                        <span className="text-blue-400">FORCE SHIELD: {powerUpDuration}s</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile HUD Controls - Touch triggers */}
              <div className="mt-4 w-full max-w-md grid grid-cols-3 gap-3 px-2 select-none md:hidden z-10">
                <button
                  onMouseDown={() => { touchLeftRef.current = true; }}
                  onMouseUp={() => { touchLeftRef.current = false; }}
                  onMouseLeave={() => { touchLeftRef.current = false; }}
                  onTouchStart={(e) => { e.preventDefault(); touchLeftRef.current = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); touchLeftRef.current = false; }}
                  className="py-4 bg-zinc-900 active:bg-zinc-800 border border-zinc-800 active:border-zinc-700 text-white rounded-2xl flex items-center justify-center font-bold text-lg active:scale-95 transition-all select-none"
                >
                  ◀
                </button>

                <button
                  onMouseDown={() => { touchShootRef.current = true; }}
                  onMouseUp={() => { touchShootRef.current = false; }}
                  onMouseLeave={() => { touchShootRef.current = false; }}
                  onTouchStart={(e) => { e.preventDefault(); touchShootRef.current = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); touchShootRef.current = false; }}
                  className="py-4 bg-[#e8702a]/10 hover:bg-[#e8702a]/20 border border-[#e8702a]/30 active:scale-95 transition-all text-[#e8702a] rounded-2xl flex flex-col items-center justify-center font-black select-none text-xs"
                >
                  <span className="text-lg">⚽</span>
                  <span>KICK</span>
                </button>

                <button
                  onMouseDown={() => { touchRightRef.current = true; }}
                  onMouseUp={() => { touchRightRef.current = false; }}
                  onMouseLeave={() => { touchRightRef.current = false; }}
                  onTouchStart={(e) => { e.preventDefault(); touchRightRef.current = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); touchRightRef.current = false; }}
                  className="py-4 bg-zinc-900 active:bg-zinc-800 border border-zinc-800 active:border-zinc-700 text-white rounded-2xl flex items-center justify-center font-bold text-lg active:scale-95 transition-all select-none"
                >
                  ▶
                </button>
              </div>

              {/* Desktop tips overlay */}
              <div className="hidden md:block mt-3 text-[10px] text-zinc-600 font-mono select-none">
                {lang === 'mn'
                  ? 'Зөвлөгөө: Удирдахын тулд Сумтай товчлуурууд / A, D, өшиглөхийн тулд Зай авах (Spacebar) эсвэл W товчлуурыг ашиглана уу.'
                  : 'Pro Tip: Use Arrows / A, D to glide left-right. Press Spacebar / W to trigger laser kicks.'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
