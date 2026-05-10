# CONTEXT.md — Luminar

> Этот файл — единственный источник правды (SSOT) по архитектурным решениям проекта.
> Обновляется по мере развития проекта. Читать перед началом любой сессии разработки.

---

## Статус проекта

- **Дата старта:** 2026-05-10
- **Стадия:** Архитектура зафиксирована. Разработка не начата.
- **Репозиторий:** https://github.com/AlexanderKuzikov/Luminar

---

## 1. Общая концепция

**Luminar** — локальная (Local-first) десктопная утилита для Windows 10/11.

Главная задача: **пакетная ретушь существующих фотографий** (Batch Img2Img / InstructPix2Pix) на основе текстовых промптов без ручного рисования масок.

Вторичная задача: генерация изображений с нуля (Text-to-Image).

### Ключевые принципы
- **Local-first:** Всё работает офлайн, кроме запросов к Image API
- **Portable:** Работает из папки, без установки (ZIP → распаковал → запустил)
- **Zero-CDN:** Никаких внешних ресурсов в UI (шрифты, иконки, скрипты — всё локально)
- **BYOK:** Пользователь использует собственный ключ API провайдера
- **File-based SSOT:** Никакой реляционной БД. Все данные — JSON-файлы в `data/`
- **Code-first:** Monaco Editor вместо визуальных редакторов промптов (в v1)

---

## 2. Технологический стек

### Runtime
- **Node.js v24 LTS** (Krypton) — стабильная LTS-ветка, полностью совместима с SEA (Single Executable Application)

### Backend
- **Express.js** — HTTP-сервер, REST API, раздача статики фронтенда
- **openai** npm SDK — клиент к Image API (OpenAI-совместимый интерфейс, `baseURL` переопределяется под каждого провайдера)
- **sharp** — Pre/Post-processing изображений (ресайз, конвертация форматов)
- **Handlebars (hbs)** — шаблонизатор для сборки (компиляции) промптов из Blueprint + Library
- **esbuild** — сборка backend-кода в единый `bundle.js` для упаковки в SEA
- **PowerShell (child_process)** — нативный диалог выбора папки Windows без сторонних GUI-библиотек

### Frontend
- **Vue 3 (Composition API)** — реактивный UI
- **Vite 5** — dev-server, сборка
- **Tailwind CSS v4** — CSS-first, zero-config стилизация (без `tailwind.config.js`)
- **shadcn-vue** — набор UI-компонентов на базе Tailwind (копипаст-подход, без тяжелых зависимостей)
- **lucide-vue-next** — inline SVG иконки, никакого CDN
- **Monaco Editor** — встроенный редактор кода для промптов
- **vite-plugin-monaco-editor** — локальная сборка Web Workers Monaco (без CDN)

### НЕ используем
- ❌ Electron (слишком тяжелый, ~350Мб, проблемы со сборкой)
- ❌ Wails (Go) (context switching Go↔TS, `map[string]interface{}` для динамических JSON)
- ❌ SQLite / любая реляционная БД (File-based подхода достаточно)
- ❌ WebSockets (SSE достаточно для однонаправленного стриминга прогресса)
- ❌ CDN-ресурсы в UI (Google Fonts, unpkg, cdnjs)

---

## 3. Структура файловой системы

### Структура релиза (Portable)
```
Luminar/
├── app.exe                  # Node.js SEA (Single Executable Application)
├── public/                  # Сбилженный фронтенд (Vite build output)
└── data/                    # Пользовательский контент (портируется вместе с exe)
    ├── config.json          # Провайдеры, API-ключи, настройки UI
    ├── snippets.json        # Словарь атомарных частей промптов
    ├── blueprints/          # Шаблоны промптов (.json, Handlebars)
    │   └── example.json
    ├── media/               # Результаты обработки
    │   └── registry.json    # SSOT реестр всех обработанных изображений
    └── logs/                # Логи выполнения (rolling, не более 10МБ)
```

