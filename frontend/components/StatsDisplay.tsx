'use client';

import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, Clock, Zap } from 'lucide-react';

interface StatsDisplayProps {
  storyCount: number;
  articleCount: number;
  processingTime: number;
  avgHotness: number;
}

export default function StatsDisplay({ 
  storyCount, 
  articleCount, 
  processingTime, 
  avgHotness 
}: StatsDisplayProps) {
  const stats = [
    {
      icon: Newspaper,
      label: 'Горячих новостей',
      value: storyCount,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      label: 'Статей обработано',
      value: articleCount,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Clock,
      label: 'Время обработки',
      value: `${processingTime.toFixed(1)}с`,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Zap,
      label: 'Средняя горячесть',
      value: `${(avgHotness * 100).toFixed(0)}%`,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-gray-100`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}>
              <stat.icon className="text-white" size={24} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

