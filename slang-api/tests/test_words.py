from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_get_ranking():
    response = client.get("/fastapi/google-trends/ranking")

    assert response.status_code == 200

    data = response.json()

    # 응답이 리스트인지 확인
    assert isinstance(data, list)

    # 데이터가 존재하는지 확인
    assert len(data) > 0

    # 첫 번째 항목의 필드 검증
    item = data[0]

    assert "keyword" in item
    assert "score" in item
    assert "meaning" in item
    assert "example" in item

# python -m pytest tests/test_words.py -v    