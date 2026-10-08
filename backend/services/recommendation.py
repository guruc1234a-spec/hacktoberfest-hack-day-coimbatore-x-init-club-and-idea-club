import json
import os
from typing import List, Dict, Optional
from schemas.contracts import ProductItem

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "products.json")

def load_products_catalog() -> List[ProductItem]:
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        return [ProductItem(**item) for item in data]

def get_product_by_id(product_id: str) -> Optional[ProductItem]:
    catalog = load_products_catalog()
    for p in catalog:
        if p.id == product_id:
            return p
    return None

def enrich_look_products(product_ids: List[str]) -> List[ProductItem]:
    catalog_map = {p.id: p for p in load_products_catalog()}
    enriched = []
    for pid in product_ids:
        if pid in catalog_map:
            enriched.append(catalog_map[pid])
        else:
            enriched.append(ProductItem(
                id=pid,
                name=f"Custom Formulation ({pid})",
                category="makeup",
                shade_family="custom",
                price=499.0,
                brand="GlamSync Local"
            ))
    return enriched
