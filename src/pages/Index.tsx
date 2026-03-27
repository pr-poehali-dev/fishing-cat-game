import { useState, useEffect, useRef, useCallback } from "react";

// ─── Типы ──────────────────────────────────────────────────────────────────

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
type Screen = "fishing" | "inventory" | "shop";
type GameState = "idle" | "casting" | "waiting" | "bite" | "minigame" | "caught" | "failed";

interface Fish {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  chance: number;
  description: string;
  color: string;
  glowColor?: string;
}

interface CaughtFish extends Fish { count: number; }

// ─── Данные ────────────────────────────────────────────────────────────────

const FISH_TYPES: Fish[] = [
  { id: "crucian",   name: "Карась",            rarity: "common",    price: 15,   chance: 36,  description: "Обычная рыба пруда",              color: "#c8a96e" },
  { id: "perch",     name: "Окунь",             rarity: "uncommon",  price: 45,   chance: 26,  description: "Полосатый хищник",               color: "#5b9bd5" },
  { id: "pike",      name: "Щука",              rarity: "rare",      price: 120,  chance: 18,  description: "Зубастая хозяйка реки",           color: "#6aab69" },
  { id: "salmon",    name: "Лосось",            rarity: "epic",      price: 320,  chance: 10,  description: "Мощная горная рыба",              color: "#e8735a" },
  { id: "goldfish",  name: "Золотая рыбка",     rarity: "legendary", price: 999,  chance: 4,   description: "Исполняет желания... может быть", color: "#f5c842" },
  { id: "trarallero",name: "Тралалеро Тралала", rarity: "mythic",    price: 9999, chance: 1.5, description: "Существо из глубин мифов. Бр-р.", color: "#c084fc", glowColor: "#a855f7" },
  { id: "nothin",    name: "Ничего",            rarity: "common",    price: 0,    chance: 4.5, description: "Пусто", color: "#aaa" },
];

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; border: string }> = {
  common:    { label: "Обычная",     color: "#7a7a8a", bg: "#f0f0f4", border: "#d0d0da" },
  uncommon:  { label: "Необычная",   color: "#3a8f4a", bg: "#eaf4eb", border: "#a8d9ae" },
  rare:      { label: "Редкая",      color: "#2a6fbb", bg: "#e8f0fb", border: "#9abde8" },
  epic:      { label: "Эпическая",   color: "#8a3fbc", bg: "#f3ebfb", border: "#c9a0e0" },
  legendary: { label: "Легендарная", color: "#c47a10", bg: "#fdf4e3", border: "#e8c87a" },
  mythic:    { label: "Мифическая",  color: "#7c3aed", bg: "#faf5ff", border: "#c084fc" },
};

// ─── SVG Спрайты ──────────────────────────────────────────────────────────

