# CONTEXT — Luminar

> **⚠️ Сессионный документ.** Содержит актуальное состояние проекта. Обновляется после каждого значимого изменения. Используй как стартовую точку новой сессии.

---

## 1. Что это

Luminar — локальный Desktop-first инструмент для пакетного AI-ретуша и генерации изображений.
Архитектура: **Node.js/Express backend + Vue 3 SPA**. Открывается в браузере, запускается одной командой (`app.exe` в portable-режиме).

**Целевая платформа:** Windows 10/11.

---

## 2. Статус реализации

| Компонент | Статус |
|---|---|
| Backend: routes, services, utils | ✅ Написан |
| Frontend: Vue 3, все Views, компоненты | ✅ Написан |
| Сборка frontend → backend/public | ✅ Настроена (Vite) |
| config.json в корне (единый источник) | ✅ Реализован |
| Multi-key провайдеры (ключи через .env) | ✅ Реализован |
| Авто-поиск свободного порта | ✅ Реализован |
| Dev-режим (npm run dev в корне) | ✅ Работает (проверено) |
| Vite поднимается, `/api/blueprints` отвечает | ✅ Проверено — `[{"id":"example","title":"Example Blueprint"}]` |
| Inter шрифт (Cyrillic) | ✅ Исправлен — `@font-face` split по `unicode-range` |
| `concurrently` → `npm-run-all` | ✅ Заменён (Windows TCP fix) |
| Тесты | ❌ Отсутствуют |
| CI/CD | ❌ Отсутствует |
| Electron-обёртка | ❌ Не реализована (в планах) |

---

## 3. Конфигурация

### 3.1 config.json (корень репо / рядом с exe)

Единый источник конфигурации приложения. **Не содержит значений API-ключей** — только ссылки на переменные окружения.

```json
{
  "port": 3333,
  "active_provider": "VSELLM",
  "ui": {
    "theme": "dark",
    "default_output": "subfolder"
  },
  "providers": [
    {
      "id": "VSELLM",
      "name": "VseLLM / LM Studio",
      "baseURL": "https://api.vsellm.ru/v1",
      "active_key": "key_1",
      "keys": [
        { "id": "key_1", "label": "Default", "envVar": "VSELLM_KEY_1" }
      ],
      "retouch_strategy": "edit",
      "models": [
        {
          "id": "gemini-3-pro-image",
          "name": "Gemini 3 Pro Image",
          "modes": ["generate", "retouch"],
          "sizes": ["1024x1024", "1536x1024", "1024x1536"],
          "quality": ["standard", "hd"]
        }
      ]
    }
  ]
}
```

### 3.2 .env (корень репо, никогда не коммитится)

Хранит реальные значения ключей. Формат имени переменной: `{PROVIDER_ID}_{KEY_ID}` (верхний регистр).

```env
VSELLM_KEY_1=sk-...
# VSELLM_KEY_2=sk-...   # второй ключ того же провайдера
# OPENAI_KEY_1=sk-...
```

См. `.env.example` — шаблон с документацией всех переменных.

### 3.3 Логика разрешения ключей (`utils/config.ts`)

```
getActiveProvider() / getProviderById(id)
  → resolveProviderKey(provider)
    → provider.keys.find(k => k.id === provider.active_key)
    → process.env[keyEntry.envVar] → apiKey
```

Возвращает `Provider & { apiKey: string }` — совместимо с OpenAI SDK. Значение ключа **никогда не хранится в config.json**.

### 3.4 Переключение провайдера/ключа через UI

- `PUT /api/config` — меняет `active_provider`, `active_key` внутри провайдера, `port`, `ui`
- `GET /api/config` — возвращает конфиг с флагом `configured: bool` вместо значений ключей
- Значения ключей через API **не принимаются и не отдаются**. Редактирование `.env` — напрямую на диске.

---

## 4. Порты

- Стартовый порт: `config.json → port` (дефолт `3333`)
- `findFreePort(startPort, maxAttempts=20)` — перебирает `3333…3352`, берёт первый свободный
- Сервер слушает строго на `127.0.0.1` (не `0.0.0.0`)
- Vite dev proxy читает порт из того же `config.json` → `http://localhost:{port}`
- В dev-режиме frontend доступен на `http://localhost:5173`

