import requests

def test_get_creator_profile_with_valid_authentication():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/creator/profile"
    headers = {
        "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3",
        "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    else:
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        json_data = response.json()
        assert isinstance(json_data, dict), "Response is not a JSON object"
        assert json_data.get("success") is True, "Response success flag is not True"
        data = json_data.get("data")
        assert data is not None, "Response data is missing"
        assert "profile" in data, "Response data missing 'profile'"
        assert "storefrontConfig" in data, "Response data missing 'storefrontConfig'"

test_get_creator_profile_with_valid_authentication()