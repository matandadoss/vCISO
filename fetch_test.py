import urllib.request
import urllib.error

url = "https://vciso-backend-457240052356.us-central1.run.app/api/v1/findings?org_id=default&sort_by=detected_at&sort_dir=desc"
try:
    response = urllib.request.urlopen(url)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
