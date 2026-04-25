import React from 'react'

const CircularProgress = ({ value = 75, size = 100, stroke = 10 }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;
  
    return (
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb" // Tailwind gray-200
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6" // Tailwind blue-500
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500"
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="text-sm font-medium fill-neutral-700"
          >
            {value}%
          </text>
        </svg>
      </div>
    );
  };
  

export default CircularProgress