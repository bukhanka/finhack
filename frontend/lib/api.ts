/**
 * API client for RADAR backend
 */

import axios from 'axios';
import type { RadarResponse, ProcessRequest, HealthResponse } from './types';

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
};