// Котик с удочкой (смотрит вправо)
function CatSprite({ state }: { state: GameState }) {
  const tailAnim = state === "idle" || state === "waiting";
  const excited = state === "bite";
  const happy = state === "caught";
  const sad = state === "failed";

  const eyeLeft = happy ? (
    <path d="M29 30 Q31 28 33 30" stroke="#3a3a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ) : excited ? (
    <><circle cx="31" cy="30" r="3" fill="#3a3a4a" /><circle cx="32" cy="29" r="1" fill="white" /></>
  ) : (
    <ellipse cx="31" cy="30" rx="2.5" ry="2" fill="#3a3a4a" />
  );

  const eyeRight = happy ? (
    <path d="M43 30 Q45 28 47 30" stroke="#3a3a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ) : excited ? (
    <><circle cx="45" cy="30" r="3" fill="#3a3a4a" /><circle cx="46" cy="29" r="1" fill="white" /></>
  ) : (
    <ellipse cx="45" cy="30" rx="2.5" ry="2" fill="#3a3a4a" />
  );

  const mouth = sad ? (
    <path d="M37 37 Q39 35 41 37" stroke="#3a3a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ) : happy ? (
    <path d="M36 36 Q39 40 42 36" stroke="#3a3a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  ) : (
    <path d="M37 36 Q39 38 41 36" stroke="#3a3a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  );

  return (
    <svg width="120" height="130" viewBox="0 0 120 130" fill="none" style={{ overflow: "visible" }}>
      {/* Хвост */}
      <g style={tailAnim ? { transformOrigin: "30px 90px", animation: "tailWag 1.8s ease-in-out infinite" } : {}}>
        <path d="M30 90 Q10 100 8 115 Q12 125 20 118 Q25 105 35 95" fill="#e8c8a0" stroke="#c8a070" strokeWidth="1" />
      </g>

      {/* Тело */}
      <ellipse cx="52" cy="88" rx="26" ry="22" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1.5" />

      {/* Задние лапы */}
      <ellipse cx="35" cy="108" rx="10" ry="6" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1" />
      <ellipse cx="55" cy="112" rx="12" ry="6" fill="#e8c8a0" stroke="#c8a070" strokeWidth="1" />

      {/* Голова */}
      <ellipse cx="72" cy="52" rx="22" ry="20" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1.5" />

      {/* Уши */}
      <polygon points="54,36 50,18 64,30" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1" />
      <polygon points="56,35 53,22 63,31" fill="#e8a0a0" />
      <polygon points="82,34 88,16 78,30" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1" />
      <polygon points="80,34 84,20 77,31" fill="#e8a0a0" />

      {/* Шляпа рыбака */}
      <rect x="54" y="30" width="40" height="8" rx="2" fill="#8B6914" stroke="#6B4F0A" strokeWidth="1" />
      <rect x="58" y="14" width="32" height="18" rx="4" fill="#a07820" stroke="#7a5a10" strokeWidth="1" />
      {/* Полоска на шляпе */}
      <rect x="58" y="26" width="32" height="4" fill="#e8c84a" opacity="0.7" />
      {/* Крючок/наживка на шляпе */}
      <circle cx="85" cy="17" r="3" fill="#e05050" opacity="0.8" />

      {/* Глаза */}
      {eyeLeft}
      {eyeRight}

      {/* Нос */}
      <ellipse cx="38" cy="34" rx="2" ry="1.5" fill="#e88080" />

      {/* Усы */}
      <line x1="52" y1="34" x2="68" y2="32" stroke="#aaa" strokeWidth="0.8" />
      <line x1="52" y1="36" x2="69" y2="36" stroke="#aaa" strokeWidth="0.8" />
      <line x1="52" y1="34" x2="36" y2="32" stroke="#aaa" strokeWidth="0.8" />
      <line x1="52" y1="36" x2="35" y2="37" stroke="#aaa" strokeWidth="0.8" />

      {/* Рот */}
      {mouth}

      {/* Передние лапы / рука с удочкой */}
      <path d="M68 78 Q75 82 78 90" stroke="#d4b080" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Пальчики */}
      <circle cx="79" cy="92" r="4" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1" />
      <circle cx="83" cy="88" r="3.5" fill="#f0d8b0" stroke="#d4b080" strokeWidth="1" />

      {/* Удочка в лапе */}
      <line x1="82" y1="90" x2="110" y2="50" stroke="#8B6914" strokeWidth="2.5" strokeLinecap="round" />

      {/* Стиль анимации хвоста */}
      <style>{`
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); }
          40% { transform: rotate(12deg); }
          80% { transform: rotate(-8deg); }
        }
      `}</style>
    </svg>
  );
}

// Леска + поплавок
function FishingLine({ state }: { state: GameState }) {
  if (state === "idle") return null;
  const bobberY = state === "bite" ? 72 : 68;
  const bite = state === "bite";

  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" style={{ overflow: "visible", position: "absolute", left: 98, top: -10 }}>
      {/* Леска */}
      <path d="M12 40 Q90 60 160 {bobberY}" stroke="rgba(200,200,200,0.8)" strokeWidth="1" strokeDasharray="4,3" fill="none"
        d={`M12 40 Q90 58 160 ${bobberY}`} />
      {/* Поплавок */}
      <g style={bite
        ? { animation: "popping 0.35s ease-in-out infinite alternate", transformOrigin: "160px " + bobberY + "px" }
        : { animation: "gentleBob 2s ease-in-out infinite", transformOrigin: "160px " + bobberY + "px" }
      }>
        <ellipse cx="160" cy={bobberY} rx="5" ry="10" fill="#e05050" />
        <ellipse cx="160" cy={bobberY - 6} rx="5" ry="4" fill="white" />
        <line x1="160" y1={bobberY - 10} x2="160" y2={bobberY - 14} stroke="#888" strokeWidth="1" />
      </g>
      <style>{`
        @keyframes gentleBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes popping {
          0% { transform: translateY(0) rotate(-3deg); }
          100% { transform: translateY(8px) rotate(3deg); }
        }
      `}</style>
    </svg>
  );
}

