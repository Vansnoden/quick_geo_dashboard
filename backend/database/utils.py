# -*- coding: utf-8 -*-
import datetime
from enum import Enum
from pprint import pprint
import re, os
import shutil
from typing import Dict, Set
import pandas as pd
import openpyxl , csv
import yaml
import json
from tqdm import tqdm
import traceback
import warnings
import uuid
import geopandas as gpd
from shapely.geometry import Point
import jsmin
from sqlalchemy.orm import Session
from . import models


DATE_FORMATS = [
    '%Y-%m-%d',      # 2025-03-06
    '%Y/%m/%d',      # 2025/03/06
    '%d-%m-%Y',      # 06-03-2025
    '%d/%m/%Y',      # 06/03/2025
    '%m-%d-%Y',      # 03-06-2025
    '%m/%d/%Y',      # 03/06/2025
    '%Y%m%d',        # 20250306
]


DATETIME_FORMATS = [
    '%Y-%m-%d %H:%M:%S',
    '%Y/%m/%d %H:%M:%S',
    '%Y-%m-%dT%H:%M:%S',
    '%Y-%m-%d %H:%M',
    '%Y/%m/%d %H:%M',
    '%d-%m-%Y %H:%M:%S',
    '%d/%m/%Y %H:%M:%S',
]


def try_parse_int(s: str) -> bool:
    try:
        int(s)
        return True
    except ValueError:
        return False


def try_parse_float(s: str) -> bool:
    try:
        float(s)
        return True
    except ValueError:
        return False


def try_parse_date(s: str) -> bool:
    for fmt in DATE_FORMATS:
        try:
            datetime.datetime.strptime(s, fmt)
            return True
        except ValueError:
            continue
    return False


def try_parse_datetime(s: str) -> bool:
    for fmt in DATETIME_FORMATS:
        try:
            datetime.datetime.strptime(s, fmt)
            return True
        except ValueError:
            continue
    return False


def possible_types(value: str) -> Set[str]:
    """
    Return a set of type names that this string can be parsed as.
    Always includes 'text' as a fallback.
    """
    types = set()
    if try_parse_int(value):
        types.add('int')
        types.add('float')   # int is also float
    if try_parse_float(value) and 'float' not in types:
        types.add('float')
    if try_parse_datetime(value):
        types.add('datetime')
        types.add('date')    # datetime implies date
    elif try_parse_date(value):
        types.add('date')
    types.add('text')        # always possible
    return types


# Hierarchy: most specific to least specific
TYPE_HIERARCHY = ['datetime', 'date', 'float', 'int', 'text']


def choose_best_type(possible: Set[str]) -> str:
    """Pick the most specific type from the set."""
    for t in TYPE_HIERARCHY:
        if t in possible:
            return t
    return 'text'  # fallback


def sql_type_from_python_type(py_type: str, dialect: str) -> str:
    """Map Python type name to SQL type string."""
    if py_type == 'int':
        return 'INTEGER'
    elif py_type == 'float':
        return 'FLOAT'
    elif py_type == 'date':
        # SQLite uses TEXT, PostgreSQL has DATE
        return 'DATE' if dialect == 'postgresql' else 'TEXT'
    elif py_type == 'datetime':
        return 'TIMESTAMP' if dialect == 'postgresql' else 'TEXT'
    else:  # 'text'
        return 'TEXT'


# ----------------------------------------------------------------------
# Helper to sanitize column names for use as parameter keys
# ----------------------------------------------------------------------
def sanitize_column_name(name: str) -> str:
    """Replace any character that is not alphanumeric or underscore with underscore."""
    return re.sub(r'\W+', '_', name)


def get_string_val(val):
    val = val.translate(str.maketrans({"'":  r"\'"}))
    if val:
        return val.strip() # removing begining and ending space
    else:
        return ""
    

def get_uuid():
    return uuid.uuid4()


def get_int_val(num:str):
    num = str(num).replace(",", "")
    num = num.split(".")[0]
    num = num.replace(" ", "")
    if num:
        return int(num)
    else:
        return 0
    

def get_float_val(num:str):
    num = str(num).replace("−", "-")
    num = num.replace(" ", "")
    if num:
        return float(num)
    else:
        return 0.0
    

def get_bool_val(val:str):
    if val:
        if val.strip().lower() == 'yes':
            return True
    return False


def datetime_from_month_year(month:str, year:str):
    y = get_int_val(year)
    m = get_int_val(month)
    fd = datetime.datetime.now()
    if y != 0 and m != 0:
        fd = datetime.datetime(year=get_int_val(year), month=get_int_val(month), day=1)
    return fd


