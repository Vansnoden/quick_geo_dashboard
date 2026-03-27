# -*- coding: utf-8 -*-

from pydantic import BaseModel
from sqlalchemy import UUID, Boolean, Column, Date, ForeignKey, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from database.session import Base
import datetime
from geoalchemy2 import Geometry
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    fullname = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)


class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(UUID(as_uuid=True), unique=True)
    data_table_name = Column(String, nullable=True)
    ui_yaml_script = Column(String, nullable=True)
    ui_js_script = Column(String, nullable=True)
    create_date = Column(DateTime, nullable=False)
    last_update_date = Column(DateTime, nullable=False)
    is_published = Column(Boolean, default=False)
