"""
Test utility for the Noetic Chat API.
"""
import json
import urllib.error
import urllib.request

API_URL = 'http://127.0.0.1:8001/api/chat'
REQUEST_DATA = json.dumps({'prompt': 'test'})
REQUEST = urllib.request.Request(
    API_URL, 
    data=REQUEST_DATA.encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(REQUEST) as response:
        print("STATUS:", response.status)
        print("BODY:", response.read().decode())
except urllib.error.HTTPError as http_error:
    print("HTTP ERROR:", http_error.code)
    print("ERROR BODY:", http_error.read().decode())
except Exception as generic_error:
    print("Exception:", generic_error)
