import importlib


def test_no_content_routes_import_without_assertion():
    importlib.import_module("app.api.customer_router")
    importlib.import_module("app.api.product_router")
    importlib.import_module("app.api.quotation_router")
