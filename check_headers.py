import urllib.request
import json

url = "https://vciso-frontend-457240052356.us-central1.run.app/"
req = urllib.request.Request(url, method="HEAD")
try:
    with urllib.request.urlopen(req) as response:
        headers = dict(response.headers)
        print(json.dumps(headers, indent=2))
except Exception as e:
    print(f"Error: {e}")
