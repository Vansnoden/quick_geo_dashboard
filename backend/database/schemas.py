# -*- coding: utf-8 -*-

from datetime import datetime
from typing import List, Optional, Union
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


class DashboardPagination(BaseModel):
    data: List[Dashboard]
    total_count: int
    total_pages: int



# charts
class YAxisDef(BaseModel):
    column: Optional[str] = None
    aggregation: Optional[str] = None  # 'sum', 'avg', 'count', etc.

class ChartDataRequest(BaseModel):
    type: str  # 'bar', 'line', 'pie'
    title: str
    x: str
    y: Union[YAxisDef, str]  # string means count

class ChartDataResponse(BaseModel):
    labels: List[str]
    data: List[float]