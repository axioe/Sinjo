from apscheduler.schedulers.background import BackgroundScheduler

from db import Session
from models import Slang

from rss_service import get_trending_keywords
from ai_service import analyze

def collect():
    session = Session()
    keywords = (
        get_trending_keywords()
    )

    for keyword in keywords:
      try:
          result = analyze(keyword)
          if result["is_slang"]:
            data = Slang(
              keyword=keyword,
              score=result["score"],
              meaning=result["meaning"],
              example=result["example"]
            )
            session.merge(data)

      except Exception as e:
        print(
            "ERROR:",
            keyword,
            e
        )
    session.commit()
    session.close()

scheduler = BackgroundScheduler()

# 1분마다 실행
# scheduler.add_job(
#   collect,
#   "interval",
#   minutes=1
# )

# 매일 오전 3시에 한 번 실행
# scheduler.add_job(
#     collect,
#     "cron",
#     hour=3,
#     minute=0
# )

# 24시간마다 한 번
scheduler.add_job(
    collect,
    "interval",
    days=1
)

scheduler.start()