### Структура репозитория (Dev)
```
Luminar/
├── backend/
│   ├── src/
│   │   ├── index.ts         # Bootstrap: поиск порта, старт Express, открытие браузера
│   │   ├── routes/
│   │   │   ├── files.ts     # /api/select-folder, /api/scan-folder, /api/image?path=
│   │   │   ├── batch.ts     # /api/batch-retouch, /api/batch-status/:id
│   │   │   ├── generate.ts  # /api/generate (Text-to-Image)
│   │   │   ├── blueprints.ts # /api/blueprints CRUD
│   │   │   └── snippets.ts  # /api/snippets CRUD
│   │   ├── services/
│   │   │   ├── compiler.ts  # Handlebars-движок сборки промптов
│   │   │   ├── batch-controller.ts # Очередь обработки, Exponential Backoff
│   │   │   ├── sharp-processor.ts  # Pre/Post-processing через sharp
│   │   │   └── provider.ts  # OpenAI SDK клиент к Image API (multi-provider)
│   │   ├── utils/
│   │   │   ├── registry.ts  # Чтение/запись data/media/registry.json
│   │   │   ├── config.ts    # Чтение/запись data/config.json
│   │   │   └── paths.ts     # Определение Portable vs AppData режима
│   │   └── types.ts         # Общие TypeScript-интерфейсы
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.vue          # App Shell (Top Bar, Router View)
│   │   ├── views/
│   │   │   ├── Retouch.vue  # Основной режим (3 колонки)
│   │   │   ├── Generate.vue # Генерация с нуля
│   │   │   └── Library.vue  # Управление Blueprint и Snippets
│   │   ├── components/
│   │   │   ├── SourceExplorer.vue  # Левая колонка: список файлов с чекбоксами
│   │   │   ├── WorkspaceGrid.vue   # Центр: Grid view выбранных фото
│   │   │   ├── ReviewCompare.vue   # Центр: Before/After Side-by-Side
│   │   │   ├── Inspector.vue       # Правая колонка: Inspector & Job Settings
│   │   │   ├── MonacoEditor.vue    # Обертка над Monaco Editor
│   │   │   ├── ProgressBar.vue     # Прогресс батч-задачи
│   │   │   └── ImagePreview.vue    # Полноэкранный просмотр
│   │   ├── stores/
│   │   │   ├── files.ts     # Стейт: текущая папка, список файлов, выбранные
│   │   │   ├── batch.ts     # Стейт: текущий jobId, прогресс, результаты
│   │   │   └── blueprints.ts # Стейт: список blueprints, активный blueprint
│   │   ├── api/             # Fetch-клиент к бэкенду
│   │   │   └── index.ts
│   │   └── assets/
│   │       └── fonts/       # Локальные шрифты (Inter или аналог)
│   ├── vite.config.ts
│   └── package.json
├── scripts/
│   └── build-sea.js         # Скрипт упаковки в SEA (Node.js + esbuild)
├── data/                    # Стартовые данные (копируются в релиз)
│   ├── config.json
│   ├── snippets.json
│   └── blueprints/
│       └── example.json
├── CONTEXT.md               # Этот файл
├── README.md
└── .gitignore
```

---

## 4. Архитектура Bootstrap (Жизненный цикл запуска)

1. Запуск `app.exe` (процесс Node.js без консольного окна — флаг линкера или VBS-обертка)
2. `paths.ts`: Проверка наличия папки `data/` рядом с исполняемым файлом → Portable-режим. Иначе — `%LOCALAPPDATA%\Luminar`
3. Если `data/` не существует — создать базовую структуру с дефолтными JSON-файлами
4. `config.ts`: Загрузка `data/config.json`
5. Поиск свободного порта: начиная с 3000, +1 пока не найдет свободный
6. Старт Express: роуты API + `express.static('public/')`
7. `open('http://localhost:<port>')` — открытие дефолтного браузера

---

## 5. Архитектура провайдеров (Multi-Provider)

### Принцип
Все провайдеры используют **OpenAI-совместимый API**. Клиент — официальный `openai` npm SDK.
Для смены провайдера достаточно поменять `baseURL` и `apiKey` — код провайдера не меняется.

Подтверждено тестированием с `vsellm.ru` (`baseURL: "https://api.vsellm.ru/v1"`).
Ответ всегда синхронный: `response_format: 'b64_json'` → base64 в теле ответа. Никакого polling.

