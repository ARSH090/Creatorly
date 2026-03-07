import requests

def get_admin_announcements_with_valid_admin_authentication():
    base_url = "http://localhost:3000"
    endpoint = "/api/admin/announcements"
    url = base_url + endpoint

    headers = {
        "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3",
        "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        json_data = response.json()
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert json_data.get("success") is True, "Response 'success' field is not True"
        assert isinstance(json_data.get("data"), list), "Response 'data' field is not a list"

        for announcement in json_data["data"]:
            assert isinstance(announcement, dict), "Each announcement should be a dict"
            assert "id" in announcement, "Announcement missing 'id'"
            assert "title" in announcement, "Announcement missing 'title'"
            assert "body" in announcement, "Announcement missing 'body'"
            assert "createdAt" in announcement, "Announcement missing 'createdAt'"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError:
        assert False, "Response content is not valid JSON"

get_admin_announcements_with_valid_admin_authentication()