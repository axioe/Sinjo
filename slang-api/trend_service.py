from pytrends.request import TrendReq

pytrend = TrendReq(hl="ko-KR", tz=540)

def get_trending_keywords():

    try:
        trending = pytrend.trending_searches(pn="south_korea")
        return trending[0].tolist()

    except Exception as e:
        print(e)
        return []