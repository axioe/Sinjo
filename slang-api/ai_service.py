import os
import json

from openai import OpenAI
from dotenv import load_dotenv


load_dotenv()


client = OpenAI(
    api_key=os.getenv(
        "OPENAI_API_KEY"
    )
)



def analyze(keyword):

  try:
    prompt = f"""
      너는 한국 인터넷 신조어 분석 전문가이다.

      반드시 JSON Object 하나만 반환한다.
      Markdown 코드블록을 사용하지 않는다.

      형식:

      {{
        "is_slang": true,
        "score": 0~100,
        "meaning": "설명",
        "example": "사용 예"
      }}

      분석 대상:
      {keyword}
    """

    response = client.chat.completions.create(

        model="gpt-4.1-mini",

        response_format={
          "type":"json_object"
        },

        messages=[
          {
              "role":"user",
              "content":prompt
          }
        ]
    )

    text = (
        response
        .choices[0]
        .message
        .content
    )

    return json.loads(text)
 
  except Exception as e:
    print(
        "AI ERROR:",
        keyword,
        e
    )

    return {
        "is_slang":False,
        "score":0,
        "meaning":"",
        "example":""
    }