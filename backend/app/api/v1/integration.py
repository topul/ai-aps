from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.user import User
from app.models.integration import IntegrationConfig, IntegrationLog

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    from app.core.security import decode_access_token
    credentials_exception = HTTPException(
        status_code=401,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user


class IntegrationConfigCreate(BaseModel):
    name: str
    config_type: str = 'api'
    config_data: dict = {}


class IntegrationConfigResponse(BaseModel):
    id: int
    name: str
    config_type: str
    config_data: dict
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/inbound", response_model=List[IntegrationConfigResponse])
def list_inbound_configs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取入站配置列表"""
    return db.query(IntegrationConfig).filter(
        IntegrationConfig.config_type.in_(['webhook', 'api', 'file'])
    ).offset(skip).limit(limit).all()


@router.post("/inbound", response_model=IntegrationConfigResponse)
def create_inbound_config(
    config: IntegrationConfigCreate,
    db: Session = Depends(get_db)
):
    """创建入站配置"""
    db_config = IntegrationConfig(**config.dict(), config_type=config.config_type)
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.put("/inbound/{config_id}", response_model=IntegrationConfigResponse)
def update_inbound_config(
    config_id: int,
    config: IntegrationConfigCreate,
    db: Session = Depends(get_db)
):
    """更新入站配置"""
    db_config = db.query(IntegrationConfig).filter(IntegrationConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    db_config.name = config.name
    db_config.config_data = config.config_data
    db.commit()
    db.refresh(db_config)
    return db_config


@router.delete("/inbound/{config_id}")
def delete_inbound_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    """删除入站配置"""
    db_config = db.query(IntegrationConfig).filter(IntegrationConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    db.delete(db_config)
    db.commit()
    return {"message": "删除成功"}


@router.get("/outbound", response_model=List[IntegrationConfigResponse])
def list_outbound_configs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取出站配置列表"""
    return db.query(IntegrationConfig).filter(
        IntegrationConfig.config_type.in_(['api', 'webhook', 'file'])
    ).offset(skip).limit(limit).all()


@router.post("/outbound", response_model=IntegrationConfigResponse)
def create_outbound_config(
    config: IntegrationConfigCreate,
    db: Session = Depends(get_db)
):
    """创建出站配置"""
    db_config = IntegrationConfig(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.put("/outbound/{config_id}", response_model=IntegrationConfigResponse)
def update_outbound_config(
    config_id: int,
    config: IntegrationConfigCreate,
    db: Session = Depends(get_db)
):
    """更新出站配置"""
    db_config = db.query(IntegrationConfig).filter(IntegrationConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    db_config.name = config.name
    db_config.config_data = config.config_data
    db.commit()
    db.refresh(db_config)
    return db_config


@router.delete("/outbound/{config_id}")
def delete_outbound_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    """删除出站配置"""
    db_config = db.query(IntegrationConfig).filter(IntegrationConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="配置不存在")
    
    db.delete(db_config)
    db.commit()
    return {"message": "删除成功"}


class IntegrationLogResponse(BaseModel):
    id: int
    config_id: int
    request_data: dict
    response_data: dict
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/logs", response_model=List[IntegrationLogResponse])
def list_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取请求日志"""
    return db.query(IntegrationLog).order_by(
        IntegrationLog.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.get("/logs/{log_id}", response_model=IntegrationLogResponse)
def get_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    """获取日志详情"""
    log = db.query(IntegrationLog).filter(IntegrationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")
    return log