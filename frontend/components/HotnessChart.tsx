'use client';

import { HotnessScore } from '@/lib/types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface HotnessChartProps {
  hotness: HotnessScore;
}

export default function HotnessChart({ hotness }: HotnessChartProps) {
  const data = [
    {
      metric: 'Неожиданность',
      value: hotness.unexpectedness * 100,
      fullMark: 100,
    },
    {
      metric: 'Значимость',
      value: hotness.materiality * 100,
      fullMark: 100,
    },
    {
      metric: 'Скорость',
      value: hotness.velocity * 100,
      fullMark: 100,
    },
    {
      metric: 'Охват',
      value: hotness.breadth * 100,
      fullMark: 100,
    },
    {
      metric: 'Достоверность',
      value: hotness.credibility * 100,
      fullMark: 100,
    },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Radar name="Hotness" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

