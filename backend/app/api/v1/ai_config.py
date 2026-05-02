from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.ai_config import AIConfig
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class AIConfigCreate(BaseModel):
    name: str
    provider: str  # claude, openai, custom
    api_key: str
    api_base: Optional[str] = None
    model: str
    parameters: Optional[dict] = {}
    is_active: bool = True
    is_default: bool = False


class AIConfigUpdate(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model: Optional[str] = None
    parameters: Optional[dict] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class AIConfigResponse(BaseModel):
    id: int
    name: str
    provider: str
    api_base: Optional[str]
    model: str
    parameters: dict
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIConfigResponseSafe(BaseModel):
    """不包含API密钥的响应"""
    id: int
    name: str
    provider: str
    api_base: Optional[str]
    model: str
    parameters: dict
    is_active: bool
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=list[AIConfigResponseSafe])
def list_ai_configs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取AI配置列表（不包含API密钥）"""
    configs = db.query(AIConfig).offset(skip).limit(limit).all()
    return configs


@router.get("/default", response_model=AIConfigResponseSafe)
def get_default_config(db: Session = Depends(get_db)):
    """获取默认AI配置"""
    config = db.query(AIConfig).filter(AIConfig.is_default == True).first()
    if not config:
        raise HTTPException(status_code=404, detail="未找到默认AI配置")
    return config


@router.get("/{config_id}", response_model=AIConfigResponseSafe)
def get_ai_config(config_id: int, db: Session = Depends(get_db)):
    """获取AI配置详情（不包含API密钥）"""
    config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="AI配置不存在")
    return config


class AIConfigResponseWithKey(BaseModel):
    """包含API密钥的响应"""
    id: int
    name: str
    provider: str
    api_key: Optional[str]
    api_base: Optional[str]
    model: str
    parameters: dict
    is_active: bool
    is_default: bool

    class Config:
        from_attributes = True


@router.get("/{config_id}/detail", response_model=AIConfigResponseWithKey)
def get_ai_config_with_key(config_id: int, db: Session = Depends(get_db)):
    """获取AI配置详情（包含API密钥，仅管理员或本人使用）"""
    config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="AI配置不存在")
    return config


@router.post("/", response_model=AIConfigResponseSafe)
def create_ai_config(config: AIConfigCreate, db: Session = Depends(get_db)):
    """创建AI配置"""
    # 验证provider
    if config.provider not in ["claude", "openai", "custom"]:
        raise HTTPException(status_code=400, detail="不支持的AI提供商")

    # 如果设置为默认，取消其他配置的默认状态
    if config.is_default:
        db.query(AIConfig).update({"is_default": False})

    db_config = AIConfig(**config.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.put("/{config_id}", response_model=AIConfigResponseSafe)
def update_ai_config(
    config_id: int,
    config: AIConfigUpdate,
    db: Session = Depends(get_db)
):
    """更新AI配置"""
    db_config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="AI配置不存在")

    # 如果设置为默认，取消其他配置的默认状态
    if config.is_default:
        db.query(AIConfig).filter(AIConfig.id != config_id).update({"is_default": False})

    # 更新字段
    update_data = config.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_config, key, value)

    db_config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_config)
    return db_config


@router.delete("/{config_id}")
def delete_ai_config(config_id: int, db: Session = Depends(get_db)):
    """删除AI配置"""
    db_config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="AI配置不存在")

    if db_config.is_default:
        raise HTTPException(status_code=400, detail="不能删除默认配置")

    db.delete(db_config)
    db.commit()
    return {"message": "AI配置已删除"}


@router.post("/{config_id}/set-default")
def set_default_config(config_id: int, db: Session = Depends(get_db)):
    """设置为默认配置"""
    db_config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="AI配置不存在")

    # 取消其他配置的默认状态
    db.query(AIConfig).update({"is_default": False})

    # 设置当前配置为默认
    db_config.is_default = True
    db.commit()
    db.refresh(db_config)

    return {"message": f"已将 {db_config.name} 设置为默认配置"}


class AIConfigTestRequest(BaseModel):
    provider: str
    api_key: str
    api_base: Optional[str] = None
    model: str
    parameters: Optional[dict] = {}


@router.post("/test-connection")
async def test_ai_config_connection(config: AIConfigTestRequest, db: Session = Depends(get_db)):
    """测试AI配置（无需保存，可直接测试）"""
    from app.services.ai_service import get_ai_response

    if config.provider not in ["claude", "openai", "custom"]:
        raise HTTPException(status_code=400, detail="不支持的AI提供商")

    # 创建临时配置对象
    test_config = AIConfig(
        name="test",
        provider=config.provider,
        api_key=config.api_key,
        api_base=config.api_base,
        model=config.model,
        parameters=config.parameters or {},
        is_active=True,
        is_default=False,
    )

    test_messages = [{"role": "user", "content": "你好，请回复'测试成功'"}]

    try:
        response_text = ""
        async for chunk in get_ai_response(test_config, test_messages, stream=False):
            response_text += chunk

        return {
            "status": "success",
            "message": "连接测试成功",
            "response": response_text
        }
    except Exception as e:
        return {
            "status": "failed",
            "message": f"连接测试失败: {str(e)}"
        }


@router.post("/{config_id}/test")
async def test_ai_config(config_id: int, db: Session = Depends(get_db)):
    """测试AI配置"""
    from app.services.ai_service import get_ai_response

    db_config = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="AI配置不存在")

    # 发送测试消息
    test_messages = [
        {"role": "user", "content": "你好，请回复'测试成功'"}
    ]

    try:
        response_text = ""
        async for chunk in get_ai_response(db_config, test_messages, stream=False):
            response_text += chunk

        return {
            "status": "success",
            "message": "AI配置测试成功",
            "response": response_text
        }
    except Exception as e:
        return {
            "status": "failed",
            "message": f"AI配置测试失败: {str(e)}"
        }
