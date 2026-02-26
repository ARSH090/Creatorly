import requests

BASE_URL = "http://localhost:3000"
HEADERS = {
    "X-Test-Secret": "v3ry-s3cr3t-t3st-v4lu3",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_post_api_checkout_product_purchase_flow():
    # Step 1: Get the list of products
    products_url = f"{BASE_URL}/api/products"
    try:
        products_response = requests.get(products_url, headers=HEADERS, timeout=TIMEOUT)
        assert products_response.status_code == 200, f"Expected 200 OK, got {products_response.status_code}"
        products = products_response.json()
        assert isinstance(products, list) and len(products) > 0, "Product list is empty or not a list"
    except Exception as e:
        raise AssertionError(f"Failed to get products: {e}")

    # Use the first product's ID for order creation
    product = products[0]
    product_id = product.get("id")
    assert product_id, "Product ID not found"

    # Prepare payload for checkout
    payload = {
        "productId": product_id,
        "buyerEmail": "buyer@example.com",  # simulate buyer input email on checkout
        "currency": "INR",
        "amount": 100  # Assuming amount in smallest currency unit (e.g. paise)
    }

    create_order_url = f"{BASE_URL}/api/checkout"

    try:
        # Step 2: POST to create order/checkout
        order_response = requests.post(create_order_url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert order_response.status_code == 200, f"Expected 200 OK, got {order_response.status_code}"
        order_json = order_response.json()
        assert order_json.get("success") is True, "Order response success flag is not True"
        order_data = order_json.get("data")
        assert order_data, "Order data missing in response"

        # Validate important Razorpay order fields presence
        razorpay_order_id = order_data.get("id")
        razorpay_amount = order_data.get("amount")
        razorpay_currency = order_data.get("currency")
        assert razorpay_order_id and isinstance(razorpay_order_id, str), "Invalid or missing razorpay order id"
        assert razorpay_amount == payload["amount"], "Razorpay order amount mismatch"
        assert razorpay_currency == payload["currency"], "Razorpay order currency mismatch"

    except Exception as e:
        raise AssertionError(f"Failed to create order via checkout API: {e}")


# Call the test function
test_post_api_checkout_product_purchase_flow()
