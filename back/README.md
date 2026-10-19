# SEO Article AI: backend

Бэкенд системы подготовки SEO-статей: анализ выдачи, структура, генерация, редактирование и экспорт.
Java 21+, Spring Boot 4, OpenAI Responses API. Данные хранятся в памяти процесса и теряются после перезапуска.

Контракт API: [docs/openapi.yaml](docs/openapi.yaml), HTML-версия: [docs/openapi.html](docs/openapi.html).
План и архитектура: [PLAN.md](PLAN.md).

## Запуск

Всю систему вместе с frontend проще поднять из корня репозитория: `docker compose up --build`.
Отдельно backend запускается так. Нужен JDK 21 или новее. Maven ставить не нужно, в проекте есть `mvnw`.

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.4.1"
$env:OPENAI_API_KEY = "sk-..."
.\mvnw.cmd spring-boot:run
```

Сервер стартует на http://localhost:8080. Swagger UI: http://localhost:8080/swagger-ui.html.

Сборка и тесты:

```powershell
.\mvnw.cmd test          # тесты, OpenAI в них не вызывается
.\mvnw.cmd package       # target/seo-article-ai-0.1.0.jar
java -jar target/seo-article-ai-0.1.0.jar
```

## Переменные окружения

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Ключ OpenAI. Без него сервер стартует, но анализ и генерация вернут ошибку |
| `OPENAI_MODEL` | `gpt-5-mini` | Модель для анализа, генерации и правки абзацев |
| `OPENAI_SEARCH_MODEL` | как `OPENAI_MODEL` | Модель для веб-поиска по выдаче |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Адрес API, если запросы идут через прокси-шлюз |
| `CORS_ORIGINS` | `http://localhost:3000` | Адреса фронтенда через запятую |
| `PORT` | `8080` | Порт сервера |

Остальные настройки (число результатов выдачи, таймауты, объем текста страниц в промптах)
лежат в `src/main/resources/application.yml`, секция `app`.

## Как это работает

1. `POST /api/files`: файл PDF, DOCX или TXT до 20 МБ. Текст извлекается сразу, сам файл не хранится.
2. `POST /api/articles`: тема, требования, план и источники. Анализ запускается в фоне.
3. `GET /api/articles/{id}/research`: фронтенд опрашивает статус. Этапы анализа:
   - веб-поиск OpenAI собирает до 10 результатов выдачи;
   - Jsoup загружает страницы конкурентов и ссылки пользователя;
   - LLM определяет интент, релевантность конкурентов и рекомендации;
   - LLM подбирает ключевые запросы;
   - LLM составляет структуру H1-H3 и оценивает объем.
4. `PUT /api/articles/{id}/outline` сохраняет черновик структуры, `POST /api/articles/{id}/generate`
   генерирует статью (синхронно, 30-90 секунд). Генерация идет в два прохода: автор пишет по структуре
   и материалам, редактор сверяет факты и чистит шаблонные обороты. Если редактор изменил заголовки,
   остается черновик автора.
5. `PUT /api/articles/{id}` — автосохранение редактора, SEO-оценка пересчитывается.
   `POST /api/articles/{id}/paragraph-actions` — AI-правка абзаца, `POST /api/articles/{id}/regenerate` —
   повторная генерация.
6. `GET /api/articles/{id}/export?format=html|markdown|txt` — файл статьи.

SEO-оценка считается без LLM, по 8 проверкам: интент, ключ в H1 и во введении, плотность ключей,
объем, заголовки, длина meta description, внутренние ссылки.

## Пример

```bash
curl -s -X POST localhost:8080/api/articles -H 'Content-Type: application/json' \
  -d '{"topic": "Как выбрать CRM для малого бизнеса"}'
# {"id":"94914fbf-..."}

curl -s localhost:8080/api/articles/94914fbf-.../research
# {"status":"pending","progress":{"stage":1,"total":5,"label":"Изучаем страницы конкурентов..."}, ...}
```

В Windows-консоли передавайте JSON с кириллицей из файла в UTF-8 (`--data-binary @body.json`),
иначе curl отправит его в кодировке консоли и сервер ответит 400.

## Структура

```
ru.seoai
├── config/       настройки, CORS, пул фоновых задач
├── common/       ошибки API в формате Problem Details
├── ai/           AiClient и реализация на OpenAI SDK
├── api/          контроллеры и DTO
├── article/      модель статьи, in-memory хранилище, проверка структуры, очистка HTML
├── source/       загрузка файлов, извлечение текста, загрузка веб-страниц
├── research/     анализ выдачи: поиск, промпты, пайплайн
├── generation/   генерация, редактура, правка абзацев
├── seo/          SEO-анализ, slug, подсчет ключевых слов
└── export/       экспорт в HTML, Markdown, TXT
```
