# -*- coding: utf-8 -*-

from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class UserBase(BaseModel):
    username: str
    fullname: str
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class FileBase(BaseModel):
    file_path: str


# dashboard

class Dashboard(BaseModel):
    id: int
    user_id: int
    name: str
    code: UUID
    data_table_name: str
    ui_yaml_script: str
    ui_js_script: str
    create_date: datetime
    last_update_date: datetime

    class Config:
        from_attributes = True


class DashboardCreate(BaseModel):
    user_id: int
    name: str


class DashboardConfigUpdate(BaseModel):
    yaml_content: str