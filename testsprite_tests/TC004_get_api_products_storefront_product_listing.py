import requests

def test_get_api_products_storefront_product_listing():
    base_url = "http://localhost:3000"
    endpoint = "/api/products"
    headers = {
        "X-Test-Secret": "v3ry-s3cr3t-t3st-v4lu3"
    }
    params = {
        "creatorId": "65db8d9f1234567890abcdef"
    }
    try:
        response = requests.get(
            url=f"{base_url}{endpoint}",
            headers=headers,
            params=params,
            timeout=30
        )
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {endpoint} failed: {e}"

    json_response = response.json()

    # Check that response wrapper fields exist
    assert "success" in json_response, "'success' key not found in response"
    assert json_response["success"] is True, "API response 'success' is not True"
    assert "data" in json_response, "'data' key not found in response"

    data = json_response["data"]

    # Validate that data is a list (product listings)
    assert isinstance(data, list), f"Expected data to be a list but got {type(data)}"

    # For each product, validate expected keys exist (at minimum: id, name, published)
    for product in data:
        assert isinstance(product, dict), "Each product item should be a dict"
        assert "id" in product, "Product missing 'id' field"
        assert isinstance(product["id"], str), "'id' should be a string"
        assert "name" in product, "Product missing 'name' field"
        assert isinstance(product["name"], str), "'name' should be a string"
        assert "published" in product, "Product missing 'published' field"
        assert isinstance(product["published"], bool), "'published' should be a boolean"

    # Optionally assert at least one product is returned
    assert len(data) >= 0, "Product list is unexpected empty (allowed if no products)"

test_get_api_products_storefront_product_listing()