### Структура `data/config.json`
```json
{
  "active_provider": "vsellm",
  "ui": {
    "theme": "dark",
    "default_output": "subfolder"
  },
  "providers": [
    {
      "id": "vsellm",
      "name": "VseLLM",
      "baseURL": "https://api.vsellm.ru/v1",
      "apiKey": "sk-xxxxxxxxxx",
      "retouch_strategy": "edit",
      "models": [
        {
          "id": "gemini-3-pro-image",
          "name": "Gemini 3 Pro Image",
          "modes": ["generate", "retouch"],
          "sizes": ["1024x1024", "1536x1024", "1024x1536", "1536x1536"],
          "quality": ["low", "medium", "high"]
        }
      ]
    }
  ]
}
```

### Поле `retouch_strategy` (на уровне провайдера)
Документация у российских провайдеров отсутствует или недостоверна.
Стратегия переключается в `config.json` без перекомпиляции:

| Значение | Метод SDK | Эндпоинт | Описание |
|---|---|---|---|
| `"edit"` | `client.images.edit()` | `/v1/images/edits` | Стандартный OpenAI Img2Img, исходник как `image` параметр |
| `"generate"` | `client.images.generate()` | `/v1/images/generations` | Fallback: исходник кодируется в base64 data URL и передается в `prompt` |

**Логирование экспериментов:** `provider.ts` пишет полный raw request и response в `data/logs/provider_YYYY-MM-DD.log` для отладки при работе с провайдерами без документации.

### Пресеты ретуши (`retouch_strength`)
Скрываем низкоуровневый параметр `strength` (0..1) за понятными пресетами в Inspector:

| Пресет | `strength` | Применение |
|---|---|---|
| Мягкая | `0.3` | Цветокоррекция, убрать шум, незначительные дефекты |
| Средняя | `0.6` | Убрать ржавчину/грязь, изменить освещение |
| Сильная | `0.9` | Полное изменение фона, атмосферы, стиля |

---

## 6. Пайплайн обработки (Batch Controller)

### Логика очереди
- Строго **последовательная** обработка (не Promise.all) — защита от 429 Rate Limit провайдера
- Один файл → Pre-process → API Call → Post-process → Save → следующий файл
- **Exponential Backoff:** При 429 или 5xx — ретрай через 1с, 2с, 4с. Максимум 3 попытки. При провале — помечаем файл как `failed` в registry и продолжаем очередь
- **Cancellation:** Фронт может прислать `DELETE /api/batch/:id` для прерывания текущей задачи

### Sharp Pre-processing (до отправки в API)
- Чтение файла через `sharp(absolutePath)`
- Получение метаданных (`sharp.metadata()`)
- Если `width > maxDimension` или `height > maxDimension` → `sharp.resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })`
- Конвертация в JPEG перед отправкой (большинство Image API принимают JPEG)
- Передача буфера напрямую в `multipart/form-data` (без записи на диск)

### Sharp Post-processing (после получения ответа API)
- Декодирование base64 из `response.data[0].b64_json` → `Buffer.from(b64, 'base64')`
- Передача буфера в `sharp(buffer)`
- Конвертация в выбранный формат: `.webp({quality: 85})` / `.jpeg({quality: 90})` / `.png()`
- Сохранение в целевую папку (по умолчанию подпапка `processed/`):
  - Подпапка: `<source_dir>/processed/<original_name>.<ext>`
  - Суффикс: `<source_dir>/<original_name>_retouched.<ext>`

---

## 7. Движок промптов (Prompt Compiler)

### Архитектура: Library + Blueprints

**`data/snippets.json`** — Атомарные части промптов (Словарь):
```json
{
  "piles": {
    "screw_108": "Steel screw pile, 108mm diameter, wide single helical blade, sharp conical tip..."
  },
  "environments": {
    "winter_construction": "Outdoor winter construction site, snow-covered ground..."
  },
  "lighting": {
    "studio_soft": "Soft studio lighting, diffused key light from 45 degrees..."
  }
}
```

