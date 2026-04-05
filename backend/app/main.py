from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import orders, materials, bom, resources, calendar, scheduling, chat, products, import_export, auth, websocket, ai_config

app = FastAPI(
    title="AI-APS API",
    description="智能排产系统API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(ai_config.router, prefix="/api/v1/ai-config", tags=["ai-config"])
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(materials.router, prefix="/api/v1/materials", tags=["materials"])
app.include_router(bom.router, prefix="/api/v1/bom", tags=["bom"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["resources"])
app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(scheduling.router, prefix="/api/v1/scheduling", tags=["scheduling"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(import_export.router, prefix="/api/v1/import-export", tags=["import-export"])
app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])


@app.get("/")
async def root():
    return {
        "message": "AI-APS API",
        "docs": "/docs",
        "health": "/health"
    }
