# SEO Article AI

Веб-приложение для подготовки SEO-статей с помощью ИИ. Пользователь задает тему и источники,
система анализирует поисковую выдачу и страницы конкурентов, предлагает структуру H1-H3,
генерирует статью через OpenAI, а затем помогает довести текст до публикации:
редактор, SEO-оценка, AI-правка абзацев и экспорт в HTML, Markdown или TXT.

Репозиторий состоит из двух приложений:

| Часть | Что это | Подробнее |
| --- | --- | --- |
| [back/](back/) | REST API на Spring Boot: анализ, генерация, SEO, экспорт | [back/README.md](back/README.md), [PLAN.md](back/PLAN.md) |
| [front/](front/) | Интерфейс на Next.js | [front/README.md](front/README.md) |

Контракт API: [back/docs/openapi.yaml](back/docs/openapi.yaml), HTML-версия: [back/docs/openapi.html](back/docs/openapi.html).

> **Важно.** Базы данных нет: статьи и извлеченный текст файлов хранятся в памяти backend
> и пропадают после перезапуска. Пользователей, аутентификации и публикации в CMS тоже нет.

## Стек

**Backend**

- Java 21+ (образ Docker собирается на JDK 25), Spring Boot 4.0, Maven Wrapper (`mvnw`)
- `openai-java`: Responses API, structured outputs, встроенный инструмент `web_search`
- Jsoup: загрузка и разбор страниц конкурентов, очистка HTML по белому списку
- Apache PDFBox и Apache POI: извлечение текста из PDF и DOCX
- springdoc-openapi: Swagger UI
- JUnit 5, MockMvc, Mockito

**Frontend**

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, dnd-kit (перетаскивание разделов структуры), Phosphor Icons

**Инфраструктура**

- Docker, Docker Compose

## Возможности

- **Исходные данные.** Тема, требования, свой план, ссылки и файлы (PDF, DOCX, TXT до 20 МБ).
  Текст из файлов извлекается сразу при загрузке.
- **Анализ выдачи в фоне, в 5 этапов.** Веб-поиск OpenAI собирает до 10 результатов, Jsoup загружает
  страницы, LLM определяет поисковый интент, подбирает ключевые запросы, оценивает конкурентов
  и составляет структуру статьи с оценкой объема. Интерфейс показывает текущий этап.
- **Редактор структуры.** Заголовки H2/H3 можно менять, удалять и перетаскивать.
- **Генерация в два прохода.** Первый проход пишет черновик по структуре и материалам, второй
  (редактор) сверяет факты с источниками и убирает шаблонные обороты. Генерация синхронная
  и занимает 30-90 секунд.
- **Редактор статьи** с автосохранением, оглавлением и предпросмотром сниппета в поиске.
- **SEO-оценка без LLM, 0-100 баллов.** 8 проверок: интент, ключ в H1, ключ во введении,
  плотность ключей, объем, заголовки, длина meta description, внутренние ссылки.
- **AI-правка отдельного абзаца** и повторная генерация статьи.
- **Экспорт** в HTML, Markdown и TXT.
- **Список статей.**

## Установка

Нужно:

- для запуска в Docker: Docker с Compose v2;
- для запуска без Docker: JDK 21+ и Node.js (в Docker-образе используется Node 24). Maven ставить не нужно;
- в обоих случаях: ключ OpenAI API.

```bash
git clone <url-репозитория>
cd <папка-репозитория>
cp .env.example .env      # затем впишите OPENAI_API_KEY
```

## Запуск

### Docker (рекомендуется)

```bash
docker compose up --build
```

| Адрес | Что там |
| --- | --- |
| http://localhost:3000 | приложение |
| http://localhost:8080/swagger-ui.html | Swagger UI backend |

Браузер обращается только к frontend. Запросы `/api/*` Next.js проксирует в контейнер backend,
поэтому настраивать CORS не нужно. Frontend стартует только после того, как backend начнет принимать
соединения.

### Без Docker

Сначала backend, в отдельном терминале:

```bash
cd back
export OPENAI_API_KEY=sk-...
./mvnw spring-boot:run          # http://localhost:8080
```

В Windows PowerShell:

```powershell
cd back
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"   # если JDK не прописан в PATH
$env:OPENAI_API_KEY = "sk-..."
.\mvnw.cmd spring-boot:run
```

Затем frontend:

```bash
cd front
cp .env.example .env.local      # по желанию: значения по умолчанию подходят для локального запуска
npm install
npm run dev                     # http://localhost:3000
```

Production-сборка:

```bash
cd back  && ./mvnw package && java -jar target/seo-article-ai-0.1.0.jar
cd front && npm run build && npm start
```

## Тесты

Backend:

```bash
cd back
./mvnw test        # Windows: .\mvnw.cmd test
```

