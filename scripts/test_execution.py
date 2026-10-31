#!/usr/bin/env python3
"""
Standalone developer utility to test connection to the code-execution provider.

Request Contract:
  POST https://api.onlinecompiler.io/api/run-code-sync/
  Header: Authorization: <API_KEY>
  JSON body:
  {
    "compiler": "python-3.14",
    "code": "name = input()\\nprint(f'Hello, {name}!')",
    "input": "World"
  }
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    print("Error: The 'requests' package is required but not installed.", file=sys.stderr)
    print("Install it with: python -m pip install requests", file=sys.stderr)
    sys.exit(1)

ENDPOINT = "https://api.onlinecompiler.io/api/run-code-sync/"
TIMEOUT_SECONDS = 15


def load_api_key() -> Optional[str]:
    """
    Loads CODE_EXECUTION_API_KEY from environment or backend/.env file.
    Does NOT override existing process environment variables.
    Does NOT print or leak secret values.
    """
    # 1. Check existing process environment first
    key = os.environ.get("CODE_EXECUTION_API_KEY")
    if key and key.strip():
        return key.strip()

    # 2. Resolve backend/.env safely relative to this script directory
    script_dir = Path(__file__).resolve().parent
    # scripts/ -> backend/.env
    env_file = (script_dir.parent / "backend" / ".env").resolve()

    if env_file.is_file():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        parts = line.split("=", 1)
                        var_name = parts[0].strip()
                        var_val = parts[1].strip()
                        # Strip outer matching quotes if present
                        if len(var_val) >= 2 and (
                            (var_val.startswith('"') and var_val.endswith('"'))
                            or (var_val.startswith("'") and var_val.endswith("'"))
                        ):
                            var_val = var_val[1:-1]

                        if var_name == "CODE_EXECUTION_API_KEY" and var_val:
                            return var_val
        except Exception:
            # If reading the file fails, silently proceed
            pass

    return None


def run_smoke_test() -> int:
    key = load_api_key()
    if not key:
        print("Provider smoke test not run: API key not configured.", file=sys.stderr)
        print("To configure the key, set CODE_EXECUTION_API_KEY in your environment or in backend/.env", file=sys.stderr)
        return 2

    payload = {
        "compiler": "python-3.14",
        "code": "name = input()\nprint(f'Hello, {name}!')",
        "input": "World",
    }

    # Direct authorization header as supplied by provider specification (no Bearer prefix)
    headers = {
        "Authorization": key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = requests.post(
            ENDPOINT,
            headers=headers,
            json=payload,
            timeout=TIMEOUT_SECONDS,
            verify=True,
            allow_redirects=False,  # Reject unexpected redirects rather than following with credentials
        )
    except requests.exceptions.Timeout:
        print("HTTP status: TIMEOUT")
        print("Execution status: network_error")
        print("Output: Connection timed out.")
        print("FAIL")
        return 1
    except requests.exceptions.SSLError:
        print("HTTP status: SSL_ERROR")
        print("Execution status: tls_failure")
        print("Output: TLS certificate verification failed.")
        print("FAIL")
        return 1
    except requests.exceptions.RequestException as e:
        print("HTTP status: REQUEST_ERROR")
        print("Execution status: connection_failed")
        print(f"Output: Request failed ({type(e).__name__}).")
        print("FAIL")
        return 1

    http_status = response.status_code

    # Check for redirect (3xx)
    if 300 <= http_status < 400:
        print(f"HTTP status: {http_status} (unexpected redirect)")
        print("Execution status: redirect_blocked")
        print("Output: Unexpected redirect received from provider endpoint.")
        print("FAIL")
        return 1

    # Non-200 HTTP responses
    if http_status != 200:
        print(f"HTTP status: {http_status}")
        print("Execution status: http_error")
        print("Output: Provider returned non-200 HTTP response.")
        print("FAIL")
        return 1

    # Parse JSON
    try:
        data = response.json()
    except (ValueError, json.JSONDecodeError):
        print(f"HTTP status: {http_status}")
        print("Execution status: invalid_json")
        print("Output: Provider response was not valid JSON.")
        print("FAIL")
        return 1

    if not isinstance(data, dict):
        print(f"HTTP status: {http_status}")
        print("Execution status: invalid_payload")
        print("Output: Response JSON is not an object.")
        print("FAIL")
        return 1

    status_val = data.get("status")
    output_val = data.get("output")

    print(f"HTTP status: {http_status}")
    print(f"Execution status: {status_val}")
    print(f"Output: {output_val}")

    # Validation criteria:
    # 1. status must equal "success"
    # 2. output must equal "Hello, World!" (tolerating a trailing newline)
    expected_output = "Hello, World!"
    actual_output = str(output_val).rstrip("\r\n") if output_val is not None else ""

    if status_val == "success" and actual_output == expected_output:
        print("PASS")
        return 0
    else:
        print("FAIL")
        return 1


if __name__ == "__main__":
    sys.exit(run_smoke_test())

