import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, TicketPercent, AlertCircle, X } from 'lucide-react';

const SEGMENTS = [
  { label: '5% OFF',     value: 5,  color: '#cc0000' },
  { label: 'TRY AGAIN', value: 0,  color: '#111111' },
  { label: '10% OFF',   value: 10, color: '#cc0000' },
  { label: 'NO LUCK',   value: 0,  color: '#111111' },
  { label: '15% OFF',   value: 15, color: '#cc0000' },
  { label: '7% OFF',    value: 7,  color: '#111111' },
];

export interface SpinResult {
  label: string;
  value: number;
}

interface SpinWheelProps {
  onWin?: (result: SpinResult) => void;
}

const SIZE = 300;
const R = SIZE / 2;
const COUNT = SEGMENTS.length;
const SLICE = (2 * Math.PI) / COUNT;
const SLICE_DEG = 360 / COUNT;

function polarToXY(angle: number, r: number) {
  return {
    x: R + r * Math.cos(angle),
    y: R + r * Math.sin(angle),
  };
}

function slicePath(i: number) {
  const start = i * SLICE - Math.PI / 2;
  const end = start + SLICE;
  const outer = R - 4;
  const p1 = polarToXY(start, outer);
  const p2 = polarToXY(end, outer);
  const large = SLICE > Math.PI ? 1 : 0;
  return `M ${R} ${R} L ${p1.x} ${p1.y} A ${outer} ${outer} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
}

function labelTransform(i: number) {
  const mid = i * SLICE - Math.PI / 2 + SLICE / 2;
  const r = R * 0.62;
  const { x, y } = polarToXY(mid, r);
  const deg = (mid * 180) / Math.PI + 90;
  return { x, y, deg };
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ onWin }) => {
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [result, setResult] = React.useState<SpinResult | null>(null);
  const [winningIndex, setWinningIndex] = React.useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const normalizeDeg = (deg: number) => ((deg % 360) + 360) % 360;

  const getPointerIndexFromRotation = (wheelRotationDeg: number) => {
    // Pointer is fixed at top (270deg in SVG space). Convert to wheel-local angle.
    const normalized = normalizeDeg(wheelRotationDeg);
    const localAtPointer = normalizeDeg(270 - normalized);
    return Math.floor(normalizeDeg(localAtPointer - 270) / SLICE_DEG) % COUNT;
  };

  const getDesiredRotationForIndex = (index: number) => {
    // Center of segment i in local wheel coordinates is:
    // center(i) = -60 + i*60 for 6 slices (because first slice starts at -90).
    // Make that center align with pointer at -90.
    return normalizeDeg(330 - index * SLICE_DEG);
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);
    setWinningIndex(null);

    const intendedIndex = Math.floor(Math.random() * COUNT);
    const desiredAbsolute = getDesiredRotationForIndex(intendedIndex);
    const current = normalizeDeg(rotation);
    const delta = normalizeDeg(desiredAbsolute - current) + 360 * 5;
    const finalRotation = rotation + delta;
    setRotation(finalRotation);

    setTimeout(() => {
      const landedIndex = getPointerIndexFromRotation(finalRotation);
      const landed = SEGMENTS[landedIndex];
      setResult(landed);
      setWinningIndex(landedIndex);
      setIsSpinning(false);
      onWin?.(landed);
    }, 3600);
  };

  const getResultMessage = (spinResult: SpinResult | null) => {
    if (!spinResult) return null;

    if (spinResult.value > 0) {
      return {
        title: `Congratulations! You unlocked ${spinResult.value}% OFF.`,
        subtitle: `Your luck hit the "${spinResult.label}" sector. Use your discount at checkout.`,
      };
    }

    if (spinResult.label === 'TRY AGAIN') {
      return {
        title: 'Almost there! Spin your luck again.',
        subtitle: 'This round landed on "TRY AGAIN" - your next spin could unlock a big discount.',
      };
    }

    return {
      title: 'No luck this time - your style still wins.',
      subtitle: 'You landed on "NO LUCK". Give it another spin and chase the next reward.',
    };
  };

  const resultMessage = getResultMessage(result);

  return (
    <>
      {/* Floating trigger: bottom-left */}
      <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-[120]">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group bg-black text-white rounded-full pl-2 pr-5 py-2.5 flex items-center gap-3 shadow-2xl hover:bg-black/90 active:scale-95 transition-all"
        >
          <span className="h-10 w-10 rounded-full border-2 border-white/80 relative overflow-hidden">
            <span className="absolute inset-0 bg-[conic-gradient(from_0deg,#cc0000_0deg,#cc0000_60deg,#111111_60deg,#111111_120deg,#cc0000_120deg,#cc0000_180deg,#111111_180deg,#111111_240deg,#cc0000_240deg,#cc0000_300deg,#111111_300deg,#111111_360deg)]" />
            <span className="absolute inset-3 rounded-full bg-black border border-white/70" />
            <span className="absolute inset-[17px] rounded-full bg-white" />
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">
            Spin &amp; Win
          </span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-6xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors"
              aria-label="Close spin wheel"
            >
              <X size={18} />
            </button>

            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center p-5 sm:p-8 md:p-10">
              <div className="relative z-10">
                <div className="bg-black rounded-[24px] sm:rounded-[30px] p-6 sm:p-8 overflow-hidden">
                  <div className="absolute -left-16 bottom-0 w-60 h-60 bg-red-700/40 rounded-full blur-[100px] pointer-events-none" />

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                      <Sparkles size={18} className="text-red-500" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                      Spin to unlock
                    </p>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white mb-3 sm:mb-4">
                    Spin the Wheel.
                    <br />
                    <span className="text-red-500">Steal the Deal.</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-white/60 max-w-md mb-6 sm:mb-8">
                    Click <strong className="text-white">Spin &amp; Win</strong>. The sector under the pointer is your reward.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <button
                      type="button"
                      onClick={handleSpin}
                      className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-full bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all"
                    >
                      {isSpinning ? 'Spinning…' : 'Spin & Win'}
                    </button>

                    {result && result.value > 0 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/40">
                        <TicketPercent size={16} className="text-red-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">
                          You won {result.value}% OFF
                        </span>
                      </div>
                    )}
                    {result && result.value === 0 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <AlertCircle size={16} className="text-white/50" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                          Better luck next spin!
                        </span>
                      </div>
                    )}
                  </div>

                  {resultMessage && (
                    <div className="space-y-1">
                      <p className="text-sm text-white font-semibold">
                        {resultMessage.title}
                      </p>
                      <p className="text-xs text-white/55 font-medium">
                        {resultMessage.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-[260px] h-[292px] sm:w-[300px] sm:h-[332px]">
                  <div
                    className="absolute left-1/2 z-20"
                    style={{ top: 0, transform: 'translateX(-50%)' }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-black border-2 border-white shadow-lg" />
                      <div
                        className="w-0 h-0"
                        style={{
                          borderLeft: '10px solid transparent',
                          borderRight: '10px solid transparent',
                          borderTop: '22px solid black',
                        }}
                      />
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: rotation }}
                    transition={{ duration: 3.5, ease: [0.19, 1.0, 0.22, 1.0] }}
                    className="absolute"
                    style={{ top: 32, left: 0, right: 0, bottom: 0 }}
                  >
                    <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
                      <defs>
                        <clipPath id="wheel-clip">
                          <circle cx={R} cy={R} r={R - 6} />
                        </clipPath>
                      </defs>

                      <g clipPath="url(#wheel-clip)">
                        {SEGMENTS.map((seg, i) => {
                          const isWinner = winningIndex === i && result !== null;
                          return (
                            <g key={i}>
                              <path
                                d={slicePath(i)}
                                fill={isWinner ? '#facc15' : seg.color}
                                stroke="white"
                                strokeWidth={2}
                              />
                              {(() => {
                                const { x, y, deg } = labelTransform(i);
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    transform={`rotate(${deg}, ${x}, ${y})`}
                                    fontSize={13}
                                    fontWeight="900"
                                    fill={isWinner ? '#000' : '#ffffff'}
                                    style={{ fontFamily: 'sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}
                                  >
                                    {seg.label}
                                  </text>
                                );
                              })()}
                            </g>
                          );
                        })}
                      </g>

                      <circle cx={R} cy={R} r={R - 6} fill="none" stroke="black" strokeWidth={12} />
                      <circle cx={R} cy={R} r={22} fill="black" />
                      <circle cx={R} cy={R} r={12} fill="white" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
