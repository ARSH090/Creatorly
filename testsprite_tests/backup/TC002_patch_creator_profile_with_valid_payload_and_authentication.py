import requests

def patch_creator_profile_with_valid_payload_and_authentication():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/creator/profile"

    headers = {
        "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3",
        "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1",
        "Content-Type": "application/json"
    }

    payload = {
        "theme": {
            "primary": "#123456",
            "text": "#abcdef"
        },
        "blocksLayout": [
            {"type": "header", "content": "Welcome to my store!"},
            {"type": "productGrid", "columns": 3}
        ]
    }

    try:
        response = requests.patch(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    json_response = response.json()
    assert json_response.get("success") is True, "Response 'success' field is not True"
    updatedProfile = json_response.get("data", {}).get("updatedProfile")
    assert updatedProfile is not None, "Response missing 'updatedProfile' data"
    # Validate that updatedProfile contains updated theme and blocksLayout
    updated_theme = updatedProfile.get("theme")
    updated_blocksLayout = updatedProfile.get("blocksLayout")

    assert updated_theme == payload["theme"], f"Updated theme mismatch: expected {payload['theme']} got {updated_theme}"
    assert updated_blocksLayout == payload["blocksLayout"], f"Updated blocksLayout mismatch: expected {payload['blocksLayout']} got {updated_blocksLayout}"

patch_creator_profile_with_valid_payload_and_authentication()