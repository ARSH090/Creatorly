import requests

def test_get_orders_list_with_valid_authentication():
    base_url = "http://localhost:3000"
    endpoint = "/api/orders"
    url = base_url + endpoint
    headers = {
        "Authorization": "Bearer v3ry-s3cr3t-t3st-v4lu3",
        "x-test-secret": "f3b9e4a3d2c1b0a9f8e7d6c5b4a3f2e1"
    }
    timeout = 30

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_data = response.json()
        assert isinstance(json_data, dict), "Response JSON is not a dictionary"
        assert json_data.get("success") is True, "Response success flag is not True"
        orders = json_data.get("data")
        assert isinstance(orders, list), f"Expected data to be a list, got {type(orders)}"
        for order in orders:
            assert isinstance(order, dict), "Each order should be a dictionary"
            assert "orderId" in order, "orderId missing in order"
            assert "productId" in order, "productId missing in order"
            assert "status" in order, "status missing in order"
            # status could be 'completed' or other, just verify it's string
            assert isinstance(order["status"], str), "status should be a string"
            assert "downloadUrl" in order, "downloadUrl missing in order"
            assert isinstance(order["downloadUrl"], str), "downloadUrl should be a string"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_orders_list_with_valid_authentication()