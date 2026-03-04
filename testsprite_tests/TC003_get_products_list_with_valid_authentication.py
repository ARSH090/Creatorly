import requests

def test_get_products_list_with_valid_authentication():
    base_url = "http://localhost:3000"
    endpoint = "/api/products"
    headers = {
        "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1",
        "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3"
    }
    try:
        response = requests.get(base_url + endpoint, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to get products list failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    json_data = response.json()
    assert "success" in json_data and json_data["success"] is True, "Response success flag not True"
    assert "data" in json_data and isinstance(json_data["data"], list), "Response data is not a list"

test_get_products_list_with_valid_authentication()