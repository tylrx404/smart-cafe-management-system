import requests

try:
    resp = requests.post(
        "http://localhost:8000/chat",
        json={"message": "hello", "history": []}
    )
    print("STATUS", resp.status_code)
    print("BODY", resp.text)
except Exception as e:
    print("ERR", e)
