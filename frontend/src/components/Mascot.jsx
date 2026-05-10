import React from 'react';

export function Mascot() {
  return (
    <div className="fixed bottom-4 right-4 z-10">
      <svg
        width="80"
        height="80"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-bounce"
      >
        <circle cx="50" cy="50" r="48" stroke="#F87171" strokeWidth="4" />
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="36"
          fontFamily="sans-serif"
          fill="#F87171"
        >
          🎓
        </text>
      </svg>
    </div>
  );
}