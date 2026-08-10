<p align="center">
  <a href="https://nodejs.org/"><img alt="Node 24" src="https://img.shields.io/badge/Node-24_LTS-339933?logo=node.js&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white"></a>
  <a href="https://vuejs.org/"><img alt="Vue 3" src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vuedotjs&logoColor=white"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg"></a>
</p>

<h1 align="center">Luminar</h1>
<p align="center">Локальный инструмент для пакетного AI-ретуша и генерации изображений</p>

---

Desktop-first утилита для Windows 10/11. Пакетная обработка изображений через любые OpenAI-совместимые Image API. Blueprint-система промптов на Handlebars, multi-provider, before/after review.

- **Batch Img2Img** — папка → промпт → пакетная обработка
- **Text-to-Image** — генерация с нуля по структурированным промптам
- **Blueprint System** — Handlebars-шаблоны + атомарные словари (snippets)
- **Multi-Provider** — несколько OpenAI-compatible API одновременно
- **Monaco Editor** — встроенный редактор JSON-промптов
- **Before/After** — шторка или side-by-side сравнение
- **Offline-first** — все зависимости локально, без CDN
- **BYOK** — свои API-ключи через .env

## Быстрый старт

```bash
git clone https://github.com/AlexanderKuzikov/Luminar.git
cd Luminar
npm run install:all
cp .env.example .env   # API keys

npm run dev            # backend + frontend параллельно
```

## Документация

- [`docs/CONTEXT.md`](docs/CONTEXT.md) — состояние проекта
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — архитектурные решения

## Статус

**v1.0.0** — backend и frontend написаны, dev mode работает. Нет тестов, нет SEA build.

## Лицензия

[Apache-2.0](LICENSE) © Alexander Kuzikov