// Рыба SVG-спрайт
function FishSprite({ fish, size = 36 }: { fish: Fish; size?: number }) {
  const c = fish.color;
  const isMythic = fish.rarity === "mythic";

  if (isMythic) {
    return (
      <svg width={size * 1.4} height={size} viewBox="0 0 60 40" fill="none" style={{ filter: `drop-shadow(0 0 8px ${fish.glowColor})` }}>
        {/* Тело */}
        <ellipse cx="28" cy="20" rx="20" ry="12" fill={c} opacity="0.85" />
        {/* Хвост */}
        <polygon points="48,20 60,10 62,20 60,30" fill={c} opacity="0.7" />
        <polygon points="48,20 58,12 60,20 58,28" fill="#e879f9" opacity="0.5" />
        {/* Плавники */}
        <path d="M20 8 Q28 4 32 12" fill="#e879f9" opacity="0.6" />
        <path d="M22 32 Q28 36 32 28" fill="#e879f9" opacity="0.6" />
        {/* Глаз */}
        <circle cx="14" cy="18" r="4" fill="white" />
        <circle cx="13" cy="18" r="2.5" fill="#1a1a2e" />
        <circle cx="12.5" cy="17" r="1" fill="white" />
        {/* Узоры */}
        <path d="M25 14 Q30 20 25 26" stroke="#e879f9" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M32 14 Q37 20 32 26" stroke="#f0abfc" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Блики */}
        <ellipse cx="22" cy="15" rx="4" ry="2" fill="white" opacity="0.25" />
      </svg>
    );
  }

  const isGold = fish.id === "goldfish";
  return (
    <svg width={size * 1.2} height={size} viewBox="0 0 50 36" fill="none" style={isGold ? { filter: "drop-shadow(0 0 5px #f5c842)" } : {}}>
      <ellipse cx="22" cy="18" rx="16" ry="10" fill={c} />
      <polygon points="38,18 50,10 50,26" fill={c} opacity="0.8" />
      {isGold && <polygon points="38,18 48,12 48,24" fill="#ffe066" opacity="0.6" />}
      <path d="M16 8 Q22 5 26 12" fill={c} opacity="0.7" />
      <circle cx="10" cy="16" r="3.5" fill="white" />
      <circle cx="9.5" cy="16" r="2" fill="#1a1a2e" />
      <circle cx="9" cy="15.5" r="0.8" fill="white" />
      {isGold && (
        <>
          <path d="M20 12 Q24 18 20 24" stroke="#ffe066" strokeWidth="1" fill="none" opacity="0.8" />
          <ellipse cx="18" cy="13" rx="3" ry="1.5" fill="white" opacity="0.3" />
        </>
      )}
      {!isGold && <ellipse cx="18" cy="13" rx="3" ry="1.5" fill="white" opacity="0.2" />}
    </svg>
  );
}

