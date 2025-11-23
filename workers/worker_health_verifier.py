#!/usr/bin/env python3
"""Worker script to verify backend health and submit a verification record.

Usage:
  python worker_health_verifier.py --base-url http://127.0.0.1:3001/api --creds <worker_credentials>

It will:
  1. GET <base-url>/health to determine status (expects JSON with key 'status').
  2. Map result to verification status (UP->OK, else CRITICAL).
  3. POST to <base-url>/verifications with worker creds and status/details.

Requires: requests
  pip install requests
"""
import argparse
import json
import sys
import time
from typing import Tuple

try:
    import requests  # type: ignore
except ImportError:
    print("Missing dependency 'requests'. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)

API_URL = 'http://127.0.0.1:3000/api'
CREDS = '748a73a814d822d3e81d5b6a83cad034'

def get_health(base_url: str) -> Tuple[str, dict]:
    url = base_url.rstrip('/') + '/health'
    started = time.time()
    try:
        r = requests.get(url, timeout=5)
        elapsed = time.time() - started
        data = {}
        try:
            data = r.json()
        except Exception:
            data = {"raw": r.text}
        status_text = data.get('status') or ('UP' if r.ok else 'DOWN')
        return status_text, {"http_status": r.status_code, "elapsed_sec": round(elapsed, 3), "data": data}
    except Exception as e:
        return 'DOWN', {"error": str(e)}

def submit_verification(base_url: str, creds: str, verif_status: str, details: dict) -> Tuple[bool, dict]:
    url = base_url.rstrip('/') + '/verifications'
    payload = {
        "creds_worker": creds,
        "status": verif_status,
        "details": json.dumps(details, ensure_ascii=False)
    }
    headers = {
        "Content-Type": "application/json",
        "x-worker-creds": creds
    }
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=10)
        try:
            resp = r.json()
        except Exception:
            resp = {"raw": r.text}
        return r.ok, resp
    except Exception as e:
        return False, {"error": str(e)}

def main():
    global API_URL, CREDS
    health_status, health_details = get_health(API_URL)
    # Map health to allowed verification statuses
    verif_status = 'OK' if health_status.upper() == 'UP' else 'ERROR'

    ok, resp = submit_verification(API_URL, CREDS, verif_status, health_details)

    print(json.dumps({
        "health_status": health_status,
        "verif_status": verif_status,
        "submitted": ok,
        "verification_response": resp
    }, indent=2, ensure_ascii=False))

    if not ok:
        sys.exit(2)

if __name__ == '__main__':
    main()