---

## 5. Файловая структура

```
Luminar/
├── config.json              # ← Главный конфиг (порт, провайдеры, UI)
├── .env                     # ← API-ключи (НЕ в git)
├── .env.example             # ← Шаблон .env
├── .gitignore
├── README.md
├── CONTEXT.md
├── LICENSE
├── package.json             # ← Корневой: npm-run-all, скрипты dev/build
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Bootstrap, port-finder (авто-открытие браузера УБРАНО)
│   │   ├── types.ts                 # Все интерфейсы (ProviderKey, Provider, AppConfig...)
│   │   ├── routes/
│   │   │   ├── files.ts             # PowerShell folder picker, /api/image
│   │   │   ├── batch.ts             # POST /retouch, GET /:id, SSE /events, DELETE
│   │   │   ├── generate.ts          # POST /generate
│   │   │   ├── blueprints.ts        # CRUD /blueprints
│   │   │   ├── snippets.ts          # GET/PUT /snippets
│   │   │   ├── config.ts            # GET/PUT /config (ключи — только флаг configured)
│   │   │   └── registry.ts          # GET /registry, /sessions, PATCH reject
│   │   ├── services/
│   │   │   ├── compiler.ts          # Handlebars: Snippets + Blueprint → prompt snapshot
│   │   │   ├── sharp-processor.ts   # preProcess / postProcess / buildOutputPath
│   │   │   ├── provider.ts          # OpenAI SDK: generate() + retouch() dual-strategy
│   │   │   └── batch-controller.ts  # Queue, Retry (exp backoff), SSE, cancel
│   │   └── utils/
│   │       ├── paths.ts             # getRootDir(), getDataDir(), Paths.*
│   │       ├── config.ts            # loadConfig / saveConfig / getActiveProvider / resolveProviderKey
│   │       ├── registry.ts          # addEntry / updateEntryStatus / getSessionList
│   │       ├── logger.ts            # Rolling file logger (10MB cap, daily rotation)
│   │       └── init.ts              # Создание data/ структуры при первом запуске (БЕЗ config.json)
│   ├── public/                      # ← Vite build output (gitignored)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
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
│   │       └── SettingsModal.vue    # Управление провайдерами и ключами (типы синхронизированы)
│   ├── vite.config.ts               # proxy /api → :{port из config.json}, build → ../backend/public
│   ├── index.html
│   ├── package.json                 # type: "module" (ESM, для @tailwindcss/vite)
│   └── tsconfig.json
└── data/                            # Рабочая директория (создаётся при первом запуске)
    ├── snippets.json
    ├── blueprints/
    │   └── example.json             # Дефолтный blueprint (корректные модель/quality)
    ├── media/
    │   └── registry.json
    └── logs/
```

---

## 6. API-маршруты

| Method | Path | Описание |
|---|---|---|
| GET | /api/files/select-folder | PowerShell folder picker (Windows only) |
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
| GET | /api/config | Конфиг (ключи → только флаг `configured: bool`) |
| PUT | /api/config | Обновить конфиг (active_provider, active_key, port, ui) |
| GET | /api/registry | Все записи истории |
| GET | /api/registry/sessions | Список сессий |
| PATCH | /api/registry/:id/reject | Пометить как rejected |

---

## 7. Multi-Provider архитектура

OpenAI SDK инициализируется с `baseURL` + `apiKey` из `resolveProviderKey()` — любой OpenAI-совместимый провайдер работает без изменений кода.

### Структура провайдера

```typescript
interface Provider {
  id: string;                        // Уникальный ID, используется как префикс env-переменных
  name: string;                      // Human-readable название
  baseURL: string;                   // OpenAI-compatible endpoint
  active_key: string;                // id активного ProviderKey
  keys: ProviderKey[];               // [{id, label, envVar}] — значений нет, только ссылки
  retouch_strategy: 'edit'|'generate';
  models: ProviderModel[];           // [{id, name, modes, sizes, quality}]
}
```

### Стратегии ретуши

