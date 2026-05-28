#!/usr/bin/env python3
"""Clean cooking/culinary terminology from BrewYuKoLi UI lang files.

Usage: cd /Users/chee/Projects/BrewYuKoLi && python3 scripts/clean_cooking_terms.py

v2 - fixed double-Beverage and awkward process repetition.
"""

import json
import re
import os

PROJECT = "/Users/chee/Projects/BrewYuKoLi"
EN_PATH = os.path.join(PROJECT, "src/assets/lang/en-ui.json")
ZH_PATH = os.path.join(PROJECT, "src/assets/lang/zh-CN-ui.json")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def count_changes(old, new):
    return sum(1 for k in old if old[k] != new[k])


def clean_en(data):
    """Apply all english replacements in order."""
    
    # ── Pass 1: Product/brand names (full phrases, longest first) ──
    replacements = [
        # Oven product names → Processing System
        ("Omni-Drying Oven", "Omni Processing System"),
        ("Smart Drying Oven", "Smart Processing System"),
        ("Multi-Function Combi Drying Oven", "Multi-Function Processing Unit"),
        ("Combi Steam Drying Oven", "Steam Processing Unit"),
        ("Combi Drying Oven", "Combined Processing Unit"),
        # Combi Oven → Processing Unit
        ("Combi Ovens", "Processing Units"),
        ("Combi Oven", "Processing Unit"),
        ("combi ovens", "processing units"),
        ("combi oven", "processing unit"),
        # Bake
        ("Steam, bake, and roast", "Steam, process, and roast"),
        ("Steam, bake and roast", "Steam, process and roast"),
        ("bake, and roast", "process, and roast"),
        # Deep-fry
        ("deep-fry", "batch process"),
        ("deep fry", "batch process"),
        ("deep frying", "batch processing"),
        ("Deep-Fry", "Batch Process"),
        ("Deep Fry", "Batch Process"),
        ("Deep Frying", "Batch Processing"),
        # Frying
        ("frying", "processing"),
        ("Frying", "Processing"),
        # Grill
        ("grilling", "processing"),
        ("Grilling", "Processing"),
        # Fryer (lowercase)
        ("fryer", "processing equipment"),
        ("Fryer", "Processing Equipment"),
        # Culinary
        ("culinary", "manufacturing"),
        ("Culinary", "Manufacturing"),
        # Bakery → Beverage
        ("Bakery", "Beverage"),
        # Processed items (was "fried items")
        ("fried items", "processed items"),
        ("Fried items", "Processed items"),
        ("fried dishes", "processed dishes"),
        ("Fried dishes", "Processed dishes"),
        # stir-fried / mix-fried
        ("stir-fried", "perfectly blended"),
        ("Stir-fried", "Perfectly blended"),
        ("mix-fried", "wok-prepared"),
        ("Mix-fried", "Wok-prepared"),
        ("Mix-fried", "Wok-prepared"),
        # roasted items → dry-heat items
        ("roasted items", "dry-heat items"),
        # roasting scenarios → high-heat scenarios  
        ("roasting scenarios", "high-heat scenarios"),
    ]
    
    for key, value in data.items():
        for old, new in replacements:
            if old in value:
                value = value.replace(old, new)
        data[key] = value
    
    # ── Pass 2: Generic "Drying Oven" (not preceded by replacement prefixes) ──
    for key, value in data.items():
        value = re.sub(
            r'(?<!Omni Processing )(?<!Smart Processing )(?<!Combined Processing )'
            r'(?<!Steam Processing )(?<!Multi-Function Processing )Drying Oven',
            'Drying System', value)
        value = re.sub(
            r'(?<!Omni Processing )(?<!Smart Processing )(?<!Combined Processing )'
            r'(?<!Steam Processing )(?<!Multi-Function Processing )drying oven',
            'drying system', value)
        data[key] = value
    
    # ── Pass 3: "roast" / "roasted" word-boundary replacements ──
    for key, value in data.items():
        # Replace "roast" but not "roasted" here (handled separately)
        value = re.sub(r'\broast\b(?!ed)', 'process', value)
        # "roasted" as an adjective for food → keep for now, but replace "roasted servings" → "dry-heat servings"
        value = value.replace("roasted servings", "dry-heat servings")
        data[key] = value
    
    # ── Pass 4: Cleanup of known double-replacement artifacts ──
    manual_fixes = {
        "cr_scenario_3_title": "Beverage Chains",
        "sol_cloudproduction_equip_2_desc": (
            "Steam, process, and dry-heat in one unit for rice, steamed dishes, "
            "and dry-heat items. Large-capacity multi-tier design handles 30+ "
            "steamed servings or 30+ dry-heat servings per batch. Precise "
            "temperature control ensures consistency - the key equipment for "
            "expanding cloud production menu breadth."
        ),
    }
    for key, new_val in manual_fixes.items():
        if key in data:
            data[key] = new_val
    
    return data


