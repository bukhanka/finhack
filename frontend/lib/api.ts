/**
 * API client for RADAR backend
 */

import axios from 'axios';
import type { 
  RadarResponse, 
  ProcessRequest, 
  HealthResponse, 
  HistoryResponse, 
  RunDetailsResponse,
  PersonalFeedResponse,
  PersonalScanRequest,
  UserPreferences,
  RSSSource
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const radarApi = {
  /**
   * Health check
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>('/api/health');
    return response.data;
  },

  /**
   * Process news and get hot stories
   */
  async processNews(request: ProcessRequest): Promise<RadarResponse> {
    const response = await api.post<RadarResponse>('/api/process', request);
    return response.data;
  },

  /**
   * Get last cached result
   */
  async getLastResult(): Promise<RadarResponse> {
    const response = await api.get<RadarResponse>('/api/last-result');
    return response.data;
  },

  /**
   * Get processing history
   */
  async getHistory(limit: number = 20, offset: number = 0): Promise<HistoryResponse> {
    const response = await api.get<HistoryResponse>('/api/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get specific radar run details
   */
  async getRunDetails(runId: number): Promise<RunDetailsResponse> {
    const response = await api.get<RunDetailsResponse>(`/api/history/${runId}`);
    return response.data;
  },

  /**
   * Delete old runs, keeping last N
   */
  async cleanupOldRuns(keepLastN: number = 100): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/api/history/cleanup', {
      params: { keep_last_n: keepLastN },
    });
    return response.data;
  },
};

// ============================================================================
// Personal News Aggregator API
// ============================================================================

export const personalApi = {
  /**
   * Scan and aggregate personalized news feed
   */
  async scanPersonalNews(request: PersonalScanRequest): Promise<PersonalFeedResponse> {
    const response = await api.post<PersonalFeedResponse>('/api/personal/scan', request);
    return response.data;
  },

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const response = await api.get<UserPreferences>(`/api/personal/preferences/${userId}`);
    return response.data;
  },

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<{ message: string; user_id: string }> {
    const response = await api.post<{ message: string; user_id: string }>('/api/personal/preferences', preferences);
    return response.data;
  },

  /**
   * Get popular RSS sources by category
   */
  async getPopularSources(): Promise<Record<string, RSSSource[]>> {
    const response = await api.get<Record<string, RSSSource[]>>('/api/personal/sources/popular');
    return response.data;
  },

  /**
   * Add RSS source
   */
  async addSource(userId: string, sourceUrl: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/personal/sources/add', null, {
      params: { user_id: userId, source_url: sourceUrl },
    });
    return response.data;
  },

  /**
   * Remove RSS source
   */
  async removeSource(userId: string, sourceUrl: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/api/personal/sources/remove', {
      params: { user_id: userId, source_url: sourceUrl },
    });
    return response.data;
  },

  /**
   * Add keyword filter
   */
  async addKeyword(userId: string, keyword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/personal/keywords/add', null, {
      params: { user_id: userId, keyword },
    });
    return response.data;
  },

  /**
   * Remove keyword filter
   */
  async removeKeyword(userId: string, keyword: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/api/personal/keywords/remove', {
      params: { user_id: userId, keyword },
    });
    return response.data;
  },
};

