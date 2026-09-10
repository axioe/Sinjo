from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import Session
from models import Slang

import scheduler
import os

app = FastAPI()

origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5555,http://127.0.0.1:5555"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(
    "/fastapi/google-trends/ranking"
)
def ranking():
    session = Session()
    result = (
        session.query(Slang)
        .order_by(
          Slang.score.desc()
        )
        .limit(10)
        .all()
    )

    return [

        {
            "keyword":x.keyword,

            "score":x.score,

            "meaning":x.meaning,

            "example":x.example
        }

        for x in result

    ]

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("app:app", host="0.0.0.0", port=8000)