| Стратегия | Эндпоинт | Когда использовать |
|---|---|---|
| `edit` | `/v1/images/edits` | Провайдеры с OpenAI-совместимым Img2Img |
| `generate` | `/v1/images/generations` | Провайдеры без `/edits` (base64 в промпт) |

### Добавление нового провайдера

1. Добавить объект в `config.json → providers[]`
2. Добавить ключи в `.env`: `{PROVIDER_ID}_KEY_1=sk-...`
3. Через UI (`SettingsModal`) переключить `active_provider`

---

## 8. Blueprint + Snippets система

Handlebars-шаблонизация: `{{category.key}}` в Blueprint заменяется значением из `snippets.json`.
Итоговый prompt snapshot = `subject + lighting + environment + camera` (или `prompt_override`).
Snapshot сохраняется в `registry.json` — всегда воспроизводимо.

---

## 9. Batch processing

- Последовательная обработка (`concurrency=1`, rate limit safety)
- Retry с exponential backoff: `1s → 2s → 4s` на ошибки `429` и `5xx`
- SSE `/api/batch/:id/events` — real-time прогресс
- Отмена через `DELETE /api/batch/:id` (флаг проверяется между итерациями)
- Все результаты пишутся в `data/media/registry.json`

---

## 10. Безопасность

- **API-ключи** — только в `.env`, никогда в `config.json`, никогда в API-ответах
- **GET /api/config** возвращает `configured: bool` вместо значений/маски ключей
- **PUT /api/config** принимает структуру (провайдеры, active_key, порт, UI), но не значения ключей
- Сервер слушает строго на `127.0.0.1`, не доступен из сети
- `/api/files/image` — только GET, только файлы изображений

---

## 11. Исправленные проблемы (история сессии)

| Проблема | Решение | Коммит |
|---|---|---|
| `concurrently` рвал TCP на Windows | Заменён на `npm-run-all` в корневом `package.json` | `66ae51a` |
| `catch-all` роут зависал без фронтенд-билда | Возвращает `503` если `index.html` отсутствует | `bee7796` |
| `dotenv` не находил `.env` при смене `cwd` (tsx) | `dotenvConfig({ path: join(getRootDir(), '.env') })` | `5d92ebf` |
| Авто-открытие браузера при dev-старте | Пакет `open` удалён из `index.ts` | `8051c7e` |
| `SettingsModal` рассинхронизирован с новой схемой | Типы `ProviderKey` синхронизированы, UI multi-key | `43acdf9` |
| Inter шрифт без кириллицы | `@font-face` split: Latin + Cyrillic `unicode-range` | `1cd840b` |
| `vite-plugin-monaco-editor` неверное имя пакета | Исправлено имя npm-пакета в `package.json` | `45f513e` |
| `getDataDir()` использовал AppData fallback | Всегда резолвит от `getRootDir()` | `bc8102a` |
| `type:module` отсутствовал в frontend `package.json` | Добавлено для ESM-только зависимостей (@tailwindcss/vite) | `b5f175` |

---

## 12. Известные проблемы (остались)

1. **PowerShell folder picker** — только Windows. На Linux/macOS упадёт (не приоритет).
2. **Стратегия `generate` для ретуши** — передача base64 в промпт нестандартна, поведение зависит от провайдера.
3. **`FormData` import** в `provider.ts` — импортируется, но не используется. Убрать.
4. **Валидация PUT /api/config** — базовая (port range, providers array). Полной схемы нет.
5. **sharp на Windows** — нативный модуль, возможны проблемы с `node-gyp` при первой установке.

---

## 13. Backlog (следующие шаги)

- [ ] Выбор модели в UI (общий для Retouch и Generate, из `provider.models[]`)
- [ ] Выбор формата вывода `webp/jpeg/png` в Inspector, дефолт `webp`
- [ ] Пользовательская рабочая папка — сохраняется в `config.json`, меняется через UI
- [ ] Убрать `FormData` import в `provider.ts`
- [ ] Добавить Zod-валидацию на `PUT /api/config`
- [ ] Electron-обёртка
- [ ] Тесты (хотя бы интеграционные на batch pipeline)
