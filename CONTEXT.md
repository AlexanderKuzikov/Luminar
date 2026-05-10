# CONTEXT — Luminar

> **⚠️ Код сгенерирован, не тестировался и не проверялся на работоспособность.**

---

## 1. Что это

Luminar — локальный Desktop-first инструмент для пакетного AI-ретуша и генерации изображений.
Архитектура: Node.js/Express backend + Vue 3 SPA. Открывается в браузере, запускается одной командой.

**Целевая платформа:** Windows (Ryzen 5 3600, GTX 1660 6Gb, 64Gb RAM).

---

## 2. Статус реализации

| Компонент | Статус |
|---|---|
| Backend: routes, services, utils | ✅ Написан (не тестировался) |
| Frontend: Vue 3, все Views, компоненты | ✅ Написан (не тестировался) |
| Сборка frontend → backend/public | ✅ Настроена (Vite) |
| Шрифт Inter | ⚠️ Файл отсутствует — нужно добавить вручную |
| Тесты | ❌ Отсутствуют |
| CI/CD | ❌ Отсутствует |
| Electron-обёртка | ❌ Не реализована (в планах) |

---

## 3. Файловая структура

```
Luminar/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Bootstrap, port-finder, open browser
│   │   ├── types.ts                 # Все интерфейсы
│   │   ├── routes/
│   │   │   ├── files.ts             # PowerShell folder picker, /api/image
│   │   │   ├── batch.ts             # POST /retouch, GET /:id, SSE /events, DELETE
│   │   │   ├── generate.ts          # POST /generate
│   │   │   ├── blueprints.ts        # CRUD /blueprints
│   │   │   ├── snippets.ts          # GET/PUT /snippets
│   │   │   ├── config.ts            # GET/PUT /config
│   │   │   └── registry.ts          # GET /registry, /sessions, PATCH reject
│   │   ├── services/
│   │   │   ├── compiler.ts          # Handlebars: Snippets + Blueprint → prompt snapshot
│   │   │   ├── sharp-processor.ts   # preProcess / postProcess / buildOutputPath
│   │   │   ├── provider.ts          # OpenAI SDK: generate() + retouch() dual-strategy
│   │   │   └── batch-controller.ts  # Queue, Retry (exp backoff), SSE, cancel
│   │   └── utils/
│   │       ├── paths.ts             # getDataDir(), Paths.*
│   │       ├── config.ts            # loadConfig / saveConfig / getActiveProvider
│   │       ├── registry.ts          # addEntry / updateEntryStatus / getSessionList
│   │       ├── logger.ts            # Rolling file logger (10MB cap)
│   │       └── init.ts              # Создание data/ структуры при первом запуске
│   ├── public/                      # ← Vite build output (gitignored)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.ts                  # App bootstrap
│   │   ├── api/index.ts             # fetch-клиент + все типы
│   │   ├── stores/
│   │   │   ├── files.ts             # selectFolder, scan, selection
│   │   │   ├── batch.ts             # startBatch, SSE listener, results
│   │   │   └── blueprints.ts        # list, select, save
│   │   ├── views/
│   │   │   ├── RetouchView.vue      # 3-колонки: Explorer / Grid / Inspector
│   │   │   ├── GenerateView.vue     # History / Preview / Settings
│   │   │   ├── LibraryView.vue      # Blueprint + Snippets editor (Monaco)
│   │   │   └── HistoryView.vue      # Sessions + registry table
│   │   └── components/
│   │       ├── SourceExplorer.vue   # Thumbnail list, checkboxes, bulk select
│   │       ├── WorkspaceGrid.vue    # Grid превью + fullscreen
│   │       ├── ReviewCompare.vue    # Before/After + Reject
│   │       ├── Inspector.vue        # Blueprint, настройки, прогресс, Старт/Стоп
│   │       ├── MonacoEditor.vue     # Monaco v-model wrapper
│   │       └── SettingsModal.vue    # Config провайдеров
│   ├── vite.config.ts               # proxy /api → :3000, build → ../backend/public
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
├── data/                            # Рабочая директория
│   ├── config.json
│   ├── snippets.json
│   ├── blueprints/
│   │   └── example.json
│   ├── media/
│   │   └── registry.json
│   └── logs/
├── README.md
└── CONTEXT.md
```

