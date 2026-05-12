# Luminar

![Node.js](https://img.shields.io/badge/Node.js-v24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-D22128?style=flat-square&logo=apache&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-0078D4?style=flat-square&logo=windows&logoColor=white)

> **Local-first batch image retouching and generation tool powered by AI Image APIs.**

Luminar — профессиональная локальная утилита для Windows 10/11, предназначенная для пакетной ретуши и генерации изображений через внешние Image API (Img2Img, InstructPix2Pix, Text-to-Image). Работает офлайн (за исключением запросов к API нейросети).

---

## ✨ Основные возможности

- **Batch Img2Img (главный режим):** Выберите папку, отметьте нужные фотографии, примените промпт — утилита обработает все файлы по очереди
- **Text-to-Image:** Генерация изображений с нуля по структурированным промптам
- **Blueprint System:** Система шаблонов промптов на базе Handlebars с поддержкой атомарных словарей (сниппетов)
- **Multi-Provider:** Любой OpenAI-совместимый Image API, несколько провайдеров и ключей одновременно
- **Monaco Editor:** Встроенный редактор кода для работы с JSON-промптами
- **Before/After Review:** Сравнение оригиналов и результатов через шторку или Side-by-Side
- **Flexible Export:** Выбор формата (WebP, JPEG, PNG), ресайз, путь сохранения
- **BYOK:** Каждый пользователь работает со своими API-ключами через `.env`
- **Offline-first:** Все зависимости хранятся локально, никаких CDN
- **Portable:** Работает из папки без установки

---

## 🖥️ Системные требования

| Параметр | Требование |
|---|---|
| ОС | Windows 10 / Windows 11 |
| Экран | FullHD (1920×1080) и выше (рекомендуется) |
| Браузер | Любой современный (Chrome, Edge, Firefox) |
| Интернет | Только для запросов к Image API |

---

## 🗂️ Структура релиза (Portable)

```
Luminar/
├── app.exe                  # Скомпилированный Node.js сервер
├── config.json              # Настройки: порт, провайдеры, UI (без ключей!)
├── .env                     # API-ключи (создать вручную из .env.example)
├── .env.example             # Шаблон переменных окружения
├── public/                  # Сбилженный фронтенд (Vue 3 + Tailwind)
└── data/                    # Контент и стейт
    ├── snippets.json        # Словарь атомарных частей промптов
    ├── blueprints/          # Шаблоны промптов (.json)
    ├── media/               # Результаты обработки
    │   └── registry.json    # SSOT реестр всех обработанных изображений
    └── logs/                # Логи выполнения
```

---

## 🚀 Быстрый старт (для пользователя)

1. Скачайте архив с последнего [Release](https://github.com/AlexanderKuzikov/Luminar/releases)
2. Распакуйте в любую папку
3. Скопируйте `.env.example` → `.env`, заполните API-ключ
4. Запустите `app.exe`
5. В открывшемся браузере выберите провайдер и ключ через **Настройки**
6. Выберите папку с изображениями и начните обработку

---

## ⚙️ Конфигурация

### config.json

Лежит в корне рядом с `app.exe`. Редактируется напрямую или через UI.

```json
{
  "port": 3333,
  "active_provider": "VSELLM",
  "ui": { "theme": "dark", "default_output": "subfolder" },
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

### .env

Реальные значения API-ключей. Формат: `{PROVIDER_ID}_{KEY_ID}`.

```env
VSELLM_KEY_1=sk-your-key-here
# VSELLM_KEY_2=sk-backup-key
# OPENAI_KEY_1=sk-openai-key
```

### Порт

Приложение стартует на порту из `config.json` (по умолчанию `3333`). Если занят — автоматически пробует следующие порты (`3334`, `3335` ... до `3352`). Порт выводится в логе при запуске.

### Добавление провайдера

1. Добавить объект в `config.json → providers[]` с уникальным `id`
2. Добавить ключ в `.env`: `{PROVIDER_ID}_KEY_1=sk-...`
3. Переключить `active_provider` через UI или в `config.json`

---

## 🛠️ Разработка

### Требования

![Node.js](https://img.shields.io/badge/Node.js-v24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![npm](https://img.shields.io/badge/npm-v10+-CB3837?style=flat-square&logo=npm&logoColor=white)

### Установка зависимостей

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Режим разработки

```bash
# Backend (tsx watch, hot-reload)
cd backend && npm run dev

# Frontend (Vite dev server)
cd frontend && npm run dev
```

Frontend: `http://localhost:5173` — все `/api` запросы проксируются на backend.
Порт backend читается из корневого `config.json` (дефолт `3333`).

### Production сборка

```bash
# 1. Собрать фронтенд → ../backend/public/
cd frontend && npm run build

# 2. Собрать бэкенд в bundle
cd backend && npm run build

# 3. Упаковать в SEA (Single Executable Application)
npm run sea
# Результат: release/app.exe
```

---

## 🏗️ Технологический стек

### Backend

| Технология | Версия | Назначение |
|---|---|---|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | v24 LTS | Runtime |
| ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white) | ^4.x | HTTP-сервер и API-роуты |
| ![sharp](https://img.shields.io/badge/-sharp-99CC00?style=flat-square&logo=sharp&logoColor=white) | ^0.33.x | Pre/Post-processing картинок |
| ![Handlebars](https://img.shields.io/badge/-Handlebars-F0772B?style=flat-square&logo=handlebarsdotjs&logoColor=white) | ^4.x | Шаблонизатор промптов |
| ![esbuild](https://img.shields.io/badge/-esbuild-FFCF00?style=flat-square&logo=esbuild&logoColor=black) | ^0.21.x | Сборка backend в bundle |

### Frontend

| Технология | Версия | Назначение |
|---|---|---|
| ![Vue](https://img.shields.io/badge/-Vue_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white) | ^3.x | UI-фреймворк (Composition API) |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | ^5.x | Dev-server и сборщик |
| ![Tailwind CSS](https://img.shields.io/badge/-Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | v4 | CSS-first стилизация |
| ![Monaco](https://img.shields.io/badge/-Monaco_Editor-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white) | latest | Встроенный редактор кода |

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
HTTP Request → Image API провайдера (OpenAI SDK)
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
│ [Ретушь] [Генерация] [Библиотека]        ● Local :3333  ⚙ Keys │
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

## 📁 Blueprint System

Каждый промпт — JSON-файл с Handlebars-шаблонизацией.

**`data/snippets.json`** — атомарные части:

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

**`data/blueprints/promo_winter.json`** — шаблон:

```json
{
  "title": "Промо зима",
  "subject": "{{ piles.screw_108 }}",
  "lighting": "{{ lighting.studio_soft }}",
  "camera": "Macro close-up, sharp focus on helical blade, 16:9",
  "negative_prompt": "blur, noise, dirty, rust",
  "params": {
    "size": "1024x1024",
    "quality": "standard",
    "model": "gemini-3-pro-image"
  }
}
```

---

## 🔒 Безопасность

- **API-ключи** хранятся в `.env` (локально). В `config.json` — только имена переменных (`envVar`)
- **GET /api/config** возвращает только флаг `configured: bool` — никаких значений или масок ключей
- **PUT /api/config** принимает структуру (провайдер, active_key, порт, UI), значения ключей игнорируются
- Сервер слушает строго на `127.0.0.1` (localhost), не на `0.0.0.0`
- `/api/files/image?path=` — только GET, только для изображений

---

## 📋 Горячие клавиши

| Клавиша | Действие |
|---|---|
| `Ctrl+Enter` | Запустить Batch |
| `Space` | Полноэкранный просмотр |
| `←` / `→` | Переключение между картинками |
| `Ctrl+S` | Сохранить Blueprint |
| `1` / `2` / `3` | Переключение режимов |

---

## 📄 Лицензия

[Apache-2.0](./LICENSE)
