'use client';

import { useState, useEffect } from 'react';
import { radarApi } from '@/lib/api';
import { RadarResponse, ProcessRequest } from '@/lib/types';
import ControlPanel from '@/components/ControlPanel';
import StoryCard from '@/components/StoryCard';
import StatsDisplay from '@/components/StatsDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Radar, Activity } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkHealth();
    // Try to load last result
    loadLastResult();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await radarApi.healthCheck();
      setIsHealthy(health.status === 'healthy');
    } catch (err) {
      setIsHealthy(false);
      console.error('Health check failed:', err);
    }
  };

  const loadLastResult = async () => {
    try {
      const result = await radarApi.getLastResult();
      setData(result);
    } catch (err) {
      // No cached results, that's ok
      console.log('No cached results available');
    }
  };

  const handleScan = async (request: ProcessRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await radarApi.processNews(request);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to process news');
      console.error('Error processing news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const avgHotness = data 
    ? data.stories.reduce((sum, story) => sum + story.hotness, 0) / data.stories.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-xl shadow-lg">
                <Radar className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Финансовый Новостной РАДАР
                </h1>
                <p className="text-gray-600 text-sm font-medium">
                  ИИ-анализ и выявление горячих новостей
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <Activity size={16} />
                <span className="text-sm font-semibold">
                  {isHealthy ? 'Сервер онлайн' : 'Сервер офлайн'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Control Panel */}
          <ControlPanel onScan={handleScan} isLoading={isLoading} />

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-red-900 mb-1">Ошибка</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          {data && (
            <StatsDisplay
              storyCount={data.stories.length}
              articleCount={data.total_articles_processed}
              processingTime={data.processing_time_seconds}
              avgHotness={avgHotness}
            />
          )}

          {/* Results */}
          {data && data.stories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  🔥 Горячие новости
                </h2>
                <div className="text-sm text-gray-600">
                  Создано: {new Date(data.generated_at).toLocaleString('ru-RU')}
                </div>
              </div>

              <div className="space-y-6">
                {data.stories.map((story, index) => (
                  <StoryCard key={story.id} story={story} index={index} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {data && data.stories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                <Radar className="text-gray-400" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Горячих новостей не найдено
              </h3>
              <p className="text-gray-600">
                Попробуйте изменить временное окно или понизить порог горячести
              </p>
            </motion.div>
          )}

          {/* Initial State */}
          {!data && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300"
            >
              <div className="inline-block bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-full mb-4">
                <Radar className="text-purple-600" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Готов к сканированию
              </h3>
              <p className="text-gray-600 mb-6">
                Настройте параметры выше и нажмите "Сканировать новости"
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="font-bold text-purple-900 mb-1">📊 Многомерный анализ</div>
                  <div className="text-sm text-purple-700">
                    5 метрик: неожиданность, значимость, скорость, охват, достоверность
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="font-bold text-blue-900 mb-1">🔍 Глубокое исследование</div>
                  <div className="text-sm text-blue-700">
                    ИИ-анализ с использованием 20+ источников для горячих новостей
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="font-bold text-green-900 mb-1">✅ Проверено</div>
                  <div className="text-sm text-green-700">
                    Отслеживание таймлайна с указанием источников
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white/50 backdrop-blur-lg border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p className="text-sm">
            Финансовый Новостной РАДАР v2.0 • На базе Gemini 2.0, GPT Researcher & Tavily
          </p>
        </div>
      </footer>
    </div>
  );
}
