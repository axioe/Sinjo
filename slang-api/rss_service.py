import feedparser


RSS_URL = (
    "https://trends.google.com/"
    "trending/rss?geo=KR"
)

def is_candidate(keyword):

  ignore = [
      "뉴스",
      "공식",
      "대학교",
      "학교",
      "정부",
      "선수",
      "세금"
  ]

  return not any(
      x in keyword
      for x in ignore
  )


def get_trending_keywords():

  feed = feedparser.parse(RSS_URL)

  return [
      item.title
      for item in feed.entries
      if is_candidate(item.title)
  ]