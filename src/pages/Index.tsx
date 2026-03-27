import { useState, useEffect, useRef, useCallback } from "react";

// ─── Типы и константы ──────────────────────────────────────────────────────

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
type Screen = "home" | "fishing" | "inventory" | "shop";
type GameState = "idle" | "casting" | "waiting" | "bite" | "minigame" | "caught" | "failed";

interface Fish {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  price: number;
  color: string;
  chance: number;
  description: string;
}

interface CaughtFish extends Fish {
  count: number;
}

const FISH_TYPES: Fish[] = [
  {
    id: "crucian",
    name: "Карась",
    emoji: "🐟",
    rarity: "common",
    price: 15,
    color: "#c8a96e",
    chance: 40,
    description: "Самая обычная рыба в пруду",
  },
  {
    id: "perch",
    name: "Окунь",
    emoji: "🐠",
    rarity: "uncommon",
    price: 45,
    color: "#5b9bd5",
    chance: 28,
    description: "Полосатый хищник с острыми плавниками",
  },
  {
    id: "pike",
    name: "Щука",
    emoji: "🦈",
    rarity: "rare",
    price: 120,
    color: "#6aab69",
    chance: 18,
    description: "Зубастая хозяйка реки",
  },
  {
    id: "salmon",
    name: "Лосось",
    emoji: "🐡",
    rarity: "epic",
    price: 320,
    color: "#e8735a",
    chance: 10,
    description: "Мощная рыба из горных рек",
  },
  {
    id: "goldfish",
    name: "Золотая рыбка",
    emoji: "✨",
    rarity: "legendary",
    price: 999,
    color: "#f5c842",
    chance: 4,
    description: "Исполняет желания... или нет",
  },
];

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; border: string }> = {
  common:    { label: "Обычная",     color: "#7a7a8a", bg: "#f0f0f4", border: "#d0d0da" },
  uncommon:  { label: "Необычная",   color: "#3a8f4a", bg: "#eaf4eb", border: "#a8d9ae" },
  rare:      { label: "Редкая",      color: "#2a6fbb", bg: "#e8f0fb", border: "#9abde8" },
  epic:      { label: "Эпическая",   color: "#8a3fbc", bg: "#f3ebfb", border: "#c9a0e0" },
  legendary: { label: "Легендарная", color: "#c47a10", bg: "#fdf4e3", border: "#e8c87a" },
};

// ─── Мини-игра ──────────────────────────────────────────────────────────────

const BUTTONS = ["←", "→", "↑", "↓"];
const MINIGAME_STEPS = 5;

interface MiniGameProps {
  fish: Fish;
  onSuccess: () => void;
  onFail: () => void;
}

