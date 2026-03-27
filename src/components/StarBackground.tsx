import React from 'react';

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

// Fixed: Moved star generation globally to keep component pure and avoid render-time impurity errors.
const STAR_COLORS = [
  'bg-white',
  'bg-blue-100',
  'bg-indigo-100',
  'bg-slate-200',
  'bg-sky-200'
];

const GENERATED_STARS: Star[] = Array.from({ length: 450 }).map((_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: Math.random() * 1.6 + 0.6,
  opacity: Math.random() * 0.6 + 0.2,
  duration: Math.random() * 6 + 4,
  delay: Math.random() * 10,
  color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
}));

export default function StarBackground() {
  return (
    <div className="fixed -top-[30%] -left-[30%] w-[160vw] h-[160vh] pointer-events-none overflow-hidden z-0 transition-opacity duration-1000 animate-slow-rotate">
      {GENERATED_STARS.map((star: Star) => (
        <div
          key={star.id}
          className={`absolute rounded-full animate-twinkle ${star.color}`}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            boxShadow: star.size > 1.2 ? `0 0 4px 1px rgba(255, 255, 255, 0.4)` : 'none'
          }}
        />
      ))}
    </div>
  );
}
