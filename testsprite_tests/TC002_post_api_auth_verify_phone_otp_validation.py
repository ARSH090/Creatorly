import requests
import time

BASE_URL = "http://localhost:3000"
VERIFY_PHONE_ENDPOINT = "/api/auth/verify-phone"
TIMEOUT = 30

def test_post_api_auth_verify_phone_otp_validation():
    session = requests.Session()
    phone_number = "+919876543210"
    correct_otp = "123456"
    incorrect_otps = ["000000", "111111", "222222"]

    headers = {
        "Content-Type": "application/json"
    }

    # 1. Test correct OTP acceptance
    payload_correct = {
        "phone": phone_number,
        "otp": correct_otp
    }
    try:
        response = session.post(
            BASE_URL + VERIFY_PHONE_ENDPOINT,
            json=payload_correct,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected 200 OK for correct OTP, got {response.status_code}"
        json_resp = response.json()
        assert "success" in json_resp and isinstance(json_resp["success"], bool), "Missing or invalid 'success' in response"
        assert json_resp["success"] is True, "OTP verification should succeed for correct OTP"
    except requests.RequestException as e:
        assert False, f"Request failed for correct OTP: {e}"

    # 2. Test incorrect OTP rejection
    for wrong_otp in incorrect_otps:
        payload_wrong = {
            "phone": phone_number,
            "otp": wrong_otp
        }
        try:
            response = session.post(
                BASE_URL + VERIFY_PHONE_ENDPOINT,
                json=payload_wrong,
                headers=headers,
                timeout=TIMEOUT
            )
            # Expected: 400 or 401 or 422 for invalid OTP depending on implementation
            assert response.status_code in (400, 401, 422), f"Expected error status for wrong OTP, got {response.status_code}"
            json_resp = response.json()
            assert "error" in json_resp or "message" in json_resp, "Expected error or message field for wrong OTP response"
            error_msg = json_resp.get("error") or json_resp.get("message")
            assert isinstance(error_msg, str) and any(keyword in error_msg.lower() for keyword in ["incorrect", "invalid", "otp"]), f"Unexpected error message: {error_msg}"
        except requests.RequestException as e:
            assert False, f"Request failed for incorrect OTP {wrong_otp}: {e}"

    # 3. Test lockout after multiple failed attempts
    # Clear or restart is not in scope, so we retry 3+ times with wrong OTP to trigger lockout.
    lockout_trigger_otp = "999999"
    max_attempts = 4
    locked_out = False
    for attempt in range(max_attempts):
        payload_lockout = {
            "phone": phone_number,
            "otp": lockout_trigger_otp
        }
        try:
            response = session.post(
                BASE_URL + VERIFY_PHONE_ENDPOINT,
                json=payload_lockout,
                headers=headers,
                timeout=TIMEOUT
            )
            if attempt < 3:
                # Expect normal error response
                assert response.status_code in (400, 401, 422), f"Expected error for failed OTP attempt {attempt+1}, got {response.status_code}"
                json_resp = response.json()
                error_msg = json_resp.get("error") or json_resp.get("message") or ""
                assert any(keyword in error_msg.lower() for keyword in ["incorrect", "invalid", "otp"]), f"Unexpected error message on attempt {attempt+1}: {error_msg}"
            else:
                # On 4th attempt or later, expect lockout message and status code possibly 429 or specific lockout code
                if response.status_code == 429 or response.status_code == 403:
                    json_resp = response.json()
                    err_msg = json_resp.get("error") or json_resp.get("message") or ""
                    assert "locked" in err_msg.lower() or "lockout" in err_msg.lower() or "10 minutes" in err_msg.lower(), "Lockout message expected after multiple failed attempts"
                    locked_out = True
                else:
                    # Some implementations may respond with 400 + lockout message
                    json_resp = response.json()
                    err_msg = json_resp.get("error") or json_resp.get("message") or ""
                    if "locked" in err_msg.lower() or "lockout" in err_msg.lower() or "10 minutes" in err_msg.lower():
                        locked_out = True
                    else:
                        assert False, f"Expected lockout message on attempt {attempt+1}, got status {response.status_code} with message: {err_msg}"
        except requests.RequestException as e:
            assert False, f"Request failed on lockout attempt {attempt+1}: {e}"

        if locked_out:
            break

    assert locked_out, "Expected lockout after multiple failed OTP attempts was not triggered"

test_post_api_auth_verify_phone_otp_validation()