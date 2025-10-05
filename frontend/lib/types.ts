/**
 * TypeScript types for RADAR API
 */

export interface Entity {
  name: string;
  type: string; // company, ticker, sector, country, person
  relevance: number;
  ticker?: string;
}

export interface TimelineEvent {
  timestamp: string;
  description: string;
  source_url: string;
  event_type: string; // first_mention, confirmation, update, correction
}

export interface HotnessScore {
  overall: number;
  unexpectedness: number;
  materiality: number;
  velocity: number;
  breadth: number;
  credibility: number;
  reasoning: string;
}

export interface NewsStory {
  id: string;
  headline: string;
  hotness: number;
  hotness_details: HotnessScore;
  why_now: string;
  entities: Entity[];
  sources: string[];
  timeline: TimelineEvent[];
  draft: string;
  dedup_group: string;
  created_at: string;
  article_count: number;
  has_deep_research: boolean;
  research_summary?: string;
}

export interface RadarResponse {
  stories: NewsStory[];
  total_articles_processed: number;
  time_window_hours: number;
  generated_at: string;
  processing_time_seconds: number;
}

export interface ProcessRequest {
  time_window_hours?: number;
  top_k?: number;
  hotness_threshold?: number;
  custom_feeds?: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
  google_api_configured: boolean;
}

export interface RadarRun {
  id: number;
  created_at: string;
  time_window_hours: number;
  total_articles_processed: number;
  processing_time_seconds: number;
  hotness_threshold: number;
  top_k: number;
  story_count: number;
}

export interface HistoryResponse {
  history: RadarRun[];
  limit: number;
  offset: number;
}

export interface RunDetailsResponse extends RadarRun {
  stories: NewsStory[];
}

// ============================================================================
// Personal News Aggregator Types
// ============================================================================

export interface PersonalNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  author?: string;
  image_url?: string;
  relevance_score: number;
  matched_keywords: string[];
  cluster_size: number;
}

export interface PersonalFeedResponse {
  items: PersonalNewsItem[];
  total_articles_processed: number;
  filtered_count: number;
  time_window_hours: number;
  generated_at: string;
  processing_time_seconds: number;
  user_id?: string;
}

export interface UserPreferences {
  user_id: string;
  sources: string[];
  keywords: string[];
  excluded_keywords: string[];
  categories: string[];
  update_frequency_minutes: number;
  max_articles_per_feed: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalScanRequest {
  user_id?: string;
  time_window_hours?: number;
  custom_sources?: string[];
}

export interface RSSSource {
  name: string;
  url: string;
}

