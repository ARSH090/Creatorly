import requests

BASE_URL = "http://localhost:3000"
HEADERS = {
    "X-Test-Secret": "v3ry-s3cr3t-t3st-v4lu3",
    "Content-Type": "application/json"
}

def test_post_api_auth_sync_user_onboarding():
    url = f"{BASE_URL}/api/auth/sync"
    payload = {
        # Sample user onboarding sync payload with realistic fields
        "username": "testuser123",
        "fullName": "Test User",
        "email": "testuser123@example.com",
        "phone": "+919876543210",
        "otpVerified": True,
        "plan": "trial",
        "razorpayMandateId": "mandate_test_12345"
    }

    try:
        response = requests.post(url, json=payload, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    try:
        body = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "success" in body, "'success' key missing in response"
    assert body["success"] is True, "API call not successful"

    # Adjust to check for user key either under 'data' or directly in response body
    if "data" in body:
        data = body["data"]
        assert isinstance(data, dict), "'data' is not a dict"
        assert "user" in data, "'user' object missing in data"
        user = data["user"]
    else:
        assert "user" in body, "'user' key missing in response body"
        user = body["user"]

    assert isinstance(user, dict), "'user' is not a dict"
    assert "id" in user, "'id' missing in user object"
    assert isinstance(user["id"], (str, int)), "'id' in user is not a string/int"


test_post_api_auth_sync_user_onboarding()