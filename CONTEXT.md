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
- ❌ Base64 для передачи изображений (только пути к файлам и multipart/form-data)
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
    ├── config.json          # API-ключи, настройки UI (порт, тема, модель по умолчанию)
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
│   │   │   └── provider.ts  # HTTP-клиент к Image API (с timeout, retry)
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
│   │   │   ├── ReviewCompare.vue   # Центр: Before/After шторка
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

## 5. Пайплайн обработки (Batch Controller)

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
- Получение буфера из ответа API
- Конвертация в выбранный формат: `.webp({quality: 85})` / `.jpeg({quality: 90})` / `.png()`
- Сохранение в целевую папку:
  - Подпапка: `<source_dir>/processed/<original_name>.<ext>`
  - Суффикс: `<source_dir>/<original_name>_retouched.<ext>`

---

## 6. Движок промптов (Prompt Compiler)

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
    "cfg_scale": 7,
    "steps": 30,
    "width": 1536,
    "height": 864
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

## 7. Реестр изображений (registry.json)

Единый SSOT для всех обработанных изображений. Инкрементальная нумерация.

```json
[
  {
    "id": 1,
    "type": "retouch",
    "source_file": "C:/Photos/svaya_001.jpg",
    "result_file": "data/media/0001_svaya_001_retouched.webp",
    "blueprint_id": "promo_winter",
    "prompt_snapshot": "Steel screw pile, 108mm diameter...",
    "model": "provider-model-v1",
    "params": { "cfg_scale": 7, "steps": 30 },
    "status": "success",
    "created_at": "2026-05-10T18:00:00Z"
  }
]
```

---

## 8. UI Layout (FullHD, Dark Theme)

### App Shell (50px Top Bar)
- Слева: Tabs `[Ретушь] [Генерация] [Библиотека]`
- Справа: `● Local :3000` + `⚙ API Keys`

### Режим «Ретушь» (3 колонки)
| Зона | Ширина | Содержимое |
|---|---|---|
| Source Explorer | 300px | Кнопка выбора папки, фильтр, список файлов с чекбоксами, миниатюры |
| Workspace | ~1200px | Grid mode (выбранные фото) или Review mode (Before/After шторка) |
| Inspector | 400px | Выбор Blueprint, Monaco Editor, Export Settings, ProgressBar, START BATCH |

### Режим «Генерация»
| Зона | Содержимое |
|---|---|
| Левая колонка | История генераций (хронологический список миниатюр) |
| Центр | Одиночное изображение результата |
| Правая колонка | Промпт, Aspect Ratio, Seed, Steps, модель |

### Режим «Библиотека»
- Split View: список файлов `blueprints/` + Monaco Editor для сырого JSON

### Горячие клавиши
| Клавиша | Действие |
|---|---|
| `Ctrl+Enter` | Запустить Batch |
| `Space` | Полноэкранный просмотр |
| `←` / `→` | Переключение картинок |
| `Ctrl+S` | Сохранить Blueprint |
| `1` / `2` / `3` | Переключение режимов (Top Bar вкладки) |
| `Del` | Удалить выбранный результат из Галереи (с подтверждением) |

---

## 9. Безопасность

- API-ключи хранятся в `data/config.json` plain text (машина пользователя, без сети)
- Express слушает строго `127.0.0.1` — недоступен из сети
- Роут `/api/image?path=...` — только `GET`, только расширения `.jpg/.jpeg/.png/.webp/.gif`
- Нет авторизации (утилита — однопользовательская, локальная)

---

## 10. Сборка и Дистрибуция

### Процесс сборки (скрипт `scripts/build-sea.js`)
1. `vite build` → `backend/public/`
2. `esbuild backend/src/index.ts --bundle --platform=node --outfile=dist/bundle.js`
3. Создать `sea-config.json` (Node.js SEA конфиг)
4. `node --experimental-sea-config sea-config.json` → blob
5. Инжект blob в копию `node.exe`
6. Подписать / патч PE-заголовки для скрытия консоли
7. Скопировать `app.exe` + `public/` + стартовые `data/` → `release/`
8. Запаковать в ZIP

### Целевая платформа
- Windows 10 / 11 (x64)
- macOS и Linux — не поддерживаются в v1 (нативный PowerShell dialog, Windows-specific)

---

## 11. TODO / Roadmap

### v1 (MVP — текущий спринт)
- [ ] Backend: Bootstrap (index.ts, порт, open browser)
- [ ] Backend: routes/files.ts (select-folder, scan, image serve)
- [ ] Backend: services/sharp-processor.ts
- [ ] Backend: services/batch-controller.ts
- [ ] Backend: services/compiler.ts (Handlebars)
- [ ] Backend: services/provider.ts (HTTP-клиент к Image API)
- [ ] Frontend: Layout (App Shell, 3 колонки)
- [ ] Frontend: SourceExplorer.vue
- [ ] Frontend: Inspector.vue + Monaco Editor
- [ ] Frontend: ReviewCompare.vue (Before/After)
- [ ] Frontend: ProgressBar + SSE-стриминг прогресса
- [ ] Build: SEA-скрипт упаковки

### v2 (Будущие версии)
- [ ] Визуальный конструктор промптов (Node-based UI / Slots)
- [ ] Поддержка нескольких провайдеров Image API
- [ ] fsnotify: авто-обновление галереи при изменении файлов вне приложения
- [ ] История с поиском и фильтрацией по тегам
- [ ] Версионирование Blueprints (diff между версиями промпта)

---

## 12. Договорённости и решения (Changelog)

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
