"""
Test utility for the Neotic Chat API.
"""
import json
import urllib.error
import urllib.request

API_URL = 'http://127.0.0.1:8001/api/chat'
REQUEST_DATA = json.dumps({'prompt': 'test'}).encode('utf-8')

# Security: Ensure we are only using known permitted schemes for test requests.
if not API_URL.startswith(('http://', 'https://')):
    raise ValueError(f"UNSUPPORTED SCHEME: {API_URL}")

REQUEST = urllib.request.Request(
    API_URL,
    data=REQUEST_DATA,
    headers={'Content-Type': 'application/json'}
)

try:
    # Bandit: URL audit for permitted schemes (already checked above B310).
    with urllib.request.urlopen(REQUEST) as response: # nosec B310
        print("STATUS:", response.status)
        print("BODY:", response.read().decode())
except urllib.error.HTTPError as http_error:
    print("HTTP ERROR:", http_error.code)
    print("ERROR BODY:", http_error.read().decode())
except urllib.error.URLError as url_error:
    print("URL ERROR:", url_error.reason)
except Exception as generic_error: # pylint: disable=broad-except
    print("Exception:", generic_error)
