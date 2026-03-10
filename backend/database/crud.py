import json
import os
import shutil
from typing import Dict, List, Optional
from sqlalchemy import String, and_, cast, desc, or_, text
from sqlalchemy.orm import Session, joinedload

from database.utils import choose_best_type, get_bool_val, get_float_val, get_int_val, get_uuid, possible_types, sanitize_column_name, sql_type_from_python_type
from . import models, schemas
from passlib.context import CryptContext
from pathlib import Path
import datetime
from enum import Enum
from pprint import pprint
import re, os
import shutil
import pandas as pd
import openpyxl , csv

from tqdm import tqdm
import traceback
import warnings
import uuid
import geopandas as gpd
from shapely.geometry import Point
from geoalchemy2 import Geometry
import logging
from slugify import slugify



logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

DELIMITER = ","


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 0):
    if skip and limit:
        return db.query(models.User).offset(skip).limit(limit).all()
    else:
        return db.query(models.User).all()


def create_user(db: Session, user: schemas.UserCreate):
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    db_user = models.User(
        username=user.username,
        email=user.email, 
        fullname=user.fullname,
        is_active=True,
        hashed_password=pwd_context.hash(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    res = db.query(models.User).filter(models.User.id == user_id).delete()
    db.commit()
    return res


# dashboards

def get_dashboards(db: Session, user_id: int, skip: int = 0, limit: int = 10, query: str = None):
    db_query = db.query(models.Dashboard).filter(models.Dashboard.user_id == user_id)
    if query:
        search = f"%{query}%"
        db_query = db_query.filter(
            or_(
                models.Dashboard.name.ilike(search),
                cast(models.Dashboard.code, String).ilike(search)
            )
        )
    db_query = db_query.order_by(desc(models.Dashboard.create_date))
    
    if skip and limit:
        return db_query.offset(skip).limit(limit).all()
    else:
        return db_query
    

def get_dashboard_count(db: Session, user_id: int, query: str = None):
    db_query = db.query(models.Dashboard).filter(models.Dashboard.user_id == user_id)
    if query:
        search = f"%{query}%"
        db_query = db_query.filter(
            or_(
                models.Dashboard.name.ilike(search),
                cast(models.Dashboard.code, String).ilike(search)
            )
        )    
    return db_query.count()
    


def get_dashboard(db: Session, dashboard_id: int):
    """
    Retrieve a dashboard by its primary key ID.
    Returns the Dashboard ORM object or None if not found.
    """
    return db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()


def get_user_dashboard(db: Session, dashboard_id: int, user_id: int):
    """
    Retrieve a dashboard by its primary key ID.
    Returns the Dashboard ORM object or None if not found.
    """
    return db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id,
        models.Dashboard.user_id == user_id
    ).first()


def create_dashboard(db: Session, user: schemas.User, 
                     dashboard: schemas.DashboardCreate) -> schemas.Dashboard:
    db_dashboard =  models.Dashboard(
        name=slugify(dashboard.name).lower(),
        user_id=user.id,
        code = get_uuid(),
        data_table_name = "",
        ui_yaml_script = "",
        ui_js_script = "",
        create_date=datetime.datetime.now(),
        last_update_date=datetime.datetime.now()
    )
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard


def edit_dashboard(db: Session, dashboard_id: int, dashboard_update: schemas.DashboardCreate) -> models.Dashboard:
    
    db_dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not db_dashboard:
        return None 
    db_dashboard.name = dashboard_update.name
    db_dashboard.last_update_date = datetime.datetime.now()
    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard


def delete_dashboard(db: Session, dashboard_id: int) -> bool:
    db_dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not db_dashboard:
        return False
    db.delete(db_dashboard)
    db.commit()
    return True


def upload_data_from_file(
    filepath: str,
    dashboard_id: int,
    db: Session,
    sample_size: int = 2000,
    batch_size: int = 2000,
    inference_method: str = 'sample',  # 'sample' or 'full_scan'
    column_type_overrides: Optional[Dict[str, str]] = None,
) -> bool:
    try:
        # 1. Get dashboard and build table name
        dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
        if not dashboard:
            logger.error(f"Dashboard with id {dashboard_id} not found")
            return False

        code_str = str(dashboard.code).replace('-', '_')
        table_name = f"dash_{code_str}_data"
        dialect = db.bind.dialect.name

        # 2. Prepare column type overrides
        overrides = column_type_overrides or {}

        # ------------------------------------------------------------------
        # Step A: Determine column names and their SQL types
        # ------------------------------------------------------------------
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                logger.error("CSV file has no columns")
                return False
            original_fieldnames = reader.fieldnames

            # Sanitize column names for parameter keys
            # Create a mapping: original_name -> sanitized_key
            sanitized_map = {orig: sanitize_column_name(orig) for orig in original_fieldnames}
            # Also create reverse mapping (not strictly needed but useful)
            reverse_map = {v: k for k, v in sanitized_map.items()}

            # Columns that need inference (those not in overrides)
            cols_to_infer = [col for col in original_fieldnames if col not in overrides]

            # Determine SQL types
            if not cols_to_infer:
                col_sql_types = {col: overrides[col] for col in original_fieldnames}
            else:
                if inference_method == 'sample':
                    # ---------- Sample-based inference ----------
                    sample_rows = []
                    for i, row in enumerate(reader):
                        sample_rows.append(row)
                        if i >= sample_size - 1:
                            break

                    col_possible = {col: set(['int', 'float', 'date', 'datetime', 'text']) for col in cols_to_infer}
                    for row in sample_rows:
                        for col in cols_to_infer:
                            val = row.get(col, '')
                            if val == '' or val is None:
                                continue
                            val_types = possible_types(val)
                            col_possible[col] &= val_types

                    inferred = {}
                    for col in cols_to_infer:
                        best = choose_best_type(col_possible[col])
                        inferred[col] = sql_type_from_python_type(best, dialect)

                    col_sql_types = {**inferred, **overrides}

                else:  # full_scan
                    col_possible = {col: set(['int', 'float', 'date', 'datetime', 'text']) for col in cols_to_infer}
                    for row in reader:
                        for col in cols_to_infer:
                            val = row.get(col, '')
                            if val == '' or val is None:
                                continue
                            val_types = possible_types(val)
                            col_possible[col] &= val_types

                    inferred = {}
                    for col in cols_to_infer:
                        best = choose_best_type(col_possible[col])
                        inferred[col] = sql_type_from_python_type(best, dialect)

                    col_sql_types = {**inferred, **overrides}

        # ------------------------------------------------------------------
        # Step B: Create the table
        # ------------------------------------------------------------------
        if dialect == 'postgresql':
            pk_def = "id SERIAL PRIMARY KEY"
        else:
            pk_def = "id INTEGER PRIMARY KEY AUTOINCREMENT"

        columns = [pk_def]
        for col in original_fieldnames:
            sql_type = col_sql_types[col]
            # Quote the original column name (may contain spaces)
            columns.append(f'"{col}" {sql_type}')

        create_sql = f"CREATE TABLE {table_name} ({', '.join(columns)})"
        db.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
        db.execute(text(create_sql))

        # ------------------------------------------------------------------
        # Step C: Insert data in batches
        # ------------------------------------------------------------------
        # Build INSERT statement using sanitized placeholder names
        cols = original_fieldnames
        # Placeholder names are the sanitized keys
        placeholders = {orig: f':{sanitized_map[orig]}' for orig in cols}
        insert_sql = f"INSERT INTO {table_name} ({', '.join(f'"{c}"' for c in cols)}) VALUES ({', '.join(placeholders.values())})"

        def insert_batch(batch: List[Dict]):
            if batch:
                # Convert batch to use sanitized keys
                sanitized_batch = []
                for row in batch:
                    sanitized_row = {sanitized_map[orig]: row.get(orig, '') for orig in cols}
                    sanitized_batch.append(sanitized_row)
                db.execute(text(insert_sql), sanitized_batch)

        # Reopen file for insertion
        with open(filepath, 'r', encoding='utf-8') as f:
            insert_reader = csv.DictReader(f)
            # If we used sample method and have sample rows, we need to skip them
            if inference_method == 'sample' and 'sample_rows' in locals() and sample_rows:
                # Insert the sample rows first
                sample_batch = sample_rows
                insert_batch(sample_batch)
                # Skip the sample rows in the reader
                for _ in range(len(sample_rows)):
                    next(insert_reader, None)

            batch = []
            for row in insert_reader:
                batch.append(row)
                if len(batch) >= batch_size:
                    insert_batch(batch)
                    batch = []
            if batch:
                insert_batch(batch)

        # ------------------------------------------------------------------
        # Step D: Update dashboard record
        # ------------------------------------------------------------------
        dashboard.data_table_name = table_name
        db.add(dashboard)
        db.commit()

        logger.info(f"Successfully uploaded data to table {table_name} for dashboard {dashboard_id}")
        return True

    except Exception as e:
        logger.error(f"Error uploading data for dashboard {dashboard_id}: {traceback.format_exc()}")
        return False