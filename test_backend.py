import urllib.request
import urllib.error

req = urllib.request.Request('http://localhost:8000/api/v1/admin/tiers/', headers={'Authorization': 'Bearer mock-token'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.URLError as e:
    print(e.reason)
