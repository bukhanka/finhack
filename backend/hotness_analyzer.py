"""Hotness analysis module using Gemini for intelligent scoring."""

import logging
from typing import List, Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from config import settings
from models import NewsArticle, HotnessAnalysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HotnessAnalyzer:
    """Analyzes news hotness using Gemini LLM."""
    
    def __init__(self):
        """Initialize the analyzer with Gemini."""
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config={
                "temperature": settings.temperature,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json",
                "response_schema": HotnessAnalysis,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )
    
    def _create_hotness_prompt(self, articles: List[NewsArticle]) -> str:
        """Create prompt for hotness analysis."""
        
        articles_text = ""
        for i, article in enumerate(articles, 1):
            articles_text += f"""
Article {i}:
Title: {article.title}
Source: {article.source}
Published: {article.published_at.isoformat()}
Content: {article.content[:1000]}
URL: {article.url}

"""
        
        prompt = f"""You are a financial market analyst specializing in identifying "hot" news that could impact financial markets.

Analyze the following news article(s) and provide a structured assessment of its "hotness" - how significant and time-sensitive this news is for financial markets.

{articles_text}

Assess the hotness based on these dimensions (each 0-1):
1. **Unexpectedness**: How surprising is this relative to market consensus?
2. **Materiality**: Potential impact on price/volatility/liquidity
3. **Velocity**: Speed of information spread (retweets, updates, confirmations)
4. **Breadth**: Number of affected assets (direct and spillover effects)
5. **Credibility**: Source reputation and confirmation level

Also provide:
- **Overall hotness**: Weighted combination of all dimensions (0-1)
- **Reasoning**: Detailed explanation of the scoring
- **Headline**: Concise headline summarizing the story
- **Why Now**: 1-2 sentences explaining why this matters RIGHT NOW
- **Entities**: Companies, tickers, sectors, countries mentioned (with type and relevance 0-1)
- **Timeline**: Key events with timestamps (types: first_mention, confirmation, update, correction)

Be precise and analytical. For low-importance news, give low scores. For genuinely market-moving news, give high scores.
"""
        return prompt
    
    def analyze_hotness(
        self,
        articles: List[NewsArticle]
    ) -> Optional[HotnessAnalysis]:
        """
        Analyze hotness of news cluster using structured output.
        
        Args:
            articles: List of articles in the cluster (already deduplicated)
            
        Returns:
            HotnessAnalysis object or None if failed
        """
        if not articles:
            return None
        
        try:
            prompt = self._create_hotness_prompt(articles)
            
            logger.info(f"Analyzing hotness for cluster of {len(articles)} articles...")
            
            response = self.model.generate_content(prompt)
            
            # With structured output, response is automatically parsed
            analysis = response.parsed
            
            if analysis:
                logger.info(
                    f"Hotness analysis complete: "
                    f"overall={analysis.hotness.overall:.2f}"
                )
                return analysis
            else:
                logger.error("Failed to parse structured output")
                logger.debug(f"Response text: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to analyze hotness: {e}", exc_info=True)
            return None


if __name__ == "__main__":
    # Test hotness analyzer
    import asyncio
    from news_collector import NewsCollector
    from deduplication import NewsDeduplicator
    
    async def test():
        # Collect news
        async with NewsCollector() as collector:
            articles = await collector.collect_news(time_window_hours=24)
        
        # Deduplicate
        deduplicator = NewsDeduplicator()
        clusters = deduplicator.cluster_articles(articles)
        
        # Analyze hotness for top clusters
        analyzer = HotnessAnalyzer()
        
        for cluster_id, cluster_articles in list(clusters.items())[:3]:
            print(f"\n{'='*80}")
            print(f"Cluster: {cluster_id} ({len(cluster_articles)} articles)")
            print(f"{'='*80}")
            
            # Take representative or first few articles
            articles_to_analyze = cluster_articles[:3]
            
            analysis = analyzer.analyze_hotness(articles_to_analyze)
            
            if analysis:
                print(f"\nHeadline: {analysis.headline}")
                print(f"Why Now: {analysis.why_now}")
                
                hotness = analysis.hotness
                print(f"\nHotness Score: {hotness.overall:.2f}")
                print(f"  - Unexpectedness: {hotness.unexpectedness:.2f}")
                print(f"  - Materiality: {hotness.materiality:.2f}")
                print(f"  - Velocity: {hotness.velocity:.2f}")
                print(f"  - Breadth: {hotness.breadth:.2f}")
                print(f"  - Credibility: {hotness.credibility:.2f}")
                print(f"\nReasoning: {hotness.reasoning}")
                
                print(f"\nEntities: {', '.join(e.name for e in analysis.entities)}")
            else:
                print("Analysis failed")
    
    asyncio.run(test())

