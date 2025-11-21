from pydantic import with_config
import asyncio
from sqlalchemy import  Integer, Text, String, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, Mapped, mapped_column #, sessionmaker
from operator import index
import logging
###########from sqlalchemy.testing.schema import mapped_column
from sqlalchemy.orm import mapped_column
from sqlalchemy import event  ###### to enable multiple readers and writers to work at the same time (concurrently)

"""
even though it works,  use async_sessionmaker instead of sessionmaker for async 
"""


"""

databaseforfastapi=# INSERT INTO "postsP" (title , content , is_published)
databaseforfastapi-# VALUES('FROM PSQL' , 'aaaaaaaaaaaaaaaaaaaaaaaaaaasssss' , true);
INSERT 0 1

"""
DATABASE_URI = "sqlite+aiosqlite:///./sqlite_database.db"

engine_sqlite = create_async_engine (DATABASE_URI, echo=True) #echo=True in SQLAlchemy makes the engine print all the

# --- THIS BLOCK IS ADDED FOR CONCURRENCY ---
# Force SQLite into WAL mode to prevent "database is locked" errors in async apps
@event.listens_for(engine_sqlite.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()
# ----------------------
                                                          # SQL statements it executes.debugging testing etc but not production
AsyncSessionLocal = async_sessionmaker(
    bind=engine_sqlite,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    #### autocommit=False  this one is old not valid for sqlalchemy 2.0+ ((remove it))
)
Base = declarative_base()

#class Base(declarative_base):
#   pass

class PostSqlite(Base):
    __tablename__ = "postsP"          ## left side for python right side for SQL content:Mapped[str] (py) = (sql)  mapped_column[Text] since python has no Text type it uses str for it
    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title : Mapped[str] = mapped_column(String, index=True)
    content : Mapped[str] = mapped_column(Text)
    is_published : Mapped[bool] = mapped_column(Boolean, default=True)

    #def __repr__(self) -> str:
    #    return f"User(id={self.id!r}, name={self.name!r}, fullname={self.fullname!r})"


async def init_db_sqlite():
    async with engine_sqlite.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # dont go like bind=engine_postgres when using run_sync it automatically binds the connections

async def get_db_sqlite():
    """
       Usage in FastAPI:
           async def endpoint(db: AsyncSession = Depends(get_db_postgres)):
               ...
       The context manager ensures the session is closed automatically.
       """
    async with AsyncSessionLocal() as db:
        try:
            yield db
        except Exception as e:
            await db.rollback()
            raise e
        finally:
            await db.close()