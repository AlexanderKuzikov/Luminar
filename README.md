# Luminar

> **Local-first batch image retouching and generation tool powered by AI Image APIs.**

Luminar — профессиональная локальная утилита для Windows 10/11, предназначенная для пакетной ретуши и генерации изображений через внешние Image API (Img2Img, InstructPix2Pix, Text-to-Image). Работает офлайн (за исключением запросов к API нейросети). Не требует установки Node.js у конечного пользователя.

---

## ✨ Основные возможности

- **Batch Img2Img (главный режим):** Выберите папку, отметьте нужные фотографии, примените промпт — утилита обработает все файлы по очереди
- **Text-to-Image:** Генерация изображений с нуля по структурированным промптам
- **Blueprint System:** Система шаблонов промптов на базе Handlebars (Library + Blueprints) с поддержкой атомарных словарей (сниппетов)
- **Monaco Editor:** Встроенный редактор кода для работы с JSON-промптами
- **Before/After Review:** Сравнение оригиналов и результатов через шторку или Side-by-Side
- **Flexible Export:** Выбор формата (WebP, JPEG, PNG), ресайз, путь сохранения (подпапка или префикс)
- **BYOK:** Каждый пользователь работает со своим API-ключом
- **Offline-first:** Все зависимости хранятся локально, никаких CDN
- **Portable:** Работает из папки без установки

---

## 🖥️ Системные требования


| Параметр | Требование                                |
| -------- | ----------------------------------------- |
| ОС       | Windows 10 / Windows 11                   |
| Экран    | FullHD (1920×1080) и выше (рекомендуется) |
| Браузер  | Любой современный (Chrome, Edge, Firefox) |
| Интернет | Только для запросов к Image API           |


---

## 🗂️ Структура релиза (Portable)

```
Luminar/
├── app.exe                  # Скомпилированный Node.js сервер
├── public/                  # Сбилженный фронтенд (Vue 3 + Tailwind)
└── data/                    # Контент и стейт (Portable директория)
    ├── config.json          # API-ключи и настройки приложения
    ├── snippets.json        # Словарь атомарных частей промптов
    ├── blueprints/          # Шаблоны промптов (.json)
    │   └── example.json
    ├── media/               # Результаты обработки (WebP/JPG)
    │   └── registry.json    # SSOT реестр всех обработанных изображений
    └── logs/                # Логи выполнения
```

---

## 🚀 Быстрый старт (для пользователя)

