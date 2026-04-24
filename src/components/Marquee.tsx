import React from 'react';

interface MarqueeProps {
  text: string;
  speed?: number;
}

export const Marquee: React.FC<MarqueeProps> = ({ text, speed = 20 }) => {
  return (
    <div className="bg-ink text-paper py-1 overflow-hidden whitespace-nowrap border-y border-ink/10 relative z-[60]">
      <div 
        className="inline-block animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {Array(10).fill(0).map((_, i) => (
          <span key={i} className="mx-4 font-bold text-[10px] uppercase tracking-[0.2em]">
            {text} •
          </span>
        ))}
      </div>
      <div 
        className="inline-block animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {Array(10).fill(0).map((_, i) => (
          <span key={i} className="mx-4 font-bold text-[10px] uppercase tracking-[0.2em]">
            {text} •
          </span>
        ))}
      </div>
    </div>
  );
};
