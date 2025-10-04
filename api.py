"""FastAPI backend for the Financial News RADAR system."""

import asyncio
import logging
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import settings
from models import RadarResponse
from radar import FinancialNewsRadar

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Financial News RADAR",
    description="Hot news detection and analysis system for financial markets",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RADAR system
radar = FinancialNewsRadar()

# Cache for last result
last_result_cache = {
    "result": None,
    "timestamp": None
}


class ProcessRequest(BaseModel):
    """Request model for processing news."""
    time_window_hours: Optional[int] = 24
    top_k: Optional[int] = 10
    hotness_threshold: Optional[float] = 0.5
    custom_feeds: Optional[List[str]] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    google_api_configured: bool


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page."""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial News RADAR</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .controls {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .controls h2 {
            margin-bottom: 20px;
            color: #333;
        }
        
        .control-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .control-item {
            display: flex;
            flex-direction: column;
        }
        
        .control-item label {
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }
        
        .control-item input {
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .control-item input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            font-weight: 600;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .results {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .results-header h2 {
            color: #333;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #666;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
        }
        
        .story {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .story:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .story-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
        }
        
        .story-title {
            font-size: 1.5em;
            font-weight: 700;
            color: #333;
            flex: 1;
            margin-right: 20px;
        }
        
        .hotness-badge {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 18px;
            min-width: 80px;
            text-align: center;
        }
        
        .story-why {
            background: white;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            font-style: italic;
            color: #555;
        }
        
        .story-entities {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .entity-tag {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .story-draft {
            background: white;
            border-radius: 6px;
            padding: 20px;
            margin-top: 15px;
            line-height: 1.8;
            color: #333;
        }
        
        .story-draft h1, .story-draft h2, .story-draft h3 {
            margin-top: 20px;
            margin-bottom: 10px;
            color: #333;
        }
        
        .story-draft ul {
            margin-left: 20px;
            margin-bottom: 15px;
        }
        
        .story-sources {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }
        
        .story-sources h4 {
            margin-bottom: 10px;
            color: #666;
            font-size: 14px;
        }
        
        .source-link {
            display: block;
            color: #667eea;
            text-decoration: none;
            font-size: 13px;
            margin-bottom: 5px;
            word-break: break-all;
        }
        
        .source-link:hover {
            text-decoration: underline;
        }
        
        .error {
            background: #fff5f5;
            border: 2px solid #fc8181;
            border-radius: 8px;
            padding: 20px;
            color: #c53030;
        }
        
        .hidden {
            display: none;
        }
        
        .hotness-details {
            background: white;
            border-radius: 6px;
            padding: 15px;
            margin-top: 15px;
            font-size: 14px;
        }
        
        .hotness-metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .hotness-bar {
            background: #e0e0e0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            flex: 1;
            margin-left: 15px;
        }
        
        .hotness-bar-fill {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 Financial News RADAR</h1>
            <p>AI-Powered Hot News Detection & Analysis</p>
        </div>
        
        <div class="controls">
            <h2>⚙️ Configuration</h2>
            <div class="control-group">
                <div class="control-item">
                    <label for="timeWindow">Time Window (hours)</label>
                    <input type="number" id="timeWindow" value="24" min="1" max="168">
                </div>
                <div class="control-item">
                    <label for="topK">Top Stories</label>
                    <input type="number" id="topK" value="10" min="1" max="50">
                </div>
                <div class="control-item">
                    <label for="threshold">Hotness Threshold</label>
                    <input type="number" id="threshold" value="0.5" min="0" max="1" step="0.1">
                </div>
            </div>
            <button class="btn" onclick="processNews()">🚀 Scan for Hot News</button>
        </div>
        
        <div id="loading" class="loading hidden">
            <div class="spinner"></div>
            <p>Analyzing news sources...</p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">This may take 30-60 seconds</p>
        </div>
        
        <div id="error" class="error hidden"></div>
        
        <div id="results" class="results hidden">
            <div class="results-header">
                <h2>🔥 Hot Stories</h2>
                <div class="stats">
                    <div class="stat-item">
                        <span class="stat-value" id="storyCount">0</span>
                        <span>Stories</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="articleCount">0</span>
                        <span>Articles</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="processTime">0s</span>
                        <span>Processing</span>
                    </div>
                </div>
            </div>
            <div id="storiesContainer"></div>
        </div>
    </div>
    
    <script>
        async function processNews() {
            const timeWindow = document.getElementById('timeWindow').value;
            const topK = document.getElementById('topK').value;
            const threshold = document.getElementById('threshold').value;
            
            // Show loading, hide results and errors
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('results').classList.add('hidden');
            document.getElementById('error').classList.add('hidden');
            
            try {
                const response = await fetch('/api/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        time_window_hours: parseInt(timeWindow),
                        top_k: parseInt(topK),
                        hotness_threshold: parseFloat(threshold)
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                displayResults(data);
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('error').textContent = `Error: ${error.message}`;
                document.getElementById('error').classList.remove('hidden');
            } finally {
                document.getElementById('loading').classList.add('hidden');
            }
        }
        
        function displayResults(data) {
            const resultsDiv = document.getElementById('results');
            const storiesContainer = document.getElementById('storiesContainer');
            
            // Update stats
            document.getElementById('storyCount').textContent = data.stories.length;
            document.getElementById('articleCount').textContent = data.total_articles_processed;
            document.getElementById('processTime').textContent = Math.round(data.processing_time_seconds) + 's';
            
            // Clear previous stories
            storiesContainer.innerHTML = '';
            
            // Display stories
            data.stories.forEach((story, index) => {
                const storyDiv = document.createElement('div');
                storyDiv.className = 'story';
                
                const entitiesHtml = story.entities.slice(0, 8).map(entity => 
                    `<span class="entity-tag">${entity.name}${entity.ticker ? ' [' + entity.ticker + ']' : ''}</span>`
                ).join('');
                
                const sourcesHtml = story.sources.slice(0, 5).map(url => 
                    `<a href="${url}" target="_blank" class="source-link">${url}</a>`
                ).join('');
                
                const hotnessDetails = story.hotness_details;
                const metricsHtml = `
                    <div class="hotness-metric">
                        <span>Unexpectedness:</span>
                        <div class="hotness-bar">
                            <div class="hotness-bar-fill" style="width: ${hotnessDetails.unexpectedness * 100}%"></div>
                        </div>
                        <span style="margin-left: 10px; font-weight: 600;">${(hotnessDetails.unexpectedness * 100).toFixed(0)}%</span>
                    </div>
                    <div class="hotness-metric">
                        <span>Materiality:</span>
                        <div class="hotness-bar">
                            <div class="hotness-bar-fill" style="width: ${hotnessDetails.materiality * 100}%"></div>
                        </div>
                        <span style="margin-left: 10px; font-weight: 600;">${(hotnessDetails.materiality * 100).toFixed(0)}%</span>
                    </div>
                    <div class="hotness-metric">
                        <span>Velocity:</span>
                        <div class="hotness-bar">
                            <div class="hotness-bar-fill" style="width: ${hotnessDetails.velocity * 100}%"></div>
                        </div>
                        <span style="margin-left: 10px; font-weight: 600;">${(hotnessDetails.velocity * 100).toFixed(0)}%</span>
                    </div>
                    <div class="hotness-metric">
                        <span>Breadth:</span>
                        <div class="hotness-bar">
                            <div class="hotness-bar-fill" style="width: ${hotnessDetails.breadth * 100}%"></div>
                        </div>
                        <span style="margin-left: 10px; font-weight: 600;">${(hotnessDetails.breadth * 100).toFixed(0)}%</span>
                    </div>
                    <div class="hotness-metric">
                        <span>Credibility:</span>
                        <div class="hotness-bar">
                            <div class="hotness-bar-fill" style="width: ${hotnessDetails.credibility * 100}%"></div>
                        </div>
                        <span style="margin-left: 10px; font-weight: 600;">${(hotnessDetails.credibility * 100).toFixed(0)}%</span>
                    </div>
                    <p style="margin-top: 10px; font-size: 13px; color: #666;"><strong>Analysis:</strong> ${hotnessDetails.reasoning}</p>
                `;
                
                storyDiv.innerHTML = `
                    <div class="story-header">
                        <div class="story-title">${index + 1}. ${story.headline}</div>
                        <div class="hotness-badge">${(story.hotness * 100).toFixed(0)}%</div>
                    </div>
                    <div class="story-why">💡 <strong>Why Now:</strong> ${story.why_now}</div>
                    <div class="story-entities">${entitiesHtml}</div>
                    <div class="hotness-details">
                        <strong>Hotness Breakdown:</strong>
                        ${metricsHtml}
                    </div>
                    <div class="story-draft">${formatMarkdown(story.draft)}</div>
                    <div class="story-sources">
                        <h4>📎 Sources (${story.article_count} articles):</h4>
                        ${sourcesHtml}
                    </div>
                `;
                
                storiesContainer.appendChild(storyDiv);
            });
            
            resultsDiv.classList.remove('hidden');
        }
        
        function formatMarkdown(text) {
            // Simple markdown to HTML conversion
            return text
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^\* (.*$)/gim, '<li>$1</li>')
                .replace(/^\• (.*$)/gim, '<li>$1</li>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/<li>/g, '<ul><li>')
                .replace(/<\/li>/g, '</li></ul>')
                .replace(/<ul><\/ul>/g, '')
                .replace(/<\/ul><ul>/g, '');
        }
    </script>
</body>
</html>
"""


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        google_api_configured=bool(settings.google_api_key)
    )


@app.post("/api/process", response_model=RadarResponse)
async def process_news(request: ProcessRequest):
    """
    Process news and return hot stories.
    
    Args:
        request: Processing parameters
        
    Returns:
        RadarResponse with detected hot stories
    """
    try:
        logger.info(f"Processing request: {request}")
        
        result = await radar.process_news(
            time_window_hours=request.time_window_hours,
            top_k=request.top_k,
            hotness_threshold=request.hotness_threshold,
            custom_feeds=request.custom_feeds
        )
        
        # Cache result
        last_result_cache["result"] = result
        last_result_cache["timestamp"] = result.generated_at
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing news: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/last-result", response_model=RadarResponse)
async def get_last_result():
    """Get the last processed result from cache."""
    if last_result_cache["result"] is None:
        raise HTTPException(status_code=404, detail="No results available yet")
    
    return last_result_cache["result"]


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

