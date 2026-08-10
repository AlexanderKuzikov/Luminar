# Luminar — Instructions for AI Agents

## Commands
- install:all: `npm run install:all`
- dev: `npm run dev`
- dev:backend: `npm run dev:backend`
- dev:frontend: `npm run dev:frontend`
- build: `npm run build`
- start: `npm start`

## Conventions
- Monorepo: backend/ + frontend/
- Backend: Node.js 24, Express, TypeScript 5
- Frontend: Vue 3, Vite 5, Tailwind CSS v4, Monaco Editor
- OpenAI-compatible Image API (multi-provider)
- Sharp для pre/post-processing
- Handlebars для Blueprint/Snippets промптов
- SSE для прогресса батчей
- Сервер на 127.0.0.1 только
- API-ключи только в .env

## Structure
- `backend/` — Express API (routes, services, utils)
- `frontend/` — Vue 3 SPA
- `config.json` — провайдеры, порт, UI (без секретов)
- `data/` — snippets, blueprints, media registry, logs

## Do NOT touch
- `.env` — API-ключи
- `data/` — пользовательские данные
- `node_modules/`

## Documentation rules
- После работы — обнови docs/CONTEXT.md
- Если принял архитектурное решение — запиши в docs/DECISIONS.md
- НЕ создавай новых файлов документации без разрешения
- Переиспользуемые знания — в D:\GitHub\knowledge/README.md