def excel_to_csv(filepath, target) -> bool:
    try:
        warnings.simplefilter(action='ignore', category=UserWarning) # due to openpyxl
        wrkbk = openpyxl.load_workbook(filepath) 
        sh = wrkbk.active 
        col = csv.writer(open(target, 'w', newline=""), delimiter="|") 
        for row in tqdm(list(sh.iter_rows(min_row=2, min_col=1)), desc="Converting to CSV ... ", unit=" rows"): #max_row=500 
            col.writerow([cell.value for cell in row])
        return True
    except Exception as e:
        print("ERROR: ", traceback.format_exc())
        return False
    

def store_uploaded_file(upFileObj) -> str:
    """save uploaded file to upload directory and return path"""
    contents = upFileObj.file.read()
    fname = f"uploads/{upFileObj.filename.split('.')[0]}_{datetime.datetime.now()}.{upFileObj.filename.split('.')[1]}"
    with open(fname, "wb") as f:
        f.write(contents)
    return fname


def validate_columns_against_data(config: Dict, db: Session, dashboard_id: int) -> None:
    """
    Check that all column names in charts and map exist in the dashboard's data table.
    Raises ValueError if any column is missing.
    """
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard or not dashboard.data_table_name:
        # No data table yet – skip validation (or raise warning)
        return

    # Get actual column names from the data table (excluding 'id')
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    columns = [col['name'] for col in inspector.get_columns(dashboard.data_table_name) if col['name'] != 'id']

    errors = []

    # Check map columns
    map_config = config.get('map', {})
    if 'lat' in map_config and map_config['lat'] not in columns:
        errors.append(f"Map latitude column '{map_config['lat']}' not found in data")
    if 'lon' in map_config and map_config['lon'] not in columns:
        errors.append(f"Map longitude column '{map_config['lon']}' not found in data")

    # Check chart columns
    for idx, chart in enumerate(config.get('stats', [])):
        x_col = chart.get('x')
        if x_col and x_col not in columns:
            errors.append(f"Chart {idx} ('{chart.get('title','')}') x column '{x_col}' not found")
        y_def = chart.get('y', {})
        if isinstance(y_def, dict):
            y_col = y_def.get('column')
            if y_col and y_col not in columns:
                errors.append(f"Chart {idx} y column '{y_col}' not found")

    if errors:
        raise ValueError("Column validation failed:\n" + "\n".join(errors))


def yaml_to_dashboard_js(yaml_text: str) -> str:
    """
    Convert YAML dashboard configuration to a minified JavaScript module.
    Returns a string like 'export default {...};'
    Raises ValueError on parsing/validation errors.
    """
    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError as e:
        raise ValueError(f"YAML parsing error: {e}")

    if data is None:
        raise ValueError("YAML content is empty (maybe only whitespace)")

    if not isinstance(data, dict):
        raise ValueError("YAML root must be a mapping (dictionary)")

    if 'geo-dashboard' not in data:
        raise ValueError("Missing top-level key 'geo-dashboard'")

    config = data['geo-dashboard']
    if not isinstance(config, dict):
        raise ValueError("'geo-dashboard' must be a mapping")

    # Required keys
    required_keys = ['name', 'template', 'stats', 'map', 'menus']
    for key in required_keys:
        if key not in config:
            raise ValueError(f"Missing required key '{key}' in geo-dashboard")

    # stats must be a list
    if not isinstance(config['stats'], list):
        raise ValueError("'stats' must be a list of chart definitions")

    # Validate each chart (simplified)
    for idx, chart in enumerate(config['stats']):
        if not isinstance(chart, dict):
            raise ValueError(f"Chart at index {idx} is not an object")
        for field in ['type', 'title', 'x', 'y']:
            if field not in chart:
                raise ValueError(f"Chart {idx} missing '{field}'")
        # y can be dict or string; we accept both
        if not (isinstance(chart['y'], dict) or isinstance(chart['y'], str)):
            raise ValueError(f"Chart {idx} 'y' must be a mapping or string")

    # Map must have lat and lon
    if 'lat' not in config['map'] or 'lon' not in config['map']:
        raise ValueError("'map' section must contain 'lat' and 'lon' keys")

    # Menus must be a mapping
    if not isinstance(config['menus'], dict):
        raise ValueError("'menus' must be a mapping")

    # Convert to compact JSON and export as ES module
    json_str = json.dumps(config, separators=(',', ':'), ensure_ascii=False)
    js_code = f"export default {json_str};"
    return js_code