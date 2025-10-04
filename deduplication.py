"""Deduplication and clustering module using embeddings."""

import logging
from typing import List, Dict, Set
from collections import defaultdict

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai

from config import settings
from models import NewsArticle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NewsDeduplicator:
    """Deduplicates and clusters similar news articles."""
    
    def __init__(self):
        """Initialize the deduplicator with Gemini embeddings."""
        genai.configure(api_key=settings.google_api_key)
        self.embedding_cache: Dict[str, List[float]] = {}
        
    def _get_text_for_embedding(self, article: NewsArticle) -> str:
        """Extract text for embedding generation."""
        # Combine title and first part of content for better representation
        content_preview = article.content[:500] if article.content else ""
        return f"{article.title}\n\n{content_preview}"
    
    def get_embedding(self, text: str, article_id: str) -> np.ndarray:
        """
        Get embedding for text using Gemini.
        
        Args:
            text: Text to embed
            article_id: Article ID for caching
            
        Returns:
            Embedding vector as numpy array
        """
        # Check cache
        if article_id in self.embedding_cache:
            return np.array(self.embedding_cache[article_id])
        
        try:
            result = genai.embed_content(
                model=settings.embedding_model,
                content=text,
                task_type="clustering"
            )
            
            embedding = result['embedding']
            self.embedding_cache[article_id] = embedding
            
            return np.array(embedding)
            
        except Exception as e:
            logger.error(f"Failed to get embedding for article {article_id}: {e}")
            # Return zero vector as fallback
            return np.zeros(768)  # text-embedding-004 dimension
    
    def get_embeddings_batch(self, articles: List[NewsArticle]) -> Dict[str, np.ndarray]:
        """
        Get embeddings for multiple articles.
        
        Args:
            articles: List of articles
            
        Returns:
            Dictionary mapping article ID to embedding
        """
        embeddings = {}
        
        logger.info(f"Generating embeddings for {len(articles)} articles...")
        
        for article in articles:
            text = self._get_text_for_embedding(article)
            embedding = self.get_embedding(text, article.id)
            embeddings[article.id] = embedding
        
        logger.info(f"Generated {len(embeddings)} embeddings")
        
        return embeddings
    
    def cluster_articles(
        self,
        articles: List[NewsArticle],
        similarity_threshold: float = None
    ) -> Dict[str, List[NewsArticle]]:
        """
        Cluster similar articles using embeddings.
        
        Args:
            articles: List of articles to cluster
            similarity_threshold: Threshold for considering articles similar
            
        Returns:
            Dictionary mapping cluster ID to list of articles
        """
        if not articles:
            return {}
        
        if similarity_threshold is None:
            similarity_threshold = settings.similarity_threshold
        
        logger.info(f"Clustering {len(articles)} articles with threshold {similarity_threshold}")
        
        # Get embeddings
        embeddings_dict = self.get_embeddings_batch(articles)
        
        # Create mapping from article ID to article
        article_map = {article.id: article for article in articles}
        
        # Convert to matrix for similarity computation
        article_ids = list(embeddings_dict.keys())
        embeddings_matrix = np.array([embeddings_dict[aid] for aid in article_ids])
        
        # Compute pairwise similarities
        similarities = cosine_similarity(embeddings_matrix)
        
        # Cluster using connected components
        n = len(article_ids)
        visited = set()
        clusters = {}
        cluster_counter = 0
        
        def dfs(idx: int, cluster_articles: List[str]):
            """Depth-first search to find connected articles."""
            if idx in visited:
                return
            visited.add(idx)
            cluster_articles.append(article_ids[idx])
            
            # Find all similar articles
            for j in range(n):
                if j not in visited and similarities[idx][j] >= similarity_threshold:
                    dfs(j, cluster_articles)
        
        # Find clusters
        for i in range(n):
            if i not in visited:
                cluster_articles = []
                dfs(i, cluster_articles)
                
                if cluster_articles:
                    cluster_id = f"cluster_{cluster_counter:04d}"
                    clusters[cluster_id] = [
                        article_map[aid] for aid in cluster_articles
                    ]
                    cluster_counter += 1
        
        # Sort clusters by size (largest first)
        clusters = dict(
            sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True)
        )
        
        # Log statistics
        cluster_sizes = [len(articles) for articles in clusters.values()]
        avg_size = np.mean(cluster_sizes) if cluster_sizes else 0
        max_size = max(cluster_sizes) if cluster_sizes else 0
        
        logger.info(
            f"Created {len(clusters)} clusters: "
            f"avg size={avg_size:.1f}, max size={max_size}"
        )
        
        return clusters
    
    def get_representative_article(self, cluster: List[NewsArticle]) -> NewsArticle:
        """
        Get the most representative article from a cluster.
        
        Uses a combination of:
        - Recency (prefer newer articles)
        - Content length (prefer more detailed articles)
        - Source reputation (prefer known sources)
        
        Args:
            cluster: List of articles in the cluster
            
        Returns:
            Representative article
        """
        if len(cluster) == 1:
            return cluster[0]
        
        # Score each article
        scores = []
        for article in cluster:
            score = 0.0
            
            # Recency score (0-1, newer is better)
            latest_time = max(a.published_at for a in cluster)
            oldest_time = min(a.published_at for a in cluster)
            time_range = (latest_time - oldest_time).total_seconds()
            if time_range > 0:
                time_score = (article.published_at - oldest_time).total_seconds() / time_range
            else:
                time_score = 1.0
            score += time_score * 0.4
            
            # Content length score (0-1, longer is better up to a point)
            content_len = len(article.content)
            optimal_length = 1000
            length_score = min(content_len / optimal_length, 1.0)
            score += length_score * 0.3
            
            # Source reputation score (simple heuristic)
            reputation_sources = ['reuters', 'bloomberg', 'wsj', 'ft.com', 'cnbc']
            reputation_score = 1.0 if any(s in article.source.lower() for s in reputation_sources) else 0.5
            score += reputation_score * 0.3
            
            scores.append((score, article))
        
        # Return article with highest score
        scores.sort(key=lambda x: x[0], reverse=True)
        return scores[0][1]


if __name__ == "__main__":
    # Test deduplication
    import asyncio
    from news_collector import NewsCollector
    
    async def test():
        async with NewsCollector() as collector:
            articles = await collector.collect_news(time_window_hours=24)
            
            deduplicator = NewsDeduplicator()
            clusters = deduplicator.cluster_articles(articles, similarity_threshold=0.85)
            
            print(f"\nFound {len(clusters)} clusters from {len(articles)} articles\n")
            
            for cluster_id, cluster_articles in list(clusters.items())[:5]:
                print(f"\n{cluster_id}: {len(cluster_articles)} articles")
                rep = deduplicator.get_representative_article(cluster_articles)
                print(f"Representative: {rep.title}")
                print(f"Sources in cluster: {', '.join(set(a.source for a in cluster_articles))}")
    
    asyncio.run(test())

