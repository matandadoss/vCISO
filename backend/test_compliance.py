import urllib.request
import urllib.error

try:
    response = urllib.request.urlopen('http://localhost:8001/api/v1/compliance/frameworks?org_id=default')
    print("SUCCESS", response.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR BODY:", e.read().decode())
except Exception as e:
    print("GENERAL ERROR:", e)