**`data/blueprints/*.json`** — Шаблоны с Handlebars-тегами:
```json
{
  "title": "Промо зима — Свая 108",
  "subject": "{{ piles.screw_108 }}",
  "environment": "{{ environments.winter_construction }}",
  "lighting": "{{ lighting.studio_soft }}",
  "camera": "Macro close-up on helical blade, low angle, 16:9",
  "negative_prompt": "blur, noise, rust, dirt",
  "params": {
    "size": "1536x1024",
    "quality": "low",
    "model": "gemini-3-pro-image"
  }
}
```

### Компиляция
1. Загрузить `snippets.json` как контекст Handlebars
2. Прочитать Blueprint-файл как строку
3. `Handlebars.compile(blueprintString)(snippetsContext)` → готовый JSON-текст
4. `JSON.parse()` → объект
5. Сформировать payload для конкретного API провайдера
6. **В registry.json сохранять ТОЛЬКО скомпилированный snapshot** (без ссылок на словарь)

---

## 8. Реестр изображений (registry.json)

Единый SSOT для всех обработанных изображений. Инкрементальная нумерация.
Записи группируются по `session_id` для отображения истории по сессиям.

```json
[
  {
    "id": 1,
    "session_id": "2026-05-10T18:00:00Z",
    "type": "retouch",
    "source_file": "C:/Photos/svaya_001.jpg",
    "result_file": "data/media/0001_svaya_001_retouched.webp",
    "blueprint_id": "promo_winter",
    "prompt_snapshot": "Steel screw pile, 108mm diameter...",
    "provider_id": "vsellm",
    "model": "gemini-3-pro-image",
    "retouch_strategy": "edit",
    "retouch_preset": "medium",
    "params": { "size": "1536x1024", "quality": "low" },
    "status": "success",
    "created_at": "2026-05-10T18:05:00Z"
  }
]
```

### Статусы записей
| Статус | Описание |
|---|---|
| `success` | Успешно обработан, файл сохранён |
| `failed` | API вернул ошибку после всех ретраев |
| `rejected` | Пользователь отметил результат как неудачный (файл не удаляется) |

### Сессии в UI
- Сессия стартует при каждом запуске batch-задачи
- `session_id` = ISO timestamp старта задачи
- UI истории группирует записи по `session_id`, показывает дату, кол-во обработанных/упавших

---

## 9. UI Layout (FullHD, Dark Theme)

### App Shell (50px Top Bar)
- Слева: Tabs `[Ретушь] [Генерация] [Библиотека]`
- Справа: `● Local :3000` + `⚙ API Keys`

### Режим «Ретушь» (3 колонки)
| Зона | Ширина | Содержимое |
|---|---|---|
| Source Explorer | 300px | Кнопка выбора папки, фильтр, список файлов с чекбоксами, миниатюры |
| Workspace | ~1200px | Grid mode (выбранные фото) или Review mode (Before/After Side-by-Side) |
| Inspector | 400px | Выбор Blueprint, Monaco Editor, пресет ретуши, Export Settings, ProgressBar, START BATCH |

### Режим «Генерация»
| Зона | Содержимое |
|---|---|
| Левая колонка | История генераций (хронологический список миниатюр) |
| Центр | Одиночное изображение результата |
| Правая колонка | Промпт, размер, quality, модель, провайдер |

### Режим «Библиотека»
- Split View: список файлов `blueprints/` + Monaco Editor для сырого JSON

### Before/After (Review Mode)
- **Side-by-Side** (два изображения рядом, 50/50)
- Шторка-слайдер не используется — размеры оригинала и результата могут отличаться

### Горячие клавиши
| Клавиша | Действие |
|---|---|
| `Ctrl+Enter` | Запустить Batch |
| `Space` | Полноэкранный просмотр |
| `←` / `→` | Переключение картинок |
| `Ctrl+S` | Сохранить Blueprint |
| `1` / `2` / `3` | Переключение режимов (Top Bar вкладки) |
| `Del` | Пометить результат как `rejected` (с подтверждением) |

---

## 10. Безопасность

- API-ключи хранятся в `data/config.json` plain text (машина пользователя, без сети)
- Express слушает строго `127.0.0.1` — недоступен из сети
- Роут `/api/image?path=...` — только `GET`, только расширения `.jpg/.jpeg/.png/.webp/.gif`
- Нет авторизации (утилита — однопользовательская, локальная)

