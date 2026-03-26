# -*- coding: utf-8 -*-

from datetime import timedelta, timezone, datetime
import math
import os, json, time
from pathlib import Path
import traceback
from typing import Annotated, Any, Dict, List, Optional
import uuid
from fastapi import Depends, FastAPI, Form, HTTPException, Response, status, File, UploadFile, Body
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, BeforeValidator
import yaml
from database.utils import build_where_clause, excel_to_csv, get_uuid, merge_filters, yaml_to_dashboard_js
from database.schemas import ChartDataRequest, ChartDataResponse, DashboardConfigUpdate, User, FileBase
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from database import crud, models, schemas
from database.session import SessionLocal, engine
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from slugify import slugify
import logging
import sys
import random
from random import randrange
from sqlalchemy.sql import text
import numpy as np
from numpy.linalg import norm
import ast
from fastapi.responses import StreamingResponse
from pydantic.json_schema import SkipJsonSchema



logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)
if sys.version_info[0] >= 3:
    unicode = str


SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 3600 * 24
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

ITEMS_PER_PAGE = 10

app = FastAPI(root_path="/qgd_api")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://quick-dashboard.voidmonad.com",
    "https://quick-dashboard.voidmonad.com/api",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserInDB(User):
    hashed_password: str


class TokenData(BaseModel):
    username: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def authenticate_user(db, username: str, password: str):
    user = crud.get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def validate_user(user: User):
    if user.username and user.email and user.password:
        return True
    else:
        return False


# users
@app.post("/users", response_model=schemas.User, include_in_schema=True)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    if validate_user(user):
        return crud.create_user(db=db, user=user)


@app.get("/users/", response_model=list[schemas.User], include_in_schema=True)
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@app.get("/users/{user_id}", response_model=schemas.User,include_in_schema=True)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.post("/token",include_in_schema=True)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)
) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@app.get("/users/details/me", include_in_schema=True)
async def read_users_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user


@app.post("/users/delete/{user_id}", include_in_schema=True)
async def delete_user(user: Annotated[User, Depends(get_current_active_user)], db: Session = Depends(get_db)):
    if user:
        response = crud.delete_user(db, user_id=user.id)
        if response is None:
            raise HTTPException(status_code=404, detail="User not found")
        return response
    else:
        raise HTTPException(status_code=403, detail="Unauthorized action")


# dashboards

