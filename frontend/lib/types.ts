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

