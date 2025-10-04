'use client';

import { useState } from 'react';
import { ProcessRequest } from '@/lib/types';
import { Settings, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ControlPanelProps {
  onScan: (request: ProcessRequest) => void;
  isLoading: boolean;
}

export default function ControlPanel({ onScan, isLoading }: ControlPanelProps) {
  const [timeWindow, setTimeWindow] = useState(24);
  const [topK, setTopK] = useState(10);
  const [threshold, setThreshold] = useState(0.5);

  const handleScan = () => {
    onScan({
      time_window_hours: timeWindow,
      top_k: topK,
      hotness_threshold: threshold,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-xl">
          <Settings className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="text-gray-600 text-sm">Set parameters for news scanning</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Time Window
          </label>
          <div className="relative">
            <input
              type="number"
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              min={1}
              max={168}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors font-semibold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              hours
            </span>
          </div>
          <p className="text-xs text-gray-500">Last 1-168 hours</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Top Stories
          </label>
          <div className="relative">
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              min={1}
              max={50}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors font-semibold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              stories
            </span>
          </div>
          <p className="text-xs text-gray-500">Number of results</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Hotness Threshold
          </label>
          <div className="relative">
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors font-semibold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              / 1.0
            </span>
          </div>
          <p className="text-xs text-gray-500">Minimum score</p>
        </div>
      </div>

      <button
        onClick={handleScan}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            Scanning News Sources...
          </>
        ) : (
          <>
            <Zap size={24} />
            Scan for Hot News
          </>
        )}
      </button>
    </motion.div>
  );
}

