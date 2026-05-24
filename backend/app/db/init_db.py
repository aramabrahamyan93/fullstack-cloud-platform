from app.db.database import Base
from app.db.database import engine

from app.models.task import Task


def init_db():
    Base.metadata.create_all(bind=engine)