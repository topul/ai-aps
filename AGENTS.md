# AGENTS.md - AI-APS Developer Guide

## Quick Commands

```bash
# Development
docker compose up -d --build    # Start all services
docker compose logs -f          # View logs
docker compose restart <svc>   # Restart specific service

# Frontend (runs at localhost:5173)
cd frontend && npm run dev
cd frontend && npm run build     # typecheck then build

# Backend (runs at localhost:8000)
cd backend && uvicorn app.main:app --reload

# Database
docker compose exec -T backend alembic upgrade head  # Run migrations
docker compose exec -T backend python seed_data.py  # Seed test data

# Create database user (bcrypt workaround needed)
docker compose exec -T backend python3 -c "
import bcrypt
from app.core.database import SessionLocal
from app.models.user import User
db = SessionLocal()
db.add(User(username='admin', email='a@b.com', hashed_password=bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode(), is_active=True))
db.commit()
"
```

## Project Structure

```
frontend/src/
├── pages/           # Route pages (App.tsx defines routes)
├── components/     # Shared components
├── stores/         # Zustand state
├── services/       # API calls
└── types/         # TypeScript interfaces

backend/app/
├── api/v1/        # API route handlers
├── models/         # SQLAlchemy models
├── schemas/        # Pydantic schemas
├── services/       # Business logic
└── core/          # Config, DB, security
```

## Key Patterns

- **Frontend**: Use existing Zustand stores, Radix UI components, lucide-react icons
- **Backend**: New models go in `app/models/`, new routes in `app/api/v1/`, add router to `main.py`
- **Database migrations**: `alembic revision --autogenerate -m "desc"` then `alembic upgrade head`
- **Auth**: Token stored in localStorage, API interceptor adds `Authorization: Bearer` header
- **Login endpoint**: POST to `/api/v1/auth/login` with form data (not JSON)

## Gotchas

- **bcrypt**: Must use `bcrypt.hashpw()` directly, passlib has compatibility issues with recent bcrypt versions
- **Frontend build errors**: Some existing files have TS warnings (unused vars, type imports). New code should be clean.
- **Docker rebuild**: Changes to backend/* require `docker compose up -d --build backend`
- **OAuth2PasswordBearer**: Import from `fastapi.security`, NOT from `app.core.security`

## Important Files

- `REFACTOR_PLAN.md` - Recent refactoring details
- `docker-compose.yml` - Service orchestration
- `.env.example` - Required env vars
## Git Workflow
After every code change, ALWAYS run:
```bash
git add . && git commit -m "msg" && git push
```
Do not wait to be reminded. Commit + push is automated after every modification.
