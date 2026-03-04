import requests

BASE_URL = "http://localhost:3000"
HEADERS = {
    "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1",
    "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3"
}
TIMEOUT = 30


def test_get_oembed_data_with_valid_platform_and_url():
    params = {
        "platform": "instagram",
        "url": "https://www.instagram.com/p/ABC123/"
    }
    try:
        response = requests.get(
            f"{BASE_URL}/api/storefront/oembed",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        
        json_data = response.json()
        assert json_data.get("success") is True, "Response 'success' field is not True"
        data = json_data.get("data")
        assert isinstance(data, dict), "'data' field is missing or not a dictionary"
        
        # Validate essential oEmbed metadata fields presence and types
        assert "html" in data and isinstance(data["html"], str) and data["html"], "'html' field missing or empty"
        assert "provider_name" in data and isinstance(data["provider_name"], str) and data["provider_name"], "'provider_name' field missing or empty"
        assert "thumbnail_url" in data and isinstance(data["thumbnail_url"], str) and data["thumbnail_url"], "'thumbnail_url' field missing or empty"
        assert "author_name" in data and isinstance(data["author_name"], str) and data["author_name"], "'author_name' field missing or empty"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"


test_get_oembed_data_with_valid_platform_and_url()