// Вода SVG
function WaterScene({ state, lastFish }: { state: GameState; lastFish: Fish | null }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 260 200" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
      {/* Небо */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bde0f5" />
          <stop offset="100%" stopColor="#ddf0fa" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5bc4e8" />
          <stop offset="100%" stopColor="#2a8fb5" />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ec850" />
          <stop offset="100%" stopColor="#5aaa30" />
        </linearGradient>
        <clipPath id="waterClip">
          <rect x="160" y="90" width="100" height="110" />
        </clipPath>
        {lastFish?.rarity === "mythic" && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* Небо */}
      <rect width="260" height="200" fill="url(#skyGrad)" />

      {/* Облака */}
      <ellipse cx="40" cy="30" rx="25" ry="10" fill="white" opacity="0.7" />
      <ellipse cx="55" cy="25" rx="18" ry="9" fill="white" opacity="0.6" />
      <ellipse cx="25" cy="28" rx="14" ry="7" fill="white" opacity="0.5" />

      <ellipse cx="180" cy="22" rx="20" ry="8" fill="white" opacity="0.6" />
      <ellipse cx="195" cy="18" rx="14" ry="7" fill="white" opacity="0.5" />

      {/* Земля */}
      <rect x="0" y="150" width="260" height="50" fill="#c8a060" />
      {/* Трава */}
      <rect x="0" y="148" width="260" height="8" fill="url(#groundGrad)" rx="2" />

      {/* Берег у воды */}
      <path d="M158 148 Q165 140 175 148" fill="#b89050" />

      {/* Вода */}
      <rect x="162" y="90" width="98" height="60" fill="url(#waterGrad)" />

      {/* Волны поверхности */}
      <path d="M162 90 Q175 86 190 90 Q205 94 220 90 Q235 86 250 90 Q260 92 260 92 L260 96 Q248 94 235 98 Q218 102 200 98 Q185 94 168 98 Q164 96 162 96Z" fill="white" opacity="0.3" style={{ animation: "waveAnim 3s ease-in-out infinite" }} />
      <path d="M162 104 Q178 100 195 104 Q210 108 228 104 Q244 100 260 104 L260 108 Q244 106 228 110 Q210 114 195 110 Q178 106 162 110Z" fill="white" opacity="0.18" style={{ animation: "waveAnim 3.5s ease-in-out infinite reverse" }} />

      {/* Рыба под водой */}
      <g style={{ animation: "swimAnim 6s linear infinite" }} clipPath="url(#waterClip)">
        <ellipse cx="220" cy="120" rx="12" ry="7" fill="#a0d0e8" opacity="0.5" />
        <polygon points="232,120 240,114 240,126" fill="#a0d0e8" opacity="0.4" />
      </g>

      {/* Пузырьки */}
      {(state === "waiting" || state === "bite") && (
        <>
          <circle cx="230" cy="100" r="2" fill="white" opacity="0.5" style={{ animation: "bubbleUp 2s ease-in infinite" }} />
          <circle cx="218" cy="105" r="1.5" fill="white" opacity="0.4" style={{ animation: "bubbleUp 2.8s ease-in infinite 0.5s" }} />
          <circle cx="240" cy="108" r="1" fill="white" opacity="0.3" style={{ animation: "bubbleUp 2.2s ease-in infinite 1s" }} />
        </>
      )}

      {/* Всплеск при поимке */}
      {state === "caught" && (
        <g style={{ animation: "splashAnim 0.6s ease-out forwards" }} transform="translate(215, 88)">
          <path d="M0 0 L-8 -16 M0 0 L0 -18 M0 0 L8 -16 M0 0 L14 -8 M0 0 L-14 -8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="0" r="8" fill="white" opacity="0.4" />
        </g>
      )}

      {/* Мифическое свечение */}
      {lastFish?.rarity === "mythic" && (
        <ellipse cx="215" cy="90" rx="30" ry="15" fill="#a855f7" opacity="0.3" filter="url(#glow)" style={{ animation: "mythicPulse 1s ease-in-out infinite" }} />
      )}

      <style>{`
        @keyframes waveAnim { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-8px); } }
        @keyframes swimAnim { 0% { transform: translateX(-60px); } 50% { transform: translateX(40px); } 50.1% { transform: translateX(40px) scaleX(-1); } 100% { transform: translateX(-60px) scaleX(-1); } }
        @keyframes bubbleUp { 0% { transform: translateY(0); opacity: 0.5; } 100% { transform: translateY(-25px); opacity: 0; } }
        @keyframes splashAnim { 0% { transform: translate(215px,88px) scale(0); opacity:1; } 100% { transform: translate(215px,60px) scale(1.5); opacity:0; } }
        @keyframes mythicPulse { 0%, 100% { opacity: 0.2; rx: 28; } 50% { opacity: 0.45; rx: 34; } }
      `}</style>
    </svg>
  );
}

