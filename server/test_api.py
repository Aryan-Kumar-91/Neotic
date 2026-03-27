import urllib.request
import json
import urllib.error

url = 'http://127.0.0.1:8000/api/reason'
data = json.dumps({'query': 'test'})
req = urllib.request.Request(url, data=data.encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("ERROR BODY:", e.read().decode())
except Exception as e:
    print("Exception:", e)