function MiniGame({ fish, onSuccess, onFail }: MiniGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [pressed, setPressed] = useState<number | null>(null);
  const [wrongKey, setWrongKey] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const seq = Array.from({ length: MINIGAME_STEPS }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
  }, []);

  useEffect(() => {
    if (sequence.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          clearInterval(timerRef.current!);
          onFail();
          return 0;
        }
        return t - (100 / (MINIGAME_STEPS * 25));
      });
    }, 40);
    return () => clearInterval(timerRef.current!);
  }, [sequence, onFail]);

  const handlePress = useCallback((idx: number) => {
    if (sequence[current] === idx) {
      setPressed(idx);
      setTimeout(() => setPressed(null), 200);
      const next = current + 1;
      if (next >= MINIGAME_STEPS) {
        clearInterval(timerRef.current!);
        onSuccess();
      } else {
        setCurrent(next);
        setTimeLeft(100);
      }
    } else {
      setWrongKey(true);
      clearInterval(timerRef.current!);
      setTimeout(() => onFail(), 300);
    }
  }, [sequence, current, onSuccess, onFail]);

  useEffect(() => {
    const keyMap: Record<string, number> = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    const handler = (e: KeyboardEvent) => {
      if (keyMap[e.key] !== undefined) {
        e.preventDefault();
        handlePress(keyMap[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePress]);

  const rarity = RARITY_CONFIG[fish.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="animate-pop-in bg-white rounded-2xl p-6 shadow-2xl w-80 mx-4" style={{ border: `2px solid ${rarity.border}` }}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-1">{fish.emoji}</div>
          <div className="font-semibold text-base" style={{ color: rarity.color }}>Клюёт {fish.name}!</div>
          <div className="text-xs text-muted-foreground mt-0.5">Нажимай стрелки в нужном порядке</div>
        </div>

        <div className="h-2 bg-muted rounded-full mb-5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${timeLeft}%`,
              background: timeLeft > 50 ? "hsl(var(--primary))" : timeLeft > 25 ? "#e8a020" : "#e05050",
              transition: "background 0.3s",
            }}
          />
        </div>

        <div className="flex justify-center gap-2 mb-5">
          {sequence.map((btnIdx, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-150 ${
                i < current
                  ? "bg-green-100 text-green-600 scale-90"
                  : i === current
                  ? "scale-110 shadow-md"
                  : "opacity-40"
              }`}
              style={i === current ? { background: rarity.bg, color: rarity.color, border: `2px solid ${rarity.border}` } : { background: "#f5f5f8" }}
            >
              {BUTTONS[btnIdx]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BUTTONS.map((btn, idx) => (
            <button
              key={idx}
              onPointerDown={() => handlePress(idx)}
              className={`h-14 rounded-xl text-2xl font-bold transition-all duration-100 select-none active:scale-95 ${
                pressed === idx ? "scale-90 shadow-inner" : wrongKey ? "animate-shake" : "hover:scale-105"
              }`}
              style={{
                background: pressed === idx ? rarity.color : rarity.bg,
                color: pressed === idx ? "#fff" : rarity.color,
                border: `2px solid ${rarity.border}`,
              }}
            >
              {btn}
            </button>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground mt-3">
          {current + 1} / {MINIGAME_STEPS} нажатий
        </div>
      </div>
    </div>
  );
}

// ─── Экран рыбалки ──────────────────────────────────────────────────────────

interface FloatingText {
  id: number;
  text: string;
  x: number;
}

function FishingScreen({
  coins,
  onCatch,
}: {
  coins: number;
  inventory: CaughtFish[];
  onCatch: (fish: Fish) => void;
}) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentFish, setCurrentFish] = useState<Fish | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [lastCatch, setLastCatch] = useState<Fish | null>(null);
  const biteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatId = useRef(0);

  const addFloat = (text: string, x = 50) => {
    const id = ++floatId.current;
    setFloats((f) => [...f, { id, text, x }]);
    setTimeout(() => setFloats((f) => f.filter((ff) => ff.id !== id)), 1100);
  };

  const pickFish = (): Fish => {
    const roll = Math.random() * 100;
    let cum = 0;
    for (const f of FISH_TYPES) {
      cum += f.chance;
      if (roll < cum) return f;
    }
    return FISH_TYPES[0];
  };

  const cast = () => {
    if (gameState !== "idle") return;
    setGameState("casting");
    setTimeout(() => {
      setGameState("waiting");
      const wait = 3000 + Math.random() * 5000;
      biteTimer.current = setTimeout(() => {
        const fish = pickFish();
        setCurrentFish(fish);
        setGameState("bite");
        biteTimer.current = setTimeout(() => {
          setGameState((gs) => {
            if (gs === "bite") {
              addFloat("Ушла...", 60);
              setCurrentFish(null);
              return "idle";
            }
            return gs;
          });
        }, 2500);
      }, wait);
    }, 800);
  };

  const react = () => {
    if (gameState !== "bite") return;
    if (biteTimer.current) clearTimeout(biteTimer.current);
    setGameState("minigame");
  };

  const onMinigameSuccess = () => {
    if (!currentFish) return;
    setGameState("caught");
    setShowSplash(true);
    setLastCatch(currentFish);
    onCatch(currentFish);
    addFloat(`+${currentFish.price} монет`, 40);
    setTimeout(() => setShowSplash(false), 600);
    setTimeout(() => {
      setGameState("idle");
      setCurrentFish(null);
      setLastCatch(null);
    }, 2200);
  };

  const onMinigameFail = () => {
    setGameState("failed");
    addFloat("Сорвалась!", 55);
    setTimeout(() => {
      setGameState("idle");
      setCurrentFish(null);
    }, 1500);
  };

  useEffect(() => {
    return () => { if (biteTimer.current) clearTimeout(biteTimer.current); };
  }, []);

  const bobberClass =
    gameState === "bite" ? "animate-bobber-bite" :
    gameState === "waiting" ? "animate-bobber" : "";

  return (
    <div className="flex flex-col h-full relative select-none">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="text-sm text-muted-foreground">В кармане</div>
        <div className="flex items-center gap-1.5 font-semibold text-base" style={{ color: "hsl(var(--coin))" }}>
          <span>🪙</span>
          <span>{coins}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl mx-4 mb-3" style={{ background: "linear-gradient(180deg, hsl(200,60%,88%) 0%, hsl(200,50%,78%) 40%, hsl(205,55%,65%) 100%)" }}>
        <div className="absolute top-4 left-8 w-16 h-5 bg-white/60 rounded-full blur-sm" />
        <div className="absolute top-6 left-16 w-10 h-4 bg-white/50 rounded-full blur-sm" />
        <div className="absolute top-5 right-12 w-14 h-4 bg-white/50 rounded-full blur-sm" />

        <div className="absolute bottom-0 left-0 right-0 h-20 rounded-b-2xl" style={{ background: "linear-gradient(180deg, hsl(38,55%,82%) 0%, hsl(38,50%,72%) 100%)" }}>
          <div className="absolute top-0 left-0 right-0 h-2 rounded-full" style={{ background: "hsl(120,30%,60%)", opacity: 0.7 }} />
        </div>

        <div className="absolute bottom-20 left-0 right-0 h-8 opacity-40" style={{ background: "linear-gradient(180deg, hsl(200,60%,72%) 0%, transparent 100%)" }} />

        <div className="absolute" style={{ bottom: "105px", left: "calc(50% - 40px)", overflow: "visible", opacity: 0.35 }}>
          <div className="animate-fish-swim text-2xl">🐟</div>
        </div>

        <div
          className={`absolute text-5xl ${gameState === "idle" ? "animate-cat-idle" : ""} ${gameState === "failed" ? "animate-shake" : ""}`}
          style={{ bottom: "72px", left: "18%", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}
        >
          {gameState === "caught" ? "😸" : gameState === "bite" ? "😲" : "🐱"}
        </div>

        {gameState !== "idle" && (
          <div className="absolute" style={{ bottom: "104px", left: "calc(18% + 52px)" }}>
            <svg width="120" height="80" className="overflow-visible">
              <line x1="0" y1="0" x2="110" y2="-30" stroke="#8B6914" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="110" y1="-30" x2="110" y2="30" stroke="#ccc" strokeWidth="1" strokeDasharray="3,2" />
              <circle cx="110" cy="30" r="5" fill="#e05050" stroke="#fff" strokeWidth="1.5" className={bobberClass} />
            </svg>
          </div>
        )}

        {showSplash && (
          <div className="absolute animate-splash text-3xl" style={{ bottom: "130px", left: "calc(18% + 160px)" }}>
            💦
          </div>
        )}

        {floats.map((f) => (
          <div
            key={f.id}
            className="absolute animate-float-up text-sm font-semibold pointer-events-none"
            style={{ bottom: "140px", left: `${f.x}%`, transform: "translateX(-50%)", color: "hsl(var(--primary))", textShadow: "0 1px 3px white" }}
          >
            {f.text}
          </div>
        ))}

        {gameState === "caught" && lastCatch && (
          <div className="absolute animate-pop-in top-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-xl px-4 py-2 shadow-md flex items-center gap-2">
            <span className="text-2xl">{lastCatch.emoji}</span>
            <div>
              <div className="font-semibold text-sm leading-tight">{lastCatch.name}</div>
              <div className="text-xs" style={{ color: RARITY_CONFIG[lastCatch.rarity].color }}>{RARITY_CONFIG[lastCatch.rarity].label}</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-2">
        {gameState === "idle" && (
          <button
            onClick={cast}
            className="w-full h-14 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 hover:opacity-90 shadow-md"
            style={{ background: "hsl(var(--primary))" }}
          >
            🎣 Забросить удочку
          </button>
        )}
        {gameState === "casting" && (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center text-muted-foreground font-medium bg-muted">
            Забрасываю...
          </div>
        )}
        {gameState === "waiting" && (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center font-medium bg-muted text-muted-foreground">
            <span className="animate-pulse">Жду клёва...</span>
          </div>
        )}
        {gameState === "bite" && (
          <button
            onClick={react}
            className="w-full h-14 rounded-2xl font-bold text-base animate-shake text-white transition-all active:scale-95 shadow-lg"
            style={{ background: "#e05050" }}
          >
            ⚡ Клюёт! Подсекай!
          </button>
        )}
        {gameState === "failed" && (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center font-medium text-muted-foreground bg-muted">
            😿 Сорвалась...
          </div>
        )}
        {gameState === "caught" && (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center font-semibold text-white" style={{ background: "#4aaa60" }}>
            🎉 Поймал!
          </div>
        )}
        {gameState === "minigame" && (
          <div className="w-full h-14 rounded-2xl flex items-center justify-center font-medium bg-muted text-muted-foreground">
            Борьба с рыбой...
          </div>
        )}
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
        <div className="text-6xl opacity-40">🎣</div>
        <div className="text-muted-foreground text-base">Инвентарь пуст.<br />Пора на рыбалку!</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="font-semibold text-base">Мой улов</div>
        <div className="text-sm text-muted-foreground">{total} рыб</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {inventory.map((fish) => {
          const r = RARITY_CONFIG[fish.rarity];
          return (
            <div
              key={fish.id}
              className="animate-fade-up flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: r.bg, border: `1.5px solid ${r.border}` }}
            >
              <div className="text-3xl">{fish.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{fish.name}</div>
                <div className="text-xs mt-0.5" style={{ color: r.color }}>{r.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fish.description}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">шт.</div>
                <div className="font-bold text-lg leading-tight">{fish.count}</div>
                <div className="text-xs" style={{ color: "hsl(var(--coin))" }}>🪙{fish.price}/шт</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Продажа ────────────────────────────────────────────────────────────────

function ShopScreen({
  inventory,
  onSell,
}: {
  inventory: CaughtFish[];
  onSell: (fishId: string, count: number) => void;
}) {
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
        <div className="text-6xl opacity-40">🏪</div>
        <div className="text-muted-foreground text-base">Нечего продавать.<br />Поймай рыбу сначала!</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="font-semibold text-base">Рыбный рынок</div>
        <div className="text-sm flex items-center gap-1" style={{ color: "hsl(var(--coin))" }}>
          <span>🪙</span>
          <span className="font-semibold">{totalValue} итого</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {inventory.map((fish) => {
          const r = RARITY_CONFIG[fish.rarity];
          const isSold = sold === fish.id;
          return (
            <div
              key={fish.id}
              className="flex items-center gap-3 p-3 rounded-2xl transition-opacity"
              style={{ background: r.bg, border: `1.5px solid ${r.border}`, opacity: isSold ? 0.4 : 1 }}
            >
              <div className="text-3xl">{fish.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{fish.name}</div>
                <div className="text-xs mt-0.5" style={{ color: r.color }}>{r.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fish.count} шт. × 🪙{fish.price}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-muted-foreground mb-1">итого</div>
                <div className="font-bold text-sm" style={{ color: "hsl(var(--coin))" }}>🪙{fish.price * fish.count}</div>
                <button
                  onClick={() => handleSell(fish)}
                  disabled={isSold}
                  className="mt-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: isSold ? "#aaa" : "hsl(var(--primary))" }}
                >
                  {isSold ? "Продано!" : "Продать всё"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {inventory.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => inventory.forEach((f) => handleSell(f))}
            className="w-full h-12 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95 hover:opacity-90"
            style={{ background: "#4aaa60" }}
          >
            💰 Продать всё ({totalValue} монет)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Главная ─────────────────────────────────────────────────────────────────

function HomeScreen({
  coins,
  inventory,
  onNavigate,
}: {
  coins: number;
  inventory: CaughtFish[];
  onNavigate: (s: Screen) => void;
}) {
  const totalFish = inventory.reduce((sum, f) => sum + f.count, 0);
  const legendaryCount = inventory.find((f) => f.id === "goldfish")?.count ?? 0;

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-4">
      <div className="text-center">
        <div className="text-7xl mb-2 animate-cat-idle inline-block">🐱</div>
        <div className="font-bold text-2xl leading-tight">Кот-рыбак</div>
        <div className="text-muted-foreground text-sm mt-1">Рыбачим, продаём, богатеем</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: "hsl(var(--secondary))" }}>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--coin))" }}>🪙 {coins}</div>
          <div className="text-xs text-muted-foreground mt-0.5">монет</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "hsl(var(--secondary))" }}>
          <div className="text-2xl font-bold">{totalFish} 🐟</div>
          <div className="text-xs text-muted-foreground mt-0.5">в инвентаре</div>
        </div>
      </div>

      {legendaryCount > 0 && (
        <div className="rounded-2xl p-3 flex items-center gap-3 animate-pop-in" style={{ background: RARITY_CONFIG.legendary.bg, border: `1.5px solid ${RARITY_CONFIG.legendary.border}` }}>
          <span className="text-2xl">✨</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: RARITY_CONFIG.legendary.color }}>Золотые рыбки: {legendaryCount}</div>
            <div className="text-xs text-muted-foreground">Легендарный улов!</div>
          </div>
        </div>
      )}

      <div className="space-y-2 mt-auto">
        <button
          onClick={() => onNavigate("fishing")}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base transition-all active:scale-95 hover:opacity-90 shadow-md"
          style={{ background: "hsl(var(--primary))" }}
        >
          🎣 На рыбалку
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate("inventory")}
            className="h-12 rounded-2xl font-medium text-sm transition-all active:scale-95 hover:opacity-90"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}
          >
            📦 Инвентарь
          </button>
          <button
            onClick={() => onNavigate("shop")}
            className="h-12 rounded-2xl font-medium text-sm transition-all active:scale-95 hover:opacity-90"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}
          >
            🏪 Продажа
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">Виды рыб</div>
        <div className="flex gap-2 flex-wrap">
          {FISH_TYPES.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: RARITY_CONFIG[f.rarity].bg, color: RARITY_CONFIG[f.rarity].color, border: `1px solid ${RARITY_CONFIG[f.rarity].border}` }}
            >
              <span>{f.emoji}</span>
              <span>{f.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Навигация ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Screen; emoji: string; label: string }[] = [
  { id: "home",      emoji: "🏠", label: "Главная" },
  { id: "fishing",   emoji: "🎣", label: "Рыбалка" },
  { id: "inventory", emoji: "📦", label: "Инвентарь" },
  { id: "shop",      emoji: "🏪", label: "Продажа" },
];

// ─── App ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [coins, setCoins] = useState(50);
  const [inventory, setInventory] = useState<CaughtFish[]>([]);

  const handleCatch = (fish: Fish) => {
    setInventory((inv) => {
      const existing = inv.find((f) => f.id === fish.id);
      if (existing) {
        return inv.map((f) => f.id === fish.id ? { ...f, count: f.count + 1 } : f);
      }
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
      <div
        className="relative flex flex-col overflow-hidden shadow-2xl"
        style={{
          width: "min(420px, 100vw)",
          height: "min(780px, 100svh)",
          borderRadius: "2rem",
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="flex-1 overflow-hidden">
          {screen === "home" && (
            <HomeScreen coins={coins} inventory={inventory} onNavigate={setScreen} />
          )}
          {screen === "fishing" && (
            <FishingScreen coins={coins} inventory={inventory} onCatch={handleCatch} />
          )}
          {screen === "inventory" && (
            <InventoryScreen inventory={inventory} />
          )}
          {screen === "shop" && (
            <ShopScreen inventory={inventory} onSell={handleSell} />
          )}
        </div>

        <nav className="shrink-0 flex border-t border-border bg-white/80 backdrop-blur-sm" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all"
              style={{ color: screen === item.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
            >
              <span className={`text-xl transition-transform duration-200 ${screen === item.id ? "scale-125" : "scale-100"}`}>
                {item.emoji}
              </span>
              <span className={`text-xs font-medium transition-opacity ${screen === item.id ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
