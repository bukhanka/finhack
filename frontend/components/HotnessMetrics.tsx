'use client';

import { HotnessScore } from '@/lib/types';
import { motion } from 'framer-motion';

interface HotnessMetricsProps {
  hotness: HotnessScore;
}

const metrics = [
  { key: 'unexpectedness', label: 'Unexpectedness', color: 'bg-purple-500' },
  { key: 'materiality', label: 'Materiality', color: 'bg-blue-500' },
  { key: 'velocity', label: 'Velocity', color: 'bg-green-500' },
  { key: 'breadth', label: 'Breadth', color: 'bg-yellow-500' },
  { key: 'credibility', label: 'Credibility', color: 'bg-red-500' },
];

export default function HotnessMetrics({ hotness }: HotnessMetricsProps) {
  return (
    <div className="space-y-3">
      {metrics.map((metric) => {
        const value = hotness[metric.key as keyof Omit<HotnessScore, 'overall' | 'reasoning'>] as number;
        const percentage = Math.round(value * 100);

        return (
          <div key={metric.key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{metric.label}</span>
              <span className="font-bold text-gray-900">{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full ${metric.color}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

