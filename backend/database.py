"""Database models and connection for storing radar results."""

import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship, Session
from sqlalchemy.pool import NullPool

from config import settings

Base = declarative_base()


class RadarRun(Base):
    """Represents a single radar processing run."""
    
    __tablename__ = "radar_runs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False, index=True)
    time_window_hours = Column(Integer, nullable=False)
    total_articles_processed = Column(Integer, nullable=False)
    processing_time_seconds = Column(Float, nullable=False)
    hotness_threshold = Column(Float, nullable=False)
    top_k = Column(Integer, nullable=False)
    
    # Relationships
    stories = relationship("StoryDB", back_populates="radar_run", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "time_window_hours": self.time_window_hours,
            "total_articles_processed": self.total_articles_processed,
            "processing_time_seconds": self.processing_time_seconds,
            "hotness_threshold": self.hotness_threshold,
            "top_k": self.top_k,
            "story_count": len(self.stories) if self.stories else 0
        }


class StoryDB(Base):
    """Represents a news story from radar processing."""
    
    __tablename__ = "stories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    radar_run_id = Column(Integer, ForeignKey("radar_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Story data
    story_id = Column(String(100), nullable=False)  # cluster_0001, etc.
    headline = Column(Text, nullable=False)
    hotness = Column(Float, nullable=False, index=True)
    why_now = Column(Text, nullable=False)
    draft = Column(Text, nullable=False)
    dedup_group = Column(String(100), nullable=False)
    article_count = Column(Integer, default=1)
    
    # Complex fields stored as JSON
    hotness_details = Column(JSON, nullable=False)
    entities = Column(JSON, nullable=False)
    sources = Column(JSON, nullable=False)
    timeline = Column(JSON, nullable=False)
    
    # Deep research fields
    has_deep_research = Column(Boolean, default=False)
    research_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    
    # Relationships
    radar_run = relationship("RadarRun", back_populates="stories")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary matching NewsStory model."""
        return {
            "id": self.story_id,
            "headline": self.headline,
            "hotness": self.hotness,
            "hotness_details": self.hotness_details,
            "why_now": self.why_now,
            "entities": self.entities,
            "sources": self.sources,
            "timeline": self.timeline,
            "draft": self.draft,
            "dedup_group": self.dedup_group,
            "article_count": self.article_count,
            "has_deep_research": self.has_deep_research,
            "research_summary": self.research_summary,
            "created_at": self.created_at.isoformat()
        }


class DatabaseManager:
    """Manager for database operations."""
    
    def __init__(self):
        """Initialize database manager."""
        self.database_url = settings.database_url
        self.engine = None
        self.session_maker = None
    
    def init_sync(self):
        """Initialize synchronous engine."""
        if not self.engine:
            # Synchronous engine for initialization
            sync_url = self.database_url.replace("postgresql+asyncpg://", "postgresql://")
            self.engine = create_engine(sync_url, echo=False)
            Base.metadata.create_all(self.engine)
    
    async def init_async(self):
        """Initialize async engine and session maker."""
        if not self.session_maker:
            engine = create_async_engine(
                self.database_url,
                echo=False,
                poolclass=NullPool
            )
            
            # Create tables
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            self.session_maker = async_sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
    
    @asynccontextmanager
    async def get_session(self):
        """Get async database session."""
        if not self.session_maker:
            await self.init_async()
        
        session = self.session_maker()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
    
    async def save_radar_result(
        self,
        stories: List[Dict[str, Any]],
        total_articles_processed: int,
        time_window_hours: int,
        processing_time_seconds: float,
        hotness_threshold: float,
        top_k: int
    ) -> int:
        """
        Save radar processing result to database.
        
        Args:
            stories: List of story dictionaries
            total_articles_processed: Total articles processed
            time_window_hours: Time window used
            processing_time_seconds: Processing time
            hotness_threshold: Hotness threshold used
            top_k: Top K parameter used
            
        Returns:
            ID of the created radar run
        """
        async with self.get_session() as session:
            # Create radar run
            radar_run = RadarRun(
                time_window_hours=time_window_hours,
                total_articles_processed=total_articles_processed,
                processing_time_seconds=processing_time_seconds,
                hotness_threshold=hotness_threshold,
                top_k=top_k
            )
            session.add(radar_run)
            await session.flush()  # Get the ID
            
            # Create stories
            for story_data in stories:
                story = StoryDB(
                    radar_run_id=radar_run.id,
                    story_id=story_data.get("id", ""),
                    headline=story_data.get("headline", ""),
                    hotness=story_data.get("hotness", 0.0),
                    why_now=story_data.get("why_now", ""),
                    draft=story_data.get("draft", ""),
                    dedup_group=story_data.get("dedup_group", ""),
                    article_count=story_data.get("article_count", 1),
                    hotness_details=story_data.get("hotness_details", {}),
                    entities=story_data.get("entities", []),
                    sources=story_data.get("sources", []),
                    timeline=story_data.get("timeline", []),
                    has_deep_research=story_data.get("has_deep_research", False),
                    research_summary=story_data.get("research_summary", None)
                )
                session.add(story)
            
            await session.commit()
            return radar_run.id
    
    async def get_radar_history(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get radar processing history.
        
        Args:
            limit: Maximum number of results
            offset: Offset for pagination
            
        Returns:
            List of radar run dictionaries with story counts
        """
        from sqlalchemy import select, desc, func
        
        async with self.get_session() as session:
            # Query radar runs with story count
            query = (
                select(
                    RadarRun,
                    func.count(StoryDB.id).label("story_count")
                )
                .outerjoin(StoryDB)
                .group_by(RadarRun.id)
                .order_by(desc(RadarRun.created_at))
                .limit(limit)
                .offset(offset)
            )
            
            result = await session.execute(query)
            rows = result.all()
            
            return [
                {
                    **row[0].to_dict(),
                    "story_count": row[1]
                }
                for row in rows
            ]
    
    async def get_radar_run_details(
        self,
        run_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific radar run.
        
        Args:
            run_id: Radar run ID
            
        Returns:
            Dictionary with run details and stories, or None if not found
        """
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        async with self.get_session() as session:
            query = (
                select(RadarRun)
                .options(selectinload(RadarRun.stories))
                .where(RadarRun.id == run_id)
            )
            
            result = await session.execute(query)
            radar_run = result.scalar_one_or_none()
            
            if not radar_run:
                return None
            
            return {
                **radar_run.to_dict(),
                "stories": [story.to_dict() for story in radar_run.stories]
            }
    
    async def delete_old_runs(self, keep_last_n: int = 100):
        """
        Delete old radar runs, keeping only the last N runs.
        
        Args:
            keep_last_n: Number of recent runs to keep
        """
        from sqlalchemy import select, delete
        
        async with self.get_session() as session:
            # Get IDs of runs to keep
            query = (
                select(RadarRun.id)
                .order_by(RadarRun.created_at.desc())
                .limit(keep_last_n)
            )
            result = await session.execute(query)
            ids_to_keep = [row[0] for row in result.all()]
            
            if ids_to_keep:
                # Delete old runs
                delete_query = delete(RadarRun).where(RadarRun.id.notin_(ids_to_keep))
                await session.execute(delete_query)
                await session.commit()


# Global database manager instance
db_manager = DatabaseManager()

