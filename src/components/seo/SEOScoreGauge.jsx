import React from 'react';
import { Card } from "@/components/ui/card";

export default function SEOScoreGauge({ score, label, size = "lg" }) {
  const getColor = (score) => {
    if (score >= 80) return { stroke: "#10b981", bg: "#d1fae5", text: "text-emerald-600" };
    if (score >= 60) return { stroke: "#f59e0b", bg: "#fef3c7", text: "text-amber-600" };
    if (score >= 40) return { stroke: "#f97316", bg: "#ffedd5", text: "text-orange-600" };
    return { stroke: "#ef4444", bg: "#fee2e2", text: "text-red-600" };
  };

  const colors = getColor(score || 0);
  const radius = size === "lg" ? 70 : 45;
  const strokeWidth = size === "lg" ? 10 : 8;
  const circumference = 2 * Math.PI * radius;
  const progress = ((score || 0) / 100) * circumference;

  return (
    <Card className="p-6 border-0 shadow-sm bg-white flex flex-col items-center justify-center">
      <div className="relative">
        <svg 
          width={size === "lg" ? 180 : 120} 
          height={size === "lg" ? 180 : 120} 
          className="transform -rotate-90"
        >
          <circle
            cx={size === "lg" ? 90 : 60}
            cy={size === "lg" ? 90 : 60}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size === "lg" ? 90 : 60}
            cy={size === "lg" ? 90 : 60}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${size === "lg" ? 'text-4xl' : 'text-2xl'} font-bold ${colors.text}`}>
            {score !== null && score !== undefined ? score : 0}
          </span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      {label && (
        <p className="mt-3 text-sm font-medium text-gray-600">{label}</p>
      )}
    </Card>
  );
}