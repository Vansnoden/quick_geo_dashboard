# -*- coding: utf-8 -*-

from datetime import datetime
from typing import Dict, List, Optional, Union, Literal
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
    is_published: bool

    class Config:
        from_attributes = True


class DashboardCreate(BaseModel):
    user_id: int
    name: str

class DashboardCreateRequest(BaseModel):
    name: str


class DashboardConfigUpdate(BaseModel):
    yaml_content: str


class DashboardPagination(BaseModel):
    data: List[Dashboard]
    total_count: int
    total_pages: int


# charts
class FilterCondition(BaseModel):
    column: str
    operator: str # '=', '!=', '>', '>=', '<', '<=', 'like', 'in', 'between', 'is null', 'is not null'
    value: Union[str, int, float, List[Union[str, int, float]]]
    # 'value2' is only needed for 'between' operator
    value2: Optional[Union[str, int, float]] = None


class YAxisDef(BaseModel):
    column: Optional[str] = None
    aggregation: Optional[str] = None  # 'sum', 'avg', 'count', etc.


class ChartDef(BaseModel):
    """Definition of a chart in the dashboard"""
    type: Literal['bar', 'line', 'pie', 'stackedbar']
    title: str
    x: str
    y: Union[YAxisDef, str]  # string means count
    stackBy: Optional[str] = None
    filters: Optional[List[FilterCondition]] = []


class ChartDataRequest(BaseModel):
    type: str  # 'bar', 'line', 'pie'
    title: str
    x: str
    y: Union[YAxisDef, str]  # string means count
    filters: Optional[List[FilterCondition]] = [] 


class ChartDataResponse(BaseModel):
    labels: List[str]
    data: List[float]


class MapStyleRule(BaseModel):
    field: str
    operator: Optional[Literal['=', '!=', 'like', 'in']] = '='
    value: Union[str, int, float, List[Union[str, int, float]]]
    color: str
    label: Optional[str] = None


class MapStyleLegend(BaseModel):
    title: Optional[str] = None
    position: Optional[Literal['topleft', 'topright', 'bottomleft', 'bottomright']] = 'bottomright'
    grouped: Optional[bool] = False


class MapStyle(BaseModel):
    colorBy: Optional[str] = None
    sizeBy: Optional[str] = None
    defaultColor: str = "#6b7280"
    defaultSize: int = 6
    minSize: Optional[int] = 4
    maxSize: Optional[int] = 12
    rules: List[MapStyleRule] = []
    legend: Optional[MapStyleLegend] = None


class MapDef(BaseModel):
    lat: str
    lon: str
    layer: Optional[str] = None
    style: Optional[MapStyle] = None
    filters: Optional[List[FilterCondition]] = []


class InteractiveFilterDef(BaseModel):
    """Definition of an interactive filter to be shown in the sidebar"""
    column: str
    label: str
    type: Literal['dropdown', 'multiselect', 'range']
    min: Optional[Union[int, float]] = None  # For range filters, optional min
    max: Optional[Union[int, float]] = None  # For range filters, optional max


class DashboardConfig(BaseModel):
    name: str
    template: str
    filters: Optional[List[FilterCondition]] = []
    interactiveFilters: Optional[List[InteractiveFilterDef]] = []
    stats: List[ChartDef]
    map: MapDef
    menus: Dict[str, str]