---

## 4. API-маршруты

| Method | Path | Описание |
|---|---|---|
| GET | /api/files/select-folder | PowerShell folder picker (Windows) |
| GET | /api/files/scan-folder?path= | Сканировать папку без диалога |
| GET | /api/files/image?path= | Отдать локальный файл изображения |
| POST | /api/batch/retouch | Запустить batch-ретушь → `{ jobId }` |
| GET | /api/batch/:id | Статус batch-задачи |
| GET | /api/batch/:id/events | SSE-поток прогресса |
| DELETE | /api/batch/:id | Отменить задачу |
| POST | /api/generate | Text-to-Image |
| GET | /api/blueprints | Список blueprints |
| GET/PUT | /api/blueprints/:id | Получить/сохранить blueprint |
| POST | /api/blueprints | Создать новый |
| DELETE | /api/blueprints/:id | Удалить |
| GET/PUT | /api/snippets | Получить/сохранить snippets.json |
| GET/PUT | /api/config | Конфиг (GET маскирует API-ключи) |
| GET | /api/registry | Все записи истории |
| GET | /api/registry/sessions | Список сессий |
| PATCH | /api/registry/:id/reject | Пометить как rejected |

---

## 5. Multi-Provider архитектура

OpenAI SDK инициализируется с `baseURL` и `apiKey` из `config.json` — любой совместимый провайдер работает без изменений кода.

**Стратегии ретуши (`retouch_strategy`):**

| Стратегия | Эндпоинт | Когда использовать |
|---|---|---|
| `edit` | `/v1/images/edits` | Провайдеры с OpenAI-совместимым Img2Img |
| `generate` | `/v1/images/generations` | Провайдеры без `/edits`, передаём base64 в промпт |

**Пресеты ретуши:**

| Пресет | Strength | Сценарий |
|---|---|---|
| `soft` | 0.3 | Лёгкая коррекция |
| `medium` | 0.6 | Стандарт |
| `strong` | 0.9 | Сильная переработка |

---

## 6. Blueprint + Snippets система

Handlebars-шаблонизация: `{{category.key}}` в Blueprint заменяется значением из `snippets.json`.
Итоговый prompt snapshot = `subject + lighting + environment + camera` (или `prompt_override`).

---

## 7. Batch processing

- Последовательная обработка (concurrency=1, чтобы не превысить rate limit)
- Retry с exponential backoff: 1s → 2s → 4s на ошибки 429 и 5xx
- SSE `/api/batch/:id/events` для real-time прогресса
- Отмена через `DELETE /api/batch/:id` (проверка флага между итерациями)
- Все результаты пишутся в `registry.json`

---

## 8. Известные проблемы и что нужно проверить

1. **Шрифт Inter** — `frontend/src/assets/fonts/Inter-VariableFont.woff2` отсутствует. Нужно добавить файл или убрать `@font-face`.
2. **PowerShell folder picker** — работает только на Windows. На Linux/macOS `exec('powershell ...')` упадёт.
3. **Стратегия `generate` для ретуши** — передача base64 в промпт нестандартна. Поведение зависит от провайдера.
4. **Monaco workers** — требует `vite-plugin-monaco-editor`. Если плагин не найдёт workers — Monaco упадёт на большие файлах. Нужна проверка после `npm install`.
5. **sharp на Windows** — нативный модуль, требует отдельного `npm install` с `node-gyp`. Возможны проблемы при первой установке.
6. **Нет валидации** на `/api/config` PUT — можно передать невалидный JSON.
7. **`FormData` import** в `provider.ts` — импортируется, но не используется. Нужно убрать или проверить.
