# -*- coding: utf-8 -*-
import datetime
from enum import Enum
from pprint import pprint
import re, os
import shutil
from typing import Any, Dict, List, Optional, Set
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


def validate_filters(filters: List[Dict], context: str = ""):
    """Validate filter conditions"""
    valid_operators = ['=', '!=', '>', '>=', '<', '<=', 'like', 'in', 'between']
    
    for idx, f in enumerate(filters):
        if not isinstance(f, dict):
            raise ValueError(f"Filter at {context} index {idx} must be an object")
        
        if 'column' not in f:
            raise ValueError(f"Filter at {context} index {idx} missing 'column'")
        
        if 'operator' not in f:
            raise ValueError(f"Filter at {context} index {idx} missing 'operator'")
        
        if f['operator'] not in valid_operators:
            raise ValueError(f"Filter at {context} index {idx} has invalid operator '{f['operator']}'")
        
        if 'value' not in f and f['operator'] != 'between':
            raise ValueError(f"Filter at {context} index {idx} missing 'value'")
        
        # Additional validation for specific operators
        if f['operator'] == 'in' and not isinstance(f['value'], list):
            raise ValueError(f"Filter at {context} index {idx} 'in' operator requires array value")
        
        if f['operator'] == 'between' and (not isinstance(f['value'], list) or len(f['value']) != 2):
            raise ValueError(f"Filter at {context} index {idx} 'between' operator requires array of two values")


def validate_map_style(style: dict, context: str = "map style"):
    """Validate map style configuration"""
    if not isinstance(style, dict):
        raise ValueError(f"{context} must be an object")
    
    # Validate rules if present
    if 'rules' in style:
        if not isinstance(style['rules'], list):
            raise ValueError(f"{context}.rules must be a list")
        
        for idx, rule in enumerate(style['rules']):
            if not isinstance(rule, dict):
                raise ValueError(f"{context}.rules[{idx}] must be an object")
            
            # Required fields
            if 'field' not in rule:
                raise ValueError(f"{context}.rules[{idx}] missing 'field'")
            if 'value' not in rule:
                raise ValueError(f"{context}.rules[{idx}] missing 'value'")
            if 'color' not in rule:
                raise ValueError(f"{context}.rules[{idx}] missing 'color'")
            
            # Validate operator if present
            valid_operators = ['=', '!=', 'like', 'in']
            if 'operator' in rule and rule['operator'] not in valid_operators:
                raise ValueError(
                    f"{context}.rules[{idx}] invalid operator '{rule['operator']}'. "
                    f"Valid: {', '.join(valid_operators)}"
                )
            
            # Validate color format (basic hex check)
            if not re.match(r'^#[0-9A-Fa-f]{6}$', rule['color']):
                raise ValueError(f"{context}.rules[{idx}] color '{rule['color']}' must be hex format (e.g., #ff0000)")
    
    # Validate size bounds
    if 'minSize' in style and 'maxSize' in style:
        if style['minSize'] >= style['maxSize']:
            raise ValueError(f"{context}.minSize must be less than maxSize")
    
    # Validate legend position
    valid_positions = ['topleft', 'topright', 'bottomleft', 'bottomright']
    if 'legend' in style and 'position' in style['legend']:
        if style['legend']['position'] not in valid_positions:
            raise ValueError(
                f"{context}.legend.position invalid. "
                f"Valid: {', '.join(valid_positions)}"
            )


def validate_filters_section(config: dict) -> None:
    """Validate all filter sections in the config"""
    # Global filters
    if 'filters' in config:
        validate_filters(config['filters'], "global filters")
    
    # Chart filters
    for idx, chart in enumerate(config.get('stats', [])):
        if 'filters' in chart:
            validate_filters(chart['filters'], f"chart '{chart.get('title', idx)}'")
    
    # Map filters and style
    if 'map' in config:
        if 'filters' in config['map']:
            validate_filters(config['map']['filters'], "map filters")
        if 'style' in config['map']:
            validate_map_style(config['map']['style'], "map style")


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
        
    validate_filters_section(config)

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



def build_where_clause(
    filters: Optional[List],  # Can be List[Dict] or List[FilterCondition]
    table_name: str,
    param_prefix: str = "f"
) -> tuple[str, Dict[str, Any]]:
    """
    Convert filter conditions to SQL WHERE clause and parameters.
    Returns (where_clause, params_dict)
    """
    if not filters:
        return "", {}
    
    conditions = []
    params = {}
    
    for idx, f in enumerate(filters):
        # Handle both dict and object access
        if isinstance(f, dict):
            col = f['column']
            op = f['operator']
            value = f['value']
        else:
            # Assume it's a FilterCondition object
            col = f.column
            op = f.operator
            value = f.value
        
        col_quoted = f'"{col}"'
        param_name = f"{param_prefix}_{idx}"
        
        if op == '=':
            conditions.append(f"{col_quoted} = :{param_name}")
            params[param_name] = value
        elif op == '!=':
            conditions.append(f"{col_quoted} != :{param_name}")
            params[param_name] = value
        elif op == '>':
            conditions.append(f"{col_quoted} > :{param_name}")
            params[param_name] = value
        elif op == '>=':
            conditions.append(f"{col_quoted} >= :{param_name}")
            params[param_name] = value
        elif op == '<':
            conditions.append(f"{col_quoted} < :{param_name}")
            params[param_name] = value
        elif op == '<=':
            conditions.append(f"{col_quoted} <= :{param_name}")
            params[param_name] = value
        elif op == 'like':
            conditions.append(f"{col_quoted} LIKE :{param_name}")
            params[param_name] = value
        elif op == 'in':
            if not isinstance(value, list):
                value = [value]
            placeholders = [f":{param_name}_{i}" for i in range(len(value))]
            conditions.append(f"{col_quoted} IN ({', '.join(placeholders)})")
            for i, v in enumerate(value):
                params[f"{param_name}_{i}"] = v
        elif op == 'between':
            if len(value) != 2:
                raise ValueError("BETWEEN operator requires two values")
            conditions.append(f"{col_quoted} BETWEEN :{param_name}_1 AND :{param_name}_2")
            params[f"{param_name}_1"] = value[0]
            params[f"{param_name}_2"] = value[1]
    
    where_clause = " AND ".join(conditions)
    return where_clause, params


def merge_filters(global_filters: Optional[List], specific_filters: Optional[List]) -> List[Dict]:
    """Merge global and specific filters (AND combination) and return as dicts"""
    result = []
    
    # Helper to convert to dict if needed
    def to_dict(f):
        if hasattr(f, 'dict'):
            return f.dict()
        return f
    
    if global_filters:
        result.extend([to_dict(f) for f in global_filters])
    if specific_filters:
        result.extend([to_dict(f) for f in specific_filters])
    
    return result