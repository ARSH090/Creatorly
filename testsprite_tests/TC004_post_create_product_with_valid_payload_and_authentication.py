import requests

def test_post_create_product_with_valid_payload_and_authentication():
    base_url = "http://localhost:3000"
    endpoint = "/api/products"
    url = base_url + endpoint

    headers = {
        "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1",
        "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3",
        "Content-Type": "application/json"
    }

    payload = {
        "name": "Test Product",
        "description": "A product created during automated testing",
        "price": 9999,
        "productType": "digital",
        "thumbnailKey": "thumb123key",
        "fileKey": "file123key",
        "isPublished": True
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        json_data = response.json()
        assert "success" in json_data and json_data["success"] is True, "Response success field is not True"
        assert "data" in json_data, "Response missing data field"
        data = json_data["data"]
        assert "productId" in data and data["productId"], "Response data missing productId"
        assert "slug" in data and data["slug"], "Response data missing slug"
    finally:
        # Cleanup: delete the created product if productId is present
        if 'data' in locals() and "productId" in data:
            delete_url = f"{base_url}/api/products/{data['productId']}"
            try:
                requests.delete(delete_url, headers=headers, timeout=30)
            except Exception:
                pass

test_post_create_product_with_valid_payload_and_authentication()