---

## 11. Сборка и Дистрибуция

### Процесс сборки (скрипт `scripts/build-sea.js`)
1. `vite build` → `backend/public/`
2. `esbuild backend/src/index.ts --bundle --platform=node --outfile=dist/bundle.js`
3. Создать `sea-config.json` (Node.js SEA конфиг)
4. `node --experimental-sea-config sea-config.json` → blob
5. Инжект blob в копию `node.exe`
6. Патч PE-заголовков для скрытия консоли
7. Скопировать `app.exe` + `public/` + стартовые `data/` → `release/`
8. Запаковать в ZIP

### Целевая платформа
- Windows 10 / 11 (x64)
- macOS и Linux — не поддерживаются в v1 (нативный PowerShell dialog, Windows-specific)

---

## 12. TODO / Roadmap

### v1 (MVP — текущий спринт)
- [ ] Backend: Bootstrap (index.ts, порт, open browser)
- [ ] Backend: routes/files.ts (select-folder, scan, image serve)
- [ ] Backend: services/sharp-processor.ts
- [ ] Backend: services/batch-controller.ts
- [ ] Backend: services/compiler.ts (Handlebars)
- [ ] Backend: services/provider.ts (openai SDK, multi-provider, dual strategy)
- [ ] Frontend: Layout (App Shell, 3 колонки)
- [ ] Frontend: SourceExplorer.vue
- [ ] Frontend: Inspector.vue + Monaco Editor + пресеты ретуши
- [ ] Frontend: ReviewCompare.vue (Before/After Side-by-Side)
- [ ] Frontend: ProgressBar + SSE-стриминг прогресса
- [ ] Frontend: История сессий (registry.json viewer)
- [ ] Build: SEA-скрипт упаковки

### v2 (Будущие версии)
- [ ] Визуальный конструктор промптов (Node-based UI / Slots)
- [ ] fsnotify: авто-обновление галереи при изменении файлов вне приложения
- [ ] История с поиском и фильтрацией по тегам
- [ ] Версионирование Blueprints (diff между версиями промпта)

---

## 13. Договорённости и решения (Changelog)

| Дата | Решение | Обоснование |
|---|---|---|
| 2026-05-10 | Отказ от Electron | ~350Мб, проблемы со сборкой на Windows |
| 2026-05-10 | Отказ от Wails (Go) | Context switching Go↔TS замедляет разработку |
| 2026-05-10 | Node.js + Express + Браузер | Быстрая разработка, знакомый стек, portable |
| 2026-05-10 | File-based JSON (без БД) | Прозрачность, портируемость, простота бэкапа |
| 2026-05-10 | Library + Blueprints (Handlebars) | DRY для сложных промптов, без оверинжиниринга |
| 2026-05-10 | Monaco Editor вместо visual form | Скорость разработки, Code-first подход в v1 |
| 2026-05-10 | Tailwind v4 | CSS-first, без конфигов, офлайн-дружелюбен |
| 2026-05-10 | Sequential batch (не parallel) | Защита от 429 Rate Limit у провайдеров |
| 2026-05-10 | Sharp для pre/post-processing | Надежная работа с буферами, конвертация без диска |
| 2026-05-10 | openai SDK с переопределённым baseURL | Один клиент для всех OpenAI-совместимых провайдеров |
| 2026-05-10 | response_format: b64_json | Синхронный ответ, подтверждён тестом на vsellm.ru |
| 2026-05-10 | retouch_strategy в config.json | Переключение edit/generate без перекомпиляции — для работы с провайдерами без документации |
| 2026-05-10 | Пресеты ретуши вместо raw strength | Понятный UX, strength маппируется внутри provider.ts |
| 2026-05-10 | session_id в registry.json | Группировка истории по сессиям, отслеживание использования |
| 2026-05-10 | Статус rejected (не удаление) | Файлы остаются на диске, пользователь управляет ими сам |
| 2026-05-10 | Side-by-Side вместо шторки | Размеры оригинала и результата могут отличаться |
| 2026-05-10 | Output по умолчанию в подпапку processed/ | Не засоряет исходную папку |