1. Скачайте архив с последнего [Release](https://github.com/AlexanderKuzikov/Luminar/releases)
2. Распакуйте в любую папку
3. Запустите `app.exe`
4. В открывшемся браузере перейдите в **Настройки** и введите API-ключ вашего провайдера
5. Выберите папку с изображениями и начните обработку

---

## 🛠️ Разработка

### Требования

- Node.js v24 LTS
- npm v10+

### Установка зависимостей

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Режим разработки

```bash
# Запустить backend (с hot-reload через tsx watch)
cd backend && npm run dev

# Запустить frontend (Vite dev server с проксированием к backend)
cd frontend && npm run dev
```

Frontend будет доступен на `http://localhost:5173`, все `/api` запросы проксируются на `http://localhost:3000`.

### Production сборка

```bash
# 1. Собрать фронтенд
cd frontend && npm run build
# Статика выводится в ../backend/public/

# 2. Собрать бэкенд в единый bundle
cd backend && npm run build
# Результат: backend/dist/bundle.js

# 3. Упаковать в SEA (Single Executable Application)
npm run sea
# Результат: release/app.exe
```

---

## 🏗️ Технологический стек

### Backend


| Технология | Версия  | Назначение                       |
| ---------- | ------- | -------------------------------- |
| Node.js    | v24 LTS | Runtime                          |
| Express.js | ^4.x    | HTTP-сервер и API-роуты          |
| sharp      | ^0.33.x | Pre/Post-processing картинок     |
| Handlebars | ^4.x    | Шаблонизатор промптов (Compiler) |
| esbuild    | ^0.21.x | Сборка backend в единый bundle   |


### Frontend


| Технология                | Версия | Назначение                       |
| ------------------------- | ------ | -------------------------------- |
| Vue 3                     | ^3.x   | UI-фреймворк (Composition API)   |
| Vite                      | ^5.x   | Dev-server и сборщик             |
| Tailwind CSS              | v4     | CSS-first стилизация             |
| shadcn-vue                | latest | UI-компоненты                    |
| lucide-vue-next           | latest | Inline SVG иконки (без CDN)      |
| Monaco Editor             | latest | Встроенный редактор кода         |
| vite-plugin-monaco-editor | latest | Локальная сборка воркеров Monaco |


---

## 🔄 Архитектура пайплайна (Batch Processing)

```
Пользователь выбирает папку (PowerShell Native Dialog)
         ↓
Express сканирует папку → возвращает список файлов
         ↓
Пользователь выбирает файлы + Blueprint + настройки экспорта
         ↓
           Batch Controller (Node.js очередь, sequential)
         ↓
Sharp Pre-processing → Downscale если > лимита API
         ↓
HTTP Request → Image API провайдера (multipart/form-data)
         ↓
Sharp Post-processing → конвертация в WebP/JPG/PNG
         ↓
Сохранение на диск + запись в data/media/registry.json
         ↓
SSE-событие → Vue обновляет прогресс-бар и галерею
```

---

## 📐 UI Layout (FullHD, Dark Theme)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Ретушь] [Генерация] [Библиотека]        ● Local :3000  ⚙ Keys │
├──────────────┬──────────────────────────────┬───────────────────┤
│              │                              │  Blueprint:       │
│ 📁 /photos   │                              │  [dropdown]       │
│              │   Before │ After             │                   │
│ ☑ img_001   │   (шторка/side-by-side)       │  Monaco Editor    │
│ ☑ img_002   │                              │  (промпт)         │
│ ☐ img_003   │                              │                   │
│ ☑ img_004   │                              │  Format: W J P    │
│              │                              │  Max: 1536px      │
│              │                              │  Output: /proc    │
│              │                              │                   │
│ [Выбор папки]│                              │ ██████░░ 6/10     │
│              │                              │ [START BATCH ▶]   │
└──────────────┴──────────────────────────────┴───────────────────┘
  300px                ~1200px                       400px
```

---

## 📁 Blueprint System (Система промптов)

Каждый промпт — это JSON-файл с поддержкой шаблонизации через Handlebars:

`**data/snippets.json**` — Словарь атомарных частей:

```json
{
  "piles": {
    "screw_108": "Steel screw pile, 108mm diameter, wide single helical blade..."
  },
  "lighting": {
    "studio_soft": "Soft studio lighting, diffused, no harsh shadows..."
  }
}
```

`**data/blueprints/promo_winter.json**` — Шаблон:

```json
{
  "title": "Промо зима",
  "subject": "{{ piles.screw_108 }}",
  "lighting": "{{ lighting.studio_soft }}",
  "camera": "Macro close-up, sharp focus on helical blade, 16:9",
  "negative_prompt": "blur, noise, dirty, rust",
  "params": {
    "cfg_scale": 7,
    "steps": 30
  }
}
```

При запуске генерации **Compiler** на бэкенде мержит словарь и Blueprint, создавая итоговый payload для API. В `registry.json` сохраняется всегда готовый snapshot скомпилированного промпта.

---

## 🔒 Безопасность

- API-ключи хранятся в `data/config.json` (локально, без шифрования — файл лежит на машине пользователя)
- Сервер доступен строго на `127.0.0.1` (localhost), не на `0.0.0.0`
- Роут `/api/image?path=...` для раздачи локальных файлов — только для `GET`, только для изображений

---

## 📋 Горячие клавиши


| Клавиша         | Действие                      |
| --------------- | ----------------------------- |
| `Ctrl+Enter`    | Запустить Batch               |
| `Space`         | Полноэкранный просмотр        |
| `←` / `→`       | Переключение между картинками |
| `Ctrl+S`        | Сохранить Blueprint           |
| `1` / `2` / `3` | Переключение режимов          |


---

## 📄 Лицензия

[Apache-2.0](./LICENSE)