// Стопка пойманных рыб слева
function FishStack({ inventory }: { inventory: CaughtFish[] }) {
  const top5 = inventory.slice(-5).reverse();
  if (top5.length === 0) return null;
  return (
    <div className="absolute flex flex-col-reverse gap-1" style={{ left: 8, bottom: 56 }}>
      {top5.map((f, i) => (
        <div key={f.id + i} className="flex items-center gap-1 animate-fade-up"
          style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 5}deg)` }}>
          <FishSprite fish={f} size={28} />
          {f.count > 1 && <span className="text-xs font-bold" style={{ color: RARITY_CONFIG[f.rarity].color }}>×{f.count}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Мини-игра ──────────────────────────────────────────────────────────────

const BUTTONS = ["←", "→", "↑", "↓"];
const MINIGAME_STEPS = 5;

function MiniGame({ fish, onSuccess, onFail }: { fish: Fish; onSuccess: () => void; onFail: () => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [pressed, setPressed] = useState<number | null>(null);
  const [wrongKey, setWrongKey] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const steps = fish.rarity === "mythic" ? 7 : MINIGAME_STEPS;
    setSequence(Array.from({ length: steps }, () => Math.floor(Math.random() * 4)));
  }, [fish.rarity]);

  const steps = fish.rarity === "mythic" ? 7 : MINIGAME_STEPS;

  useEffect(() => {
    if (sequence.length === 0) return;
    const speed = fish.rarity === "mythic" ? 30 : 40;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { clearInterval(timerRef.current!); onFail(); return 0; }
        return t - (100 / (steps * (fish.rarity === "mythic" ? 18 : 25)));
      });
    }, speed);
    return () => clearInterval(timerRef.current!);
  }, [sequence, onFail, fish.rarity, steps]);

  const handlePress = useCallback((idx: number) => {
    if (sequence[current] === idx) {
      setPressed(idx);
      setTimeout(() => setPressed(null), 180);
      const next = current + 1;
      if (next >= sequence.length) { clearInterval(timerRef.current!); onSuccess(); }
      else { setCurrent(next); setTimeLeft(100); }
    } else {
      setWrongKey(true);
      clearInterval(timerRef.current!);
      setTimeout(() => onFail(), 300);
    }
  }, [sequence, current, onSuccess, onFail]);

  useEffect(() => {
    const keyMap: Record<string, number> = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    const handler = (e: KeyboardEvent) => { if (keyMap[e.key] !== undefined) { e.preventDefault(); handlePress(keyMap[e.key]); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePress]);

  const r = RARITY_CONFIG[fish.rarity];
  const isMythic = fish.rarity === "mythic";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: isMythic ? "rgba(88,28,135,0.4)" : "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }}>
      <div className="animate-pop-in bg-white rounded-2xl p-6 shadow-2xl mx-4" style={{ width: 320, border: `2px solid ${r.border}`, boxShadow: isMythic ? `0 0 32px ${fish.glowColor}88, 0 8px 32px rgba(0,0,0,0.2)` : undefined }}>
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <FishSprite fish={fish} size={isMythic ? 52 : 44} />
          </div>
          <div className="font-bold text-base" style={{ color: r.color }}>{isMythic ? "✦ " : ""}{fish.name}{isMythic ? " ✦" : ""}</div>
          <div className="text-xs font-medium mt-0.5" style={{ color: r.color }}>{r.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {isMythic ? "⚠️ Нажимай быстро — она очень сильная!" : "Нажимай стрелки по порядку"}
          </div>
        </div>

        <div className="h-2.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-none" style={{
            width: `${timeLeft}%`,
            background: isMythic
              ? (timeLeft > 50 ? "#a855f7" : timeLeft > 25 ? "#ec4899" : "#ef4444")
              : (timeLeft > 50 ? "hsl(var(--primary))" : timeLeft > 25 ? "#e8a020" : "#e05050"),
          }} />
        </div>

        <div className="flex justify-center gap-1.5 mb-4 flex-wrap">
          {sequence.map((btnIdx, i) => (
            <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-150 ${
              i < current ? "scale-90" : i === current ? "scale-110 shadow-md" : "opacity-35"
            }`}
              style={i < current
                ? { background: "#d1fae5", color: "#16a34a" }
                : i === current
                ? { background: r.bg, color: r.color, border: `2px solid ${r.border}` }
                : { background: "#f5f5f8", color: "#999" }}
            >
              {i < current ? "✓" : BUTTONS[btnIdx]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BUTTONS.map((btn, idx) => (
            <button key={idx} onPointerDown={() => handlePress(idx)}
              className={`h-14 rounded-xl text-2xl font-bold transition-all duration-100 select-none active:scale-95 ${
                pressed === idx ? "scale-90" : wrongKey ? "animate-shake" : "hover:scale-105"
              }`}
              style={{
                background: pressed === idx ? r.color : r.bg,
                color: pressed === idx ? "#fff" : r.color,
                border: `2px solid ${r.border}`,
              }}
            >
              {btn}
            </button>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-3">{current + 1} / {sequence.length}</div>
      </div>
    </div>
  );
}

// ─── Экран рыбалки ──────────────────────────────────────────────────────────

interface FloatingText { id: number; text: string; }

function FishingScreen({ coins, inventory, onCatch }: { coins: number; inventory: CaughtFish[]; onCatch: (fish: Fish) => void; }) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentFish, setCurrentFish] = useState<Fish | null>(null);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [lastCatch, setLastCatch] = useState<Fish | null>(null);
  const biteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatId = useRef(0);

  const addFloat = (text: string) => {
    const id = ++floatId.current;
    setFloats((f) => [...f, { id, text }]);
    setTimeout(() => setFloats((f) => f.filter((ff) => ff.id !== id)), 1400);
  };

  const pickFish = (): Fish => {
    const roll = Math.random() * 100;
    let cum = 0;
    for (const f of FISH_TYPES) { cum += f.chance; if (roll < cum) return f; }
    return FISH_TYPES[0];
  };

  const cast = () => {
    if (gameState !== "idle") return;
    setGameState("casting");
    setTimeout(() => {
      setGameState("waiting");
      const wait = 2500 + Math.random() * 5000;
      biteTimer.current = setTimeout(() => {
        const fish = pickFish();
        setCurrentFish(fish);
        setGameState("bite");
        biteTimer.current = setTimeout(() => {
          setGameState((gs) => { if (gs === "bite") { addFloat("Ушла..."); setCurrentFish(null); return "idle"; } return gs; });
        }, 2500);
      }, wait);
    }, 700);
  };

  const react = () => {
    if (gameState !== "bite" || !currentFish) return;
    if (biteTimer.current) clearTimeout(biteTimer.current);
    if (currentFish.id === "nothin") { addFloat("Пусто..."); setGameState("failed"); setTimeout(() => { setGameState("idle"); setCurrentFish(null); }, 1200); return; }
    setGameState("minigame");
  };

  const onMinigameSuccess = () => {
    if (!currentFish) return;
    setGameState("caught");
    setLastCatch(currentFish);
    onCatch(currentFish);
    addFloat(currentFish.rarity === "mythic" ? `🌟 +${currentFish.price} монет!!!` : `+${currentFish.price} монет`);
    setTimeout(() => { setGameState("idle"); setCurrentFish(null); setLastCatch(null); }, 2500);
  };

  const onMinigameFail = () => {
    setGameState("failed");
    addFloat("Сорвалась!");
    setTimeout(() => { setGameState("idle"); setCurrentFish(null); }, 1500);
  };

  useEffect(() => () => { if (biteTimer.current) clearTimeout(biteTimer.current); }, []);

  const isMythicCatch = lastCatch?.rarity === "mythic";

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #c8ebfa 0%, #ddf4ff 100%)" }}>
      {/* Монеты */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <div className="font-semibold text-sm" style={{ color: "#3a6a8a" }}>Кот-рыбак</div>
        <div className="flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-full" style={{ background: "#fff8e0", color: "#b87a10", border: "1.5px solid #e8c84a" }}>
          <span>🪙</span><span>{coins}</span>
        </div>
      </div>

      {/* Игровая сцена */}
      <div className="relative mx-3 rounded-2xl overflow-hidden shrink-0" style={{ height: 220 }}>
        <WaterScene state={gameState} lastFish={lastCatch} />

        {/* Рыбки слева */}
        <FishStack inventory={inventory} />

        {/* Кот */}
        <div className="absolute" style={{ bottom: 42, left: 60, zIndex: 10 }}>
          <div style={gameState === "idle" || gameState === "waiting" ? { animation: "catIdle 3s ease-in-out infinite" } : {}}>
            <CatSprite state={gameState} />
          </div>
          <FishingLine state={gameState} />
        </div>

        {/* Флоты */}
        {floats.map((f) => (
          <div key={f.id} className="absolute animate-float-up font-semibold text-sm pointer-events-none"
            style={{ bottom: 140, left: "50%", transform: "translateX(-50%)", color: isMythicCatch ? "#7c3aed" : "hsl(var(--primary))", textShadow: "0 1px 4px white", whiteSpace: "nowrap" }}>
            {f.text}
          </div>
        ))}

        {/* Баннер пойманной рыбы */}
        {gameState === "caught" && lastCatch && lastCatch.id !== "nothin" && (
          <div className="absolute animate-pop-in top-3 left-1/2 -translate-x-1/2 bg-white/95 rounded-2xl px-4 py-2 shadow-lg flex items-center gap-3 z-20"
            style={{ border: `2px solid ${RARITY_CONFIG[lastCatch.rarity].border}`, boxShadow: isMythicCatch ? `0 0 24px ${lastCatch.glowColor}88` : undefined }}>
            <FishSprite fish={lastCatch} size={36} />
            <div>
              <div className="font-bold text-sm leading-tight">{lastCatch.name}</div>
              <div className="text-xs font-medium" style={{ color: RARITY_CONFIG[lastCatch.rarity].color }}>{RARITY_CONFIG[lastCatch.rarity].label}</div>
            </div>
          </div>
        )}

        <style>{`@keyframes catIdle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`}</style>
      </div>

      {/* Панель действий */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        {gameState === "idle" && (
          <button onClick={cast}
            className="w-full h-13 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 hover:opacity-90 shadow-md"
            style={{ background: "hsl(var(--primary))", height: 52 }}>
            🎣 Забросить удочку
          </button>
        )}
        {gameState === "casting" && (
          <div className="w-full rounded-2xl flex items-center justify-center text-muted-foreground font-medium bg-muted" style={{ height: 52 }}>
            Забрасываю...
          </div>
        )}
        {gameState === "waiting" && (
          <div className="w-full rounded-2xl flex items-center justify-center font-medium bg-muted text-muted-foreground" style={{ height: 52 }}>
            <span className="animate-pulse">Жду клёва...</span>
          </div>
        )}
        {gameState === "bite" && (
          <button onClick={react}
            className="w-full rounded-2xl font-bold text-base animate-shake text-white transition-all active:scale-95 shadow-lg"
            style={{ background: "#e05050", height: 52 }}>
            ⚡ Клюёт! Подсекай!
          </button>
        )}
        {gameState === "failed" && (
          <div className="w-full rounded-2xl flex items-center justify-center font-medium text-muted-foreground bg-muted" style={{ height: 52 }}>
            😿 Сорвалась...
          </div>
        )}
        {gameState === "caught" && (
          <div className="w-full rounded-2xl flex items-center justify-center font-semibold text-white" style={{ background: "#4aaa60", height: 52 }}>
            🎉 Поймал!
          </div>
        )}
        {gameState === "minigame" && (
          <div className="w-full rounded-2xl flex items-center justify-center font-medium bg-muted text-muted-foreground" style={{ height: 52 }}>
            Борьба с рыбой...
          </div>
        )}
      </div>

      {/* Подсказка рыб */}
      <div className="px-4 pb-3 shrink-0">
        <div className="text-xs text-muted-foreground mb-1.5">Виды рыб</div>
        <div className="flex gap-1.5 flex-wrap">
          {FISH_TYPES.filter(f => f.id !== "nothin").map((f) => {
            const r = RARITY_CONFIG[f.rarity];
            return (
              <div key={f.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
                <FishSprite fish={f} size={16} />
                <span>{f.name}</span>
                <span className="opacity-60">{f.price}🪙</span>
              </div>
            );
          })}
        </div>
      </div>

      {gameState === "minigame" && currentFish && (
        <MiniGame fish={currentFish} onSuccess={onMinigameSuccess} onFail={onMinigameFail} />
      )}
    </div>
  );
}

// ─── Инвентарь ──────────────────────────────────────────────────────────────

function InventoryScreen({ inventory }: { inventory: CaughtFish[] }) {
  const total = inventory.reduce((sum, f) => sum + f.count, 0);
  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="text-6xl opacity-30" style={{ filter: "grayscale(1)" }}>🎣</div>
        <div className="text-muted-foreground text-base">Инвентарь пуст.<br />Пора на рыбалку!</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <div className="font-semibold text-base">Мой улов</div>
        <div className="text-sm text-muted-foreground">{total} рыб</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {inventory.map((fish) => {
          const r = RARITY_CONFIG[fish.rarity];
          const isMythic = fish.rarity === "mythic";
          return (
            <div key={fish.id} className="flex items-center gap-3 p-3 rounded-2xl animate-fade-up"
              style={{ background: r.bg, border: `1.5px solid ${r.border}`, boxShadow: isMythic ? `0 0 12px ${fish.glowColor}44` : undefined }}>
              <div className="shrink-0"><FishSprite fish={fish} size={38} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{fish.name}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: r.color }}>{r.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fish.description}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">шт.</div>
                <div className="font-bold text-xl leading-tight">{fish.count}</div>
                <div className="text-xs" style={{ color: "#b87a10" }}>🪙{fish.price}/шт</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Продажа ────────────────────────────────────────────────────────────────

function ShopScreen({ inventory, onSell }: { inventory: CaughtFish[]; onSell: (fishId: string, count: number) => void; }) {
  const [sold, setSold] = useState<string | null>(null);

  const handleSell = (fish: CaughtFish) => {
    onSell(fish.id, fish.count);
    setSold(fish.id);
    setTimeout(() => setSold(null), 1500);
  };

  const totalValue = inventory.reduce((sum, f) => sum + f.price * f.count, 0);

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="text-6xl opacity-30">🏪</div>
        <div className="text-muted-foreground text-base">Нечего продавать.<br />Поймай рыбу сначала!</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <div className="font-semibold text-base">Рыбный рынок</div>
        <div className="text-sm flex items-center gap-1 font-semibold" style={{ color: "#b87a10" }}>
          🪙 {totalValue} итого
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
        {inventory.map((fish) => {
          const r = RARITY_CONFIG[fish.rarity];
          const isSold = sold === fish.id;
          const isMythic = fish.rarity === "mythic";
          return (
            <div key={fish.id} className="flex items-center gap-3 p-3 rounded-2xl transition-opacity"
              style={{ background: r.bg, border: `1.5px solid ${r.border}`, opacity: isSold ? 0.4 : 1, boxShadow: isMythic ? `0 0 12px ${fish.glowColor}44` : undefined }}>
              <div className="shrink-0"><FishSprite fish={fish} size={36} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{fish.name}</div>
                <div className="text-xs font-medium" style={{ color: r.color }}>{r.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fish.count} шт. × 🪙{fish.price}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-bold text-sm" style={{ color: "#b87a10" }}>🪙{fish.price * fish.count}</div>
                <button onClick={() => handleSell(fish)} disabled={isSold}
                  className="mt-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: isSold ? "#aaa" : "hsl(var(--primary))" }}>
                  {isSold ? "Продано!" : "Продать всё"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 pb-4 shrink-0">
        <button onClick={() => inventory.forEach((f) => handleSell(f))}
          className="w-full h-12 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 hover:opacity-90"
          style={{ background: "#4aaa60" }}>
          💰 Продать всё ({totalValue} монет)
        </button>
      </div>
    </div>
  );
}

// ─── Навигация ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Screen; emoji: string; label: string }[] = [
  { id: "fishing",   emoji: "🎣", label: "Рыбалка" },
  { id: "inventory", emoji: "📦", label: "Инвентарь" },
  { id: "shop",      emoji: "🏪", label: "Продажа" },
];

// ─── App ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [screen, setScreen] = useState<Screen>("fishing");
  const [coins, setCoins] = useState(50);
  const [inventory, setInventory] = useState<CaughtFish[]>([]);

  const handleCatch = (fish: Fish) => {
    if (fish.id === "nothin" || fish.price === 0) return;
    setInventory((inv) => {
      const existing = inv.find((f) => f.id === fish.id);
      if (existing) return inv.map((f) => f.id === fish.id ? { ...f, count: f.count + 1 } : f);
      return [...inv, { ...fish, count: 1 }];
    });
  };

  const handleSell = (fishId: string, count: number) => {
    const fish = inventory.find((f) => f.id === fishId);
    if (!fish) return;
    setCoins((c) => c + fish.price * count);
    setInventory((inv) => inv.filter((f) => f.id !== fishId));
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#b8d8e8" }}>
      <div className="relative flex flex-col overflow-hidden shadow-2xl"
        style={{ width: "min(480px, 100vw)", height: "min(720px, 100svh)", borderRadius: "2rem", background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex-1 overflow-hidden">
          {screen === "fishing"   && <FishingScreen  coins={coins} inventory={inventory} onCatch={handleCatch} />}
          {screen === "inventory" && <InventoryScreen inventory={inventory} />}
          {screen === "shop"      && <ShopScreen      inventory={inventory} onSell={handleSell} />}
        </div>
        <nav className="shrink-0 flex border-t border-border bg-white/80 backdrop-blur-sm" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all"
              style={{ color: screen === item.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
              <span className={`text-xl transition-transform duration-200 ${screen === item.id ? "scale-125" : "scale-100"}`}>{item.emoji}</span>
              <span className={`text-xs font-medium ${screen === item.id ? "opacity-100" : "opacity-60"}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
