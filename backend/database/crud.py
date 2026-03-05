import json
import os
import shutil
from typing import List
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from database.utils import get_bool_val, get_float_val, get_int_val, get_uuid
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

def get_dashboards(db: Session, skip: int = 0, limit: int = 0):
    if skip and limit:
        return db.query(models.Dashboard).offset(skip).limit(limit).all()
    else:
        return db.query(models.Dashboard).all()
    

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
