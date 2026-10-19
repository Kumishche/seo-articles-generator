# SEO Article AI

Информационная система для подготовки SEO-статей: анализ поисковой выдачи, структура,
генерация текста с помощью OpenAI, редактирование и экспорт.

| Часть | Технологии | Документация |
| --- | --- | --- |
| [front/](front/) | Next.js 16, React 19, Tailwind CSS 4 | [front/README.md](front/README.md) |
| [back/](back/) | Java 21+, Spring Boot 4, OpenAI Responses API | [back/README.md](back/README.md), [API](back/docs/openapi.yaml) |

## Запуск в Docker

```bash
cp .env.example .env    # укажите OPENAI_API_KEY
docker compose up --build
```

- Приложение: http://localhost:3000
- Swagger UI backend: http://localhost:8080/swagger-ui.html

Браузер обращается только к frontend: запросы `/api/*` Next.js проксирует в контейнер backend.
Данные хранятся в памяти backend и пропадают при перезапуске контейнера.

Переменные `.env`: `OPENAI_API_KEY` (обязательно), `OPENAI_MODEL`, `OPENAI_SEARCH_MODEL`,
`OPENAI_BASE_URL` (прокси-шлюз к OpenAI), `SITE_DOMAIN` (домен в предпросмотре сниппета;
подставляется при сборке, после изменения нужен `--build`).

## Запуск без Docker

1. Backend: `cd back && ./mvnw spring-boot:run` (нужен JDK 21+ и `OPENAI_API_KEY` в окружении).
2. Frontend: `cd front && npm install && npm run dev`.
