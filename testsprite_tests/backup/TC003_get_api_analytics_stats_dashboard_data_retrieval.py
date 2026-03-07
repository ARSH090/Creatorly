import requests

BASE_URL = "http://localhost:3000"
HEADERS = {
    "X-Test-Secret": "v3ry-s3cr3t-t3st-v4lu3"
}
TIMEOUT = 30

def test_get_api_analytics_stats_dashboard_data_retrieval():
    url = f"{BASE_URL}/api/creator/analytics/summary"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    json_response = None
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(json_response, dict), "Response JSON root is not a dictionary"
    assert "success" in json_response, "'success' key missing in response"
    assert json_response["success"] is True, "API did not return success=True"
    assert "data" in json_response, "'data' key missing in response"

    data = json_response["data"]
    expected_keys = {
        "totalRevenue",
        "totalSales",
        "totalLeads",
        "conversionRate",
        "storeViews",
        "period"
    }

    assert isinstance(data, dict), "'data' is not a dictionary"
    missing_keys = expected_keys - data.keys()
    assert not missing_keys, f"Missing expected keys in data: {missing_keys}"

    # Validate types as reasonable (can be adjusted if API spec given)
    assert isinstance(data["totalRevenue"], (int, float)), "totalRevenue should be a number"
    assert isinstance(data["totalSales"], int), "totalSales should be an integer"
    assert isinstance(data["totalLeads"], int), "totalLeads should be an integer"
    assert isinstance(data["conversionRate"], (int, float)), "conversionRate should be a number"
    assert isinstance(data["storeViews"], int), "storeViews should be an integer"
    assert isinstance(data["period"], str), "period should be a string"

test_get_api_analytics_stats_dashboard_data_retrieval()