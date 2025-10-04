'use client';

import { useState } from 'react';
import { NewsStory } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Building2,
  Globe,
  User,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import HotnessMetrics from './HotnessMetrics';
import HotnessChart from './HotnessChart';

interface StoryCardProps {
  story: NewsStory;
  index: number;
}

const entityIcons = {
  company: Building2,
  sector: BarChart3,
  country: Globe,
  person: User,
  ticker: TrendingUp,
};

export default function StoryCard({ story, index }: StoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const hotnessColor = 
    story.hotness >= 0.8 ? 'from-red-500 to-orange-500' :
    story.hotness >= 0.6 ? 'from-orange-500 to-yellow-500' :
    'from-yellow-500 to-green-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
              {story.has_deep_research && (
                <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                  <Sparkles size={12} />
                  Deep Research
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{story.headline}</h2>
            
            {/* Why Now */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <TrendingUp className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">Why Now</p>
                  <p className="text-gray-700">{story.why_now}</p>
                </div>
              </div>
            </div>

            {/* Entities */}
            <div className="flex flex-wrap gap-2">
              {story.entities.slice(0, 8).map((entity, idx) => {
                const Icon = entityIcons[entity.type as keyof typeof entityIcons] || Building2;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Icon size={14} />
                    {entity.name}
                    {entity.ticker && <span className="text-purple-600 font-bold">[{entity.ticker}]</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Hotness Badge */}
          <div className="flex-shrink-0">
            <div className={`relative w-24 h-24 bg-gradient-to-br ${hotnessColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {Math.round(story.hotness * 100)}
                </div>
                <div className="text-xs text-white/90 font-semibold">HOTNESS</div>
              </div>
            </div>
            <div className="text-center mt-2">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {story.article_count} sources
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="px-6 py-4 bg-gray-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="font-semibold">Detailed Analysis</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6 border-t border-gray-100">
              {/* Hotness Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="text-purple-600" size={20} />
                    Hotness Metrics
                  </h3>
                  <HotnessMetrics hotness={story.hotness_details} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-center">Radar View</h3>
                  <HotnessChart hotness={story.hotness_details} />
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Analysis Reasoning</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{story.hotness_details.reasoning}</p>
              </div>

              {/* Timeline */}
              {story.timeline.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="text-purple-600" size={20} />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    {story.timeline.map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-24 text-xs text-gray-500 font-medium">
                          {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-3 border-l-4 border-purple-500">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                              {event.event_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{event.description}</p>
                          <a
                            href={event.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 mt-1"
                          >
                            View source <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft */}
              <div>
                <button
                  onClick={() => setShowDraft(!showDraft)}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <span>📝 {showDraft ? 'Hide' : 'View'} Draft Article</span>
                  {showDraft ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <AnimatePresence>
                  {showDraft && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 bg-white rounded-xl p-6 border border-gray-200">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: story.draft
                              .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                              .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                              .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
                              .replace(/^\* (.*$)/gim, '<li>$1</li>')
                              .replace(/^\• (.*$)/gim, '<li>$1</li>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n\n/g, '</p><p class="mb-4">')
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sources */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="text-purple-600" size={20} />
                  Sources ({story.sources.length})
                </h3>
                <div className="grid gap-2">
                  {story.sources.slice(0, 5).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-2 rounded-lg transition-colors flex items-center gap-2 break-all"
                    >
                      <ExternalLink size={14} className="flex-shrink-0" />
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

