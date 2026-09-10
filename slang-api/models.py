from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime


Base = declarative_base()


class Slang(Base):

    __tablename__ = "slang"

    id = Column(
        Integer,
        primary_key=True
    )

    keyword = Column(
        String,
        unique=True
    )

    score = Column(
        Integer
    )

    meaning = Column(
        String
    )

    example = Column(
        String
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )