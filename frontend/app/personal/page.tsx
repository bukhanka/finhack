'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Settings, Plus, X, Search, Clock, ExternalLink, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { personalApi } from '@/lib/api';
import type { PersonalFeedResponse, UserPreferences, RSSSource } from '@/lib/types';

export default function PersonalNewsPage() {
  const [feed, setFeed] = useState<PersonalFeedResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [popularSources, setPopularSources] = useState<Record<string, RSSSource[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [userId] = useState('default'); // В реальном приложении из auth

  useEffect(() => {
    loadPreferences();
    loadPopularSources();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await personalApi.getUserPreferences(userId);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const loadPopularSources = async () => {
    try {
      const sources = await personalApi.getPopularSources();
      setPopularSources(sources);
    } catch (err) {
      console.error('Error loading popular sources:', err);
    }
  };

  const handleScan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await personalApi.scanPersonalNews({
        user_id: userId,
        time_window_hours: 24,
      });
      setFeed(result);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить новости');
      console.error('Error scanning news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async (url: string) => {
    try {
      await personalApi.addSource(userId, url);
      await loadPreferences();
      setNewSourceUrl('');
      setShowAddSource(false);
    } catch (err) {
      console.error('Error adding source:', err);
    }
  };

  const handleRemoveSource = async (url: string) => {
    try {
      await personalApi.removeSource(userId, url);
      await loadPreferences();
    } catch (err) {
      console.error('Error removing source:', err);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    try {
      await personalApi.addKeyword(userId, newKeyword.trim());
      await loadPreferences();
      setNewKeyword('');
    } catch (err) {
      console.error('Error adding keyword:', err);
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    try {
      await personalApi.removeKeyword(userId, keyword);
      await loadPreferences();
    } catch (err) {
      console.error('Error removing keyword:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 transition-colors hover:text-slate-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500">
                <Newspaper className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Personal News Aggregator</h1>
                <p className="text-xs text-slate-400">Персонализированная лента новостей</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all hover:border-purple-500/40 hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
              Настройки
            </button>
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {isLoading ? 'Сканирование...' : 'Обновить ленту'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && preferences && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 rounded-2xl border border-white/10 bg-slate-800/50 p-6 backdrop-blur"
            >
              <h2 className="mb-6 text-xl font-semibold text-slate-100">Настройки ленты</h2>

              {/* Sources */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    RSS Источники ({preferences.sources.length})
                  </h3>
                  <button
                    onClick={() => setShowAddSource(!showAddSource)}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить
                  </button>
                </div>

                {showAddSource && (
                  <div className="mb-4 flex gap-2">
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://example.com/rss"
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500/40 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddSource(newSourceUrl)}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
                    >
                      Добавить
                    </button>
                  </div>
                )}

                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {preferences.sources.map((source) => (
                    <div
                      key={source}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2"
                    >
                      <span className="truncate text-sm text-slate-300">{source}</span>
                      <button
                        onClick={() => handleRemoveSource(source)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Popular Sources */}
                {Object.keys(popularSources).length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Популярные источники
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(popularSources).map(([category, sources]) => (
                        <details key={category} className="group">
                          <summary className="cursor-pointer text-sm text-slate-300 hover:text-slate-100">
                            {category} ({sources.length})
                          </summary>
                          <div className="ml-4 mt-2 space-y-1">
                            {sources.map((source) => (
                              <button
                                key={source.url}
                                onClick={() => handleAddSource(source.url)}
                                className="block text-xs text-purple-400 hover:text-purple-300"
                              >
                                + {source.name}
                              </button>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Ключевые слова
                </h3>
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Добавить ключевое слово"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500/40 focus:outline-none"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
                  >
                    Добавить
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.keywords.map((keyword) => (
                    <div
                      key={keyword}
                      className="flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300"
                    >
                      {keyword}
                      <button onClick={() => handleRemoveKeyword(keyword)} className="hover:text-purple-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-6 text-rose-200"
          >
            {error}
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500" />
              <p className="text-slate-400">Сканирование новостей...</p>
            </div>
          </div>
        )}

        {/* Feed Stats */}
        {feed && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid gap-4 md:grid-cols-4"
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="text-3xl font-bold text-purple-400">{feed.items.length}</div>
              <div className="text-xs text-slate-400">Новостей в ленте</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="text-3xl font-bold text-purple-400">{feed.total_articles_processed}</div>
              <div className="text-xs text-slate-400">Обработано</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="text-3xl font-bold text-purple-400">{feed.filtered_count}</div>
              <div className="text-xs text-slate-400">Отфильтровано</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="text-3xl font-bold text-purple-400">{Math.round(feed.processing_time_seconds)}s</div>
              <div className="text-xs text-slate-400">Время обработки</div>
            </div>
          </motion.div>
        )}

        {/* News Feed */}
        {feed && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {feed.items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur">
                <Newspaper className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-xl font-semibold text-slate-100">Новостей не найдено</h3>
                <p className="text-slate-400">Попробуйте добавить больше источников или изменить фильтры</p>
              </div>
            ) : (
              feed.items.map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-purple-500/40 hover:bg-white/10"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h2 className="flex-1 text-xl font-semibold text-slate-100 group-hover:text-purple-300">
                      {item.title}
                    </h2>
                    {item.relevance_score > 0.6 && (
                      <div className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-300">
                        <Sparkles className="h-3 w-3" />
                        Релевантно
                      </div>
                    )}
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-slate-300">{item.summary}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.published_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div>Источник: {item.source}</div>
                    {item.cluster_size > 1 && <div>{item.cluster_size} похожих статей</div>}
                    {item.matched_keywords.length > 0 && (
                      <div className="flex gap-1">
                        {item.matched_keywords.map((kw) => (
                          <span key={kw} className="rounded bg-purple-500/20 px-2 py-0.5 text-purple-300">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-purple-400 transition-colors hover:text-purple-300"
                    >
                      Читать полностью
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </motion.article>
              ))
            )}
          </motion.div>
        )}

        {/* Welcome message */}
        {!feed && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur"
          >
            <Newspaper className="mx-auto mb-6 h-16 w-16 text-purple-400" />
            <h2 className="mb-4 text-2xl font-semibold text-slate-100">Добро пожаловать!</h2>
            <p className="mb-6 text-slate-400">
              Настройте источники новостей и ключевые слова, затем нажмите &quot;Обновить ленту&quot;
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white hover:bg-purple-600"
            >
              <Settings className="h-5 w-5" />
              Открыть настройки
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