Ключ OpenAI для тестов не нужен: клиент OpenAI в них подменяется заглушкой. Что покрыто:

| Тест | Что проверяет |
| --- | --- |
| `ArticleFlowTest` | весь сценарий через MockMvc, ошибки анализа и генерации, валидация входных данных |
| `SeoAnalyzerTest` | SEO-проверки и итоговая оценка |
| `TextToolsTest` | транслитерация slug, подсчет слов, поиск ключа в разных словоформах |
| `ExportServiceTest` | экспорт в HTML, Markdown и TXT |
| `SourceTest` | разбор страниц, отказ для приватных и не-HTTP адресов, извлечение текста из TXT (UTF-8 и Windows-1251) и DOCX |
| `SearchClientTest` | отбор URL из результатов веб-поиска, лимит результатов |
| `SchemaTest` | JSON-схемы для structured outputs |

Frontend: автотестов нет, есть только проверка типов.

```bash
cd front
npm run typecheck
```

## Структура проекта

```
.
├── docker-compose.yml        запуск backend и frontend вместе
├── .env.example              шаблон переменных для Docker Compose
├── back/                     Spring Boot backend
│   ├── docs/                 openapi.yaml (контракт API), openapi.html, build-html.sh
│   ├── PLAN.md               границы версии, сценарий работы, риски
│   ├── src/main/java/ru/seoai/
│   │   ├── api/              REST-контроллеры и DTO
│   │   ├── article/          модель статьи, in-memory хранилище, проверка структуры, очистка HTML
│   │   ├── research/         анализ выдачи: веб-поиск, промпты, фоновый пайплайн
│   │   ├── generation/       генерация, редактура, правка абзацев
│   │   ├── seo/              SEO-анализ, slug, статистика текста
│   │   ├── source/           загрузка файлов, извлечение текста, загрузка страниц
│   │   ├── export/           экспорт в HTML, Markdown, TXT
│   │   ├── ai/               интерфейс AiClient и реализация на OpenAI SDK
│   │   ├── config/           настройки приложения, CORS, пул фоновых задач
│   │   └── common/           обработка ошибок (Problem Details)
│   ├── src/main/resources/application.yml
│   └── src/test/             тесты JUnit
└── front/                    Next.js frontend
    ├── app/                  маршруты: /articles, /articles/new, /articles/[id]/research, /articles/[id]/editor
    ├── components/           article, research, editor, seo, publication, layout, ui
    ├── lib/                  api.ts (клиент REST API), types.ts (типы по openapi.yaml), constants.ts, export.ts
    └── next.config.ts        прокси /api/* на backend, таймаут прокси, лимит размера тела запроса
```

## Переменные окружения

### Корневой `.env` (Docker Compose)

| Переменная | Обязательна | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | да | — | Ключ OpenAI. Без него backend запустится, но анализ и генерация будут возвращать ошибку |
| `OPENAI_MODEL` | нет | `gpt-5-mini` | Модель для анализа, генерации и правки абзацев |
| `OPENAI_SEARCH_MODEL` | нет | значение `OPENAI_MODEL` | Модель для веб-поиска по выдаче |
| `OPENAI_BASE_URL` | нет | `https://api.openai.com/v1` | Адрес API, если запросы идут через прокси-шлюз |
| `SITE_DOMAIN` | нет | `example.ru` | Домен в предпросмотре сниппета. Подставляется при сборке frontend, после изменения нужен `docker compose up --build` |

### Backend (при запуске без Docker)

Те же `OPENAI_*`, а также:

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешенные адреса frontend, через запятую. Нужно только при обращении к API напрямую, в обход прокси |
| `PORT` | `8080` | Порт сервера |

Остальные настройки лежат в [application.yml](back/src/main/resources/application.yml), в секции `app`:
число результатов выдачи, таймауты, объем текста страницы в промпте.

### Frontend (`front/.env.local`, см. [front/.env.example](front/.env.example))

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `BACKEND_URL` | `http://localhost:8080` | Куда проксировать `/api/*`. Читается при сборке и при старте dev-сервера |
| `NEXT_PUBLIC_SITE_DOMAIN` | `example.ru` | Домен в предпросмотре сниппета |
| `NEXT_PUBLIC_API_URL` | `/api` | Прямой адрес API, если нужно обращаться к backend в обход прокси Next.js |

Файлы `.env` и `.env.local` в git не попадают.

## Частые проблемы

- **Генерация долго идет.** Это нормально: 30-90 секунд. Таймаут прокси Next.js увеличен до 5 минут.
- **Часть конкурентов без текста.** Некоторые сайты блокируют загрузку страниц. Такие страницы
  пропускаются, анализ продолжается по заголовку и сниппету из поиска.
- **curl в Windows возвращает 400 на JSON с кириллицей.** Передавайте тело запроса из файла в UTF-8:
  `curl --data-binary @body.json ...`.