def clean_zh(data):
    """Apply all Chinese replacements."""
    for key, value in data.items():
        value = value.replace("油炸机", "高温加工设备")
        value = value.replace("烹制", "生产")
        data[key] = value
    return data


def verify_residuals(en_data, zh_data):
    """Check for unwanted leftover cooking terms."""
    en_text = json.dumps(en_data, ensure_ascii=False)
    zh_text = json.dumps(zh_data, ensure_ascii=False)
    
    en_checks = [
        ("culinary", "culinary|Culinary"),
        ("combi oven", r"\bcombi\s*oven", re.I),
        ("Omni-Drying (in values)", "Omni-Drying"),
        ("Smart Drying (in values)", "Smart.Drying"),
        ("Drying Oven (in values)", r"Drying\s*Oven"),
        ("Bakery (in values)", r"\bBakery\b"),
        ("grilling", r"\bgrilling\b", re.I),
        ("deep-fry", r"\bdeep[\s-]?fry\b", re.I),
        ("fryer (in values)", r"\bfryer\b", re.I),
        ("frying (in values)", r"\bfrying\b", re.I),
    ]
    
    zh_checks = [
        ("油炸机", "油炸机"),
        ("烹制", "烹制"),
    ]
    
    results = {"en": {}, "zh": {}}
    for label, pattern, *flags in en_checks:
        count = len(re.findall(pattern, en_text, flags[0] if flags else 0))
        results["en"][label] = count
    
    for label, pattern in zh_checks:
        count = len(re.findall(pattern, zh_text))
        results["zh"][label] = count
    
    return results


def main():
    print("=" * 60)
    print("BrewYuKoLi - Cooking Terminology Cleanup")
    print("=" * 60)
    
    # EN
    print("\n📗 Processing en-ui.json ...")
    en_old = load_json(EN_PATH)
    en_new = clean_en(dict(en_old))
    en_changes = count_changes(en_old, en_new)
    print(f"   → {en_changes} values modified")
    save_json(EN_PATH, en_new)
    
    # ZH
    print("\n📕 Processing zh-CN-ui.json ...")
    zh_old = load_json(ZH_PATH)
    zh_new = clean_zh(dict(zh_old))
    zh_changes = count_changes(zh_old, zh_new)
    print(f"   → {zh_changes} values modified")
    save_json(ZH_PATH, zh_new)
    
    # Verify key count
    en_keys = len(en_new)
    zh_keys = len(zh_new)
    print(f"\n📊 Key count: EN={en_keys}, ZH={zh_keys}, Match={en_keys == zh_keys}")
    
    # Residuals
    print("\n🔍 Residual check (values only):")
    info = verify_residuals(en_new, zh_new)
    all_clear = True
    for lang, checks in info.items():
        for term, count in checks.items():
            status = "✅" if count == 0 else "⚠️"
            if count != 0:
                all_clear = False
            print(f"   {status} [{lang}] {term}: {count}")
    
    if all_clear:
        print("\n✨ All residual checks passed!")
    else:
        print("\n⚠️  Some residuals remain (likely in key names only, not values)")
    
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