@app.get("/dashboards/", response_model=schemas.DashboardPagination)
def read_dashboards(
    user: User = Depends(get_current_active_user),
    query: Optional[str] = None,
    skip: int = 0, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    # 1. Get the paginated slice
    dashboards = crud.get_dashboards(db, user.id, skip=skip, limit=limit, query=query)
    
    # 2. Get the total count (Use a count query for better performance)
    total_count = crud.get_dashboard_count(db, user.id, query=query) 
    
    # 3. Calculate total pages
    total_pages = math.ceil(total_count / limit) if limit > 0 else 1

    return {
        "data": dashboards,
        "total_count": total_count,
        "total_pages": total_pages
    }


@app.post("/dashboards/add", response_model=schemas.Dashboard, include_in_schema=True)
def create_dashboard(
    user: Annotated[User, Depends(get_current_active_user)],
    dashboard: schemas.DashboardCreateRequest, 
    db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    dashboard_create = schemas.DashboardCreate(user_id=user.id, name=dashboard.name)
    return crud.create_dashboard(db, user, dashboard_create)


@app.get("/dashboards/{dashboard_id}", response_model=schemas.Dashboard, include_in_schema=True)
def get_dashboard(
    dashboard_id: int,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)):
    if user:
        dashboard = crud.get_user_dashboard(db, dashboard_id, user.id)
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        else:
            return dashboard
    else:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    

@app.post("/dashboards/{dashboard_id}/edit", response_model=schemas.Dashboard, include_in_schema=True)
def edit_dashboard(
    dashboard_id: int,
    dashboard_update: schemas.DashboardCreate,
    user: Annotated[User, Depends(get_current_active_user)],
    dashboard: schemas.Dashboard, 
    db: Session = Depends(get_db)):
    updated = crud.edit_dashboard(db, dashboard_id, dashboard_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return updated


@app.post("/dashboards/{dashboard_id}/delete")
def delete_dashboard(
    dashboard_id: int, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    success = crud.delete_dashboard(db, dashboard_id, user.id)
    
    if not success:
        raise HTTPException(
            status_code=404, 
            detail="Dashboard not found or you do not have permission to delete it"
        )
        
    return {
            "success": True,
            "message": "Successfully deleted dashboard"
        }


def empty_str_to_none(v: Any) -> Any:
    if v == "":
        return None
    return v


@app.post(
    "/dashboards/{dashboard_id}/add_data",
    response_model=schemas.Dashboard,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=True
)
async def add_dashboard_data(
    dashboard_id: int,
    files: List[UploadFile] = File(...),
    column_type_overrides: Annotated[Optional[str], Form()] = None,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not user:
        raise HTTPException(status_code=403, detail="Unauthorized access")

    # 1. Validate at least one file
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # 2. Parse JSON overrides if provided
    overrides = None
    if column_type_overrides:
        try:
            overrides = json.loads(column_type_overrides)
            if not isinstance(overrides, dict):
                raise ValueError("overrides must be a JSON object")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid column_type_overrides JSON: {e}")

    # 3. Process each file
    uploaded_filenames = []
    for file in files:
        try:
            # Safely get extension
            orig_filename = file.filename or "upload"
            ext = os.path.splitext(orig_filename)[1].lower().lstrip('.')
            if not ext:
                ext = "csv"

            unique_id = uuid.uuid4().hex
            temp_filename = os.path.join(ROOT_DIR, "uploads", f"{unique_id}.{ext}")

            # Write file in chunks (binary)
            with open(temp_filename, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):  # 1 MB chunks
                    buffer.write(chunk)

            csv_path = temp_filename
            # Convert Excel to CSV if needed
            if ext in ("xlsx", "xls"):
                csv_path = os.path.join(ROOT_DIR, "temp", f"{unique_id}.csv")
                excel_to_csv(temp_filename, target=csv_path)
                # Optionally remove original Excel file after conversion
                # os.remove(temp_filename)

            # 4. Call the CRUD function
            logger.info(f"Uploading {orig_filename} to dashboard {dashboard_id}")
            success = crud.upload_data_from_file(
                filepath=csv_path,
                dashboard_id=dashboard_id,
                db=db,
                inference_method='full_scan',
                column_type_overrides=overrides,
            )

            if not success:
                raise Exception("upload_data_from_file returned False (check logs)")

            uploaded_filenames.append(orig_filename)

        except Exception as e:
            logger.error(f"Error processing {file.filename}: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"File {file.filename} failed: {str(e)}"
            )
        finally:
            await file.close()

    # 5. Retrieve and return the updated dashboard
    dashboard = crud.get_dashboard(db, dashboard_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard


@app.put("/dashboards/{dashboard_id}/config", response_model=schemas.Dashboard)
def update_dashboard_config(
    dashboard_id: int,
    config_update: DashboardConfigUpdate,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    dashboard = crud.get_dashboard(db, dashboard_id)
    if not dashboard:
        raise HTTPException(404, "Dashboard not found")
    if dashboard.user_id != user.id:
        raise HTTPException(403, "Not authorized to modify this dashboard")

    # Convert YAML to JS (with optional column validation)
    try:
        # Optional: validate columns if data exists
        # validate_columns_against_data(yaml_data, db, dashboard_id)
        js_code = yaml_to_dashboard_js(config_update.yaml_content)
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    # Update dashboard
    dashboard.ui_yaml_script = config_update.yaml_content
    dashboard.ui_js_script = js_code
    dashboard.last_update_date = datetime.now()
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    return dashboard


@app.get("/dashboards/{dashboard_id}/config", response_model=Dict)
def get_dashboard_config(
    dashboard_id: int,
    db: Session = Depends(get_db)
):
    dashboard = crud.get_dashboard(db, dashboard_id)
    if not dashboard or not dashboard.ui_yaml_script:
        raise HTTPException(404, "Dashboard config not found")
    # Optionally parse YAML to JSON and return
    config = yaml.safe_load(dashboard.ui_yaml_script)
    return config.get('geo-dashboard', {})


@app.get("/dashboards/{dashboard_id}/points")
def get_map_points(
    dashboard_id: int,
    db: Session = Depends(get_db),
):
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Parse YAML for map config
    import yaml
    config = yaml.safe_load(dashboard.ui_yaml_script)
    geo_config = config.get('geo-dashboard', {})
    global_filters = geo_config.get('filters', [])
    map_config = geo_config.get('map', {})
    map_filters = map_config.get('filters', [])
    
    # Merge all filters
    all_filters = merge_filters(global_filters, map_filters)
    
    # Get lat/lon columns
    lat_col = map_config.get('lat')
    lon_col = map_config.get('lon')
    
    if not lat_col or not lon_col:
        raise HTTPException(status_code=400, detail="Missing lat/lon in map config")
    
    # Get all columns for richer popup data
    # First, get all column names from the table
    inspector = inspect(db.bind)
    columns = [col['name'] for col in inspector.get_columns(dashboard.data_table_name)]
    
    # Build query to select all columns
    quoted_columns = [f'"{col}"' for col in columns]
    select_clause = ", ".join(quoted_columns)
    
    table = dashboard.data_table_name
    where_clause, params = build_where_clause(all_filters, table)
    
    query = f"SELECT {select_clause} FROM {table}"
    if where_clause:
        query += f" WHERE {where_clause}"
    
    result = db.execute(text(query), params).fetchall()
    
    # Build GeoJSON with all properties
    features = []
    for row in result:
        # Convert row to dict
        row_dict = dict(row._mapping)
        
        try:
            lat = float(row_dict[lat_col])
            lon = float(row_dict[lon_col])
            
            # Include all columns as properties (except lat/lon to avoid duplication)
            properties = {
                k: v for k, v in row_dict.items() 
                if k not in [lat_col, lon_col]
            }
            
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point", 
                    "coordinates": [lon, lat]
                },
                "properties": properties
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return {
        "type": "FeatureCollection",
        "features": features
    }



@app.post("/dashboards/{dashboard_id}/points-in-view")
def get_points_in_view(
    dashboard_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Get points within a bounding box with limit"""
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    bbox = request.get('bbox')  # [minLon, minLat, maxLon, maxLat]
    limit = request.get('limit', 10000)
    filters = request.get('filters', [])
    
    if not bbox or len(bbox) != 4:
        raise HTTPException(status_code=400, detail="Invalid bbox")
    
    min_lon, min_lat, max_lon, max_lat = bbox
    
    # Parse YAML for map config
    import yaml
    config = yaml.safe_load(dashboard.ui_yaml_script)
    geo_config = config.get('geo-dashboard', {})
    global_filters = geo_config.get('filters', [])
    map_config = geo_config.get('map', {})
    map_filters = map_config.get('filters', [])
    
    # Merge all filters
    all_filters = merge_filters(global_filters, filters)
    all_filters = merge_filters(all_filters, map_filters)
    
    # Get lat/lon columns
    lat_col = map_config.get('lat')
    lon_col = map_config.get('lon')
    
    if not lat_col or not lon_col:
        raise HTTPException(status_code=400, detail="Missing lat/lon in map config")
    
    # Build query with bbox filter
    table = dashboard.data_table_name
    where_clause, params = build_where_clause(all_filters, table)
    
    bbox_filter = f'"{lon_col}" BETWEEN :min_lon AND :max_lon AND "{lat_col}" BETWEEN :min_lat AND :max_lat'
    
    if where_clause:
        where_clause = f"({where_clause}) AND {bbox_filter}"
    else:
        where_clause = bbox_filter
    
    params.update({
        'min_lon': min_lon,
        'max_lon': max_lon,
        'min_lat': min_lat,
        'max_lat': max_lat
    })
    
    # Get all columns
    inspector = inspect(db.bind)
    columns = [col['name'] for col in inspector.get_columns(dashboard.data_table_name)]
    quoted_columns = [f'"{col}"' for col in columns]
    select_clause = ", ".join(quoted_columns)
    
    query = f"""
        SELECT {select_clause} 
        FROM {table} 
        WHERE {where_clause}
        LIMIT {limit}
    """
    
    result = db.execute(text(query), params).fetchall()
    
    # Build GeoJSON
    features = []
    for row in result:
        row_dict = dict(row._mapping)
        
        try:
            lat = float(row_dict[lat_col])
            lon = float(row_dict[lon_col])
            
            properties = {
                k: v for k, v in row_dict.items() 
                if k not in [lat_col, lon_col]
            }
            
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point", 
                    "coordinates": [lon, lat]
                },
                "properties": properties
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return {
        "type": "FeatureCollection",
        "features": features
    }


@app.post("/dashboards/{dashboard_id}/chart-data", response_model=ChartDataResponse)
def get_chart_data(
    dashboard_id: int,
    request: ChartDataRequest,
    db: Session = Depends(get_db),
    top_n: Optional[int] = 10,
):
    # 1. Fetch dashboard and config
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Parse YAML to get global filters
    import yaml
    config = yaml.safe_load(dashboard.ui_yaml_script)
    geo_config = config.get('geo-dashboard', {})
    global_filters = geo_config.get('filters', [])
    
    # Merge filters: global + chart-specific
    all_filters = merge_filters(global_filters, request.filters)
    
    # Build WHERE clause
    filter_dicts = [f.dict() if hasattr(f, 'dict') else f for f in all_filters]
    where_clause, params = build_where_clause(filter_dicts, dashboard.data_table_name)
    
    # 2. Parse the y definition and build SQL
    if isinstance(request.y, str):
        agg_func = "COUNT(*)"
    else:
        y_def = request.y
        agg = y_def.aggregation or "sum"
        y_col = f'"{y_def.column}"'

        if agg == "count distinct":
            agg_func = f"COUNT(DISTINCT {y_col})"
        else:
            agg_map = {"sum": "SUM", "avg": "AVG", "count": "COUNT", "min": "MIN", "max": "MAX"}
            sql_agg = agg_map.get(agg, "SUM")
            agg_func = f"{sql_agg}({y_col})"
    
    # 3. Build query with WHERE clause if present
    x_col = f'"{request.x}"'
    table = dashboard.data_table_name
    
    query = f"""
        SELECT {x_col} as label, {agg_func} as value
        FROM {table}
    """
    
    if where_clause:
        query += f" WHERE {where_clause}"
    
    query += f" GROUP BY {x_col} ORDER BY label"
    
    # Execute with parameters
    result = db.execute(text(query), params).fetchall()
    
    # Extract labels and values
    labels = [str(row.label) for row in result]
    values = [float(row.value) if row.value is not None else 0.0 for row in result]

    # Apply top N charts if requested
    if  top_n and len(labels) > top_n:
        # Pair labels and values
        paired = list(zip(labels, values))
        # Sort by value descending
        paired.sort(key=lambda x: x[1], reverse=True)
        
        # Take top N
        top_labels = []
        top_values = []
        others_sum = 0
        
        for i, (label, value) in enumerate(paired):
            if i < top_n:
                top_labels.append(label)
                top_values.append(value)
            else:
                others_sum += value
        
        # Add "Others" category if there are remaining items
        if others_sum > 0:
            top_labels.append("Others")
            top_values.append(others_sum)
        
        labels = top_labels
        values = top_values
    
    return ChartDataResponse(labels=labels, data=values)



@app.post("/dashboards/{dashboard_id}/distinct-values")
def get_distinct_values(
    dashboard_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Get distinct values for a column (used for stack categories)"""
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    column = request.get('column')
    if not column:
        raise HTTPException(status_code=400, detail="Column name required")
    
    # Parse YAML to get global filters
    import yaml
    config = yaml.safe_load(dashboard.ui_yaml_script)
    global_filters = config.get('geo-dashboard', {}).get('filters', [])
    
    # Merge filters: global + request-specific
    request_filters = request.get('filters', [])
    all_filters = merge_filters(global_filters, request_filters)
    
    # Build WHERE clause
    filter_dicts = [f.dict() if hasattr(f, 'dict') else f for f in all_filters]
    where_clause, params = build_where_clause(filter_dicts, dashboard.data_table_name)
    
    table = dashboard.data_table_name
    col_quoted = f'"{column}"'
    
    query = f"SELECT DISTINCT {col_quoted} as value FROM {table}"
    if where_clause:
        query += f" WHERE {where_clause}"
    query += f" ORDER BY value"
    
    result = db.execute(text(query), params).fetchall()
    
    # Return list of distinct values (filtering out None)
    return [row.value for row in result if row.value is not None]



@app.get("/dashboards/{dashboard_id}/dashboard.js")
def get_dashboard_js(
    dashboard_id: int,
    db: Session = Depends(get_db)
):
    dashboard = crud.get_dashboard(db, dashboard_id)
    if not dashboard or not dashboard.ui_js_script:
        raise HTTPException(404, "Dashboard JS not found")
    if not dashboard.ui_js_script:
        raise HTTPException(status_code=404, detail="Dashboard JS not generated yet")
    return Response(
        content=dashboard.ui_js_script, 
        media_type="application/javascript"
    )


@app.post("/dashboards/{dashboard_id}/filtered-points")
def get_filtered_map_points(
    dashboard_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Get map points filtered by provided filters (combines with static map filters)."""
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Parse YAML for map config
    import yaml
    config = yaml.safe_load(dashboard.ui_yaml_script)
    geo_config = config.get('geo-dashboard', {})
    global_filters = geo_config.get('filters', [])
    map_config = geo_config.get('map', {})
    map_filters = map_config.get('filters', [])
    
    # Request filters
    request_filters = request.get('filters', [])
    
    # Merge all
    all_filters = merge_filters(global_filters, map_filters)
    all_filters = merge_filters(all_filters, request_filters)
    
    lat_col = map_config.get('lat')
    lon_col = map_config.get('lon')
    if not lat_col or not lon_col:
        raise HTTPException(status_code=400, detail="Missing lat/lon in map config")
    
    table = dashboard.data_table_name
    where_clause, params = build_where_clause(all_filters, table)
    
    # Get all columns for popups
    inspector = inspect(db.bind)
    columns = [col['name'] for col in inspector.get_columns(table)]
    quoted_columns = [f'"{col}"' for col in columns]
    select_clause = ", ".join(quoted_columns)
    
    query = f"SELECT {select_clause} FROM {table}"
    if where_clause:
        query += f" WHERE {where_clause}"
    
    result = db.execute(text(query), params).fetchall()
    
    features = []
    for row in result:
        row_dict = dict(row._mapping)
        try:
            lat = float(row_dict[lat_col])
            lon = float(row_dict[lon_col])
            properties = {k: v for k, v in row_dict.items() if k not in [lat_col, lon_col]}
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": properties
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return {"type": "FeatureCollection", "features": features}


@app.post("/dashboards/{dashboard_id}/range-bounds")
def get_range_bounds(
    dashboard_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Get min and max values for a column (numeric or date)"""
    dashboard = db.query(models.Dashboard).filter(models.Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    column = request.get('column')
    if not column:
        raise HTTPException(status_code=400, detail="Column name required")
    
    # Parse YAML for global filters (optional)
    config = yaml.safe_load(dashboard.ui_yaml_script) if dashboard.ui_yaml_script else {}
    global_filters = config.get('geo-dashboard', {}).get('filters', [])
    request_filters = request.get('filters', [])
    all_filters = merge_filters(global_filters, request_filters)
    
    where_clause, params = build_where_clause(all_filters, dashboard.data_table_name)
    
    table = dashboard.data_table_name
    col_quoted = f'"{column}"'
    
    # Use MIN/MAX aggregation
    query = f"SELECT MIN({col_quoted}) as min_val, MAX({col_quoted}) as max_val FROM {table}"
    if where_clause:
        query += f" WHERE {where_clause}"
    
    result = db.execute(text(query), params).fetchone()
    
    min_val = result.min_val
    max_val = result.max_val
    
    # Convert to appropriate types
    if min_val is None or max_val is None:
        min_val = 0
        max_val = 0
    
    # Return as numbers
    return {"min": float(min_val) if isinstance(min_val, (int, float)) else min_val, 
            "max": float(max_val) if isinstance(max_val, (int, float)) else max_val}
