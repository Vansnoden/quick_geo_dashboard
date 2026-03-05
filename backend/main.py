# -*- coding: utf-8 -*-

from datetime import timedelta, timezone, datetime
import math
import os, json, time
from pathlib import Path
from typing import Annotated, List, Optional
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile, Body
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from database.utils import excel_to_csv, get_uuid
from database.schemas import User, FileBase
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from database import crud, models, schemas
from database.session import SessionLocal, engine
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from slugify import slugify
import logging
import sys
import random
from random import randrange
from sqlalchemy.sql import text
from queries import *
import numpy as np
from numpy.linalg import norm
import ast
from fastapi.responses import StreamingResponse


logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)
if sys.version_info[0] >= 3:
    unicode = str


SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 3600 * 24
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

ITEMS_PER_PAGE = 10

app = FastAPI(root_path="/api")

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
    # "http://9.141.176.168",
    # "http://9.141.176.168:3000",
    # "http://9.141.176.168:8000",
    # "https://beehealth.icipe.org",
    # "https://beehealth.icipe.org/api",
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

@app.get("/dashboards/", response_model=list[schemas.Dashboard], include_in_schema=True)
def read_dashboards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_dashboards(db, skip=skip, limit=limit)
    return users


@app.post("/dashboards/add", response_model=schemas.Dashboard, include_in_schema=True)
def create_dashboard(
    user: Annotated[User, Depends(get_current_active_user)],
    dashboard: schemas.DashboardCreate, 
    db: Session = Depends(get_db)):
    if user and dashboard.name:
        return crud.create_dashboard(
            db,
            user,
            dashboard,
        )
    if validate_user(user):
        return crud.create_user(db=db, user=user)

