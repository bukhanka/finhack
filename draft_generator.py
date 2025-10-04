"""Draft generation module for creating publication-ready content."""

import logging
import re
from typing import List, Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from config import settings
from models import NewsArticle, Entity, TimelineEvent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DraftGenerator:
    """Generates publication drafts using Gemini."""
    
    def __init__(self):
        """Initialize the generator with Gemini."""
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config={
                "temperature": 0.4,  # Slightly higher for creative writing
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )
    
    def generate_draft(
        self,
        headline: str,
        articles: List[NewsArticle],
        entities: List[Entity],
        timeline: List[TimelineEvent],
        why_now: str,
        hotness_reasoning: str
    ) -> Optional[str]:
        """
        Generate a publication draft.
        
        Args:
            headline: Main headline
            articles: Source articles
            entities: Extracted entities
            timeline: Timeline of events
            why_now: Why this matters now
            hotness_reasoning: Hotness scoring reasoning
            
        Returns:
            Formatted draft text or None if failed
        """
        
        # Prepare articles summary
        articles_summary = ""
        for i, article in enumerate(articles[:5], 1):
            articles_summary += f"""
Source {i} ({article.source}):
{article.title}
{article.content[:300]}...
URL: {article.url}
"""
        
        # Prepare entities list
        entities_list = ", ".join([
            f"{e.name} ({e.type})" + (f" [{e.ticker}]" if e.ticker else "")
            for e in entities[:10]
        ])
        
        # Prepare timeline
        timeline_text = ""
        for event in timeline[:5]:
            timeline_text += f"- {event.timestamp.strftime('%Y-%m-%d %H:%M')}: {event.description}\n"
        
        prompt = f"""You are a financial news editor creating a publication-ready article draft.

**Story Headline**: {headline}

**Why This Matters Now**: {why_now}

**Key Entities**: {entities_list}

**Timeline**:
{timeline_text}

**Source Materials**:
{articles_summary}

**Analysis Context**: {hotness_reasoning}

Create a professional financial news article with the following structure:

# [Compelling Headline]

**Lead Paragraph**: 2-3 sentences capturing the core story and immediate implications

**Key Points**:
• [First key point with specific details]
• [Second key point with context]
• [Third key point with broader implications]

**Market Context**: Brief paragraph explaining market significance and potential impacts

**What We Know**: Summary of confirmed facts with timeline

**Sources**: List of source URLs referenced

**Quote/Attribution**: If relevant, include any notable quotes or attributions from sources

Requirements:
- Be factual and precise
- Cite specific numbers, dates, and entities
- Include verifiable source references
- Avoid speculation - stick to what's confirmed
- Use professional financial journalism tone
- Keep it concise (300-400 words)
- Include proper attributions

Generate the draft now:
"""
        
        try:
            logger.info("Generating publication draft...")
            
            response = self.model.generate_content(prompt)
            draft_text = response.text.strip()
            
            logger.info(f"Generated draft ({len(draft_text)} chars)")
            
            return draft_text
            
        except Exception as e:
            logger.error(f"Failed to generate draft: {e}")
            return None
    
    def generate_social_media_post(
        self,
        headline: str,
        why_now: str,
        entities: List[Entity],
        source_url: str
    ) -> Optional[str]:
        """
        Generate a short social media post.
        
        Args:
            headline: Main headline
            why_now: Why this matters now
            entities: Key entities
            source_url: Link to full story
            
        Returns:
            Social media post text or None if failed
        """
        
        # Extract main tickers for hashtags
        tickers = [e.ticker for e in entities if e.ticker][:3]
        hashtags = " ".join([f"#{ticker}" for ticker in tickers])
        
        prompt = f"""Create a concise social media post (Twitter/X style) for this financial news:

Headline: {headline}
Why Now: {why_now}
Key Entities: {', '.join(e.name for e in entities[:5])}
Relevant Tickers: {', '.join(tickers) if tickers else 'N/A'}

Requirements:
- Maximum 280 characters
- Professional but engaging tone
- Include key fact or number if available
- End with relevant hashtags
- No emojis

Generate the post:
"""
        
        try:
            response = self.model.generate_content(prompt)
            post_text = response.text.strip()
            
            # Add link
            if source_url:
                post_text += f"\n\n{source_url}"
            
            return post_text
            
        except Exception as e:
            logger.error(f"Failed to generate social post: {e}")
            return None


if __name__ == "__main__":
    # Test draft generator
    from datetime import datetime
    
    # Create sample data
    sample_articles = [
        NewsArticle(
            id="test1",
            title="Major Tech Company Announces Earnings Beat",
            content="Company XYZ reported quarterly earnings that exceeded analyst expectations by 15%, driven by strong cloud revenue growth. The company also raised its full-year guidance.",
            url="https://example.com/article1",
            source="reuters.com",
            published_at=datetime.now()
        )
    ]
    
    sample_entities = [
        Entity(name="Company XYZ", type="company", relevance=1.0, ticker="XYZ"),
        Entity(name="Technology", type="sector", relevance=0.8, ticker=None)
    ]
    
    sample_timeline = [
        TimelineEvent(
            timestamp=datetime.now(),
            description="Earnings report released",
            source_url="https://example.com/article1",
            event_type="first_mention"
        )
    ]
    
    generator = DraftGenerator()
    
    draft = generator.generate_draft(
        headline="Tech Giant Beats Earnings Expectations by 15%",
        articles=sample_articles,
        entities=sample_entities,
        timeline=sample_timeline,
        why_now="Significantly exceeded analyst consensus, raising full-year outlook",
        hotness_reasoning="High materiality due to earnings beat, high credibility from official report"
    )
    
    if draft:
        print("Generated Draft:")
        print("=" * 80)
        print(draft)
        print("=" * 80)
        
        social_post = generator.generate_social_media_post(
            headline="Tech Giant Beats Earnings Expectations by 15%",
            why_now="Significantly exceeded analyst consensus",
            entities=sample_entities,
            source_url="https://example.com/article1"
        )
        
        if social_post:
            print("\nSocial Media Post:")
            print("-" * 80)
            print(social_post)

