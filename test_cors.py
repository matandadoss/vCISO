import urllib.request
import urllib.error

url = 'http://localhost:8000/api/v1/dashboard/summary?org_id=default'
req = urllib.request.Request(url, method='OPTIONS')
req.add_header('Origin', 'http://localhost:3000')
req.add_header('Access-Control-Request-Method', 'GET')
req.add_header('Access-Control-Request-Headers', 'authorization,content-type')

try:
    print("--- OPTIONS PREFLIGHT ---")
    res = urllib.request.urlopen(req)
    print(f"Status: {res.status}")
    for k, v in res.headers.items():
        print(f"{k}: {v}")
        
    print("\n--- GET REQUEST ---")
    req2 = urllib.request.Request(url, method='GET')
    req2.add_header('Origin', 'http://localhost:3000')
    req2.add_header('Authorization', 'Bearer mock-token')
    res2 = urllib.request.urlopen(req2)
    print(f"Status: {res2.status}")
    for k, v in res2.headers.items():
        print(f"{k}: {v}")
    print("\nBody: ", res2.read()[:100])
except urllib.error.URLError as e:
    print(f"Network / Protocol Error: {e}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.reason}")
