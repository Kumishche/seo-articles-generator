# SEO Article AI

Frontend информационной системы для подготовки SEO-статей с помощью ИИ.
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Данные приходят из Spring Boot backend (`../back`).

## Запуск

Сначала запустите backend (см. `../back/README.md`), затем:

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production-сборка (output: standalone)
```

Всю систему целиком можно поднять одной командой из корня репозитория: `docker compose up --build`.

## Экраны

| Маршрут | Экран |
| --- | --- |
| `/` | редирект на `/articles/new` |
| `/articles` | Список статей |
| `/articles/new` | Исходные данные: тема, требования, план, ссылки, файлы |
| `/articles/[id]/research` | Анализ выдачи, интент, ключи, конкуренты, редактируемая структура |
| `/articles/[id]/editor` | Редактор статьи, SEO-оценка, предпросмотр сниппета, экспорт |

Анализ идет на backend в фоне: экран анализа опрашивает статус и показывает текущий этап.
Файлы загружаются на сервер сразу при добавлении, с реальным прогрессом.

## Связь с backend

Все запросы идут через `lib/api.ts` на тот же origin (`/api/...`), а Next.js проксирует их
на backend (`rewrites` в `next.config.ts`), поэтому CORS не нужен. Адрес backend задает
`BACKEND_URL` (по умолчанию `http://localhost:8080`, см. `.env.example`). Rewrites вычисляются
при сборке, поэтому для production-образа адрес передается как build arg.

В `next.config.ts` также увеличены лимиты прокси: таймаут 5 минут (генерация статьи идет
30-90 секунд, по умолчанию прокси обрывает запрос через 30) и размер тела 25 МБ (файлы до 20 МБ).

Типы в `lib/types.ts` соответствуют DTO из `../back/docs/openapi.yaml`.

## Структура

```
app/                 маршруты
components/
  layout/            AppShell, AppSidebar, AppHeader, StepIndicator, PageIntro
  article/           ArticleForm, ArticleList, SourceList, FileUploader, PlanEditor, HowItWorksCard
  research/          ResearchWorkspace, ResearchSummary, ResearchDossier, OutlineEditor, AnalysisProgress, ...
  editor/            EditorLoader, EditorWorkspace, ArticleEditor, EditorToolbar, ArticleToc
  seo/               SeoPanel, SeoScore, SeoChecklist, KeywordStats, SearchPreview, SourcesCard
  publication/       PublishModal (экспорт), RegenerateDialog
  ui/                базовые компоненты (Button, Card, Badge, Field, Dialog, Tabs, Toast)
lib/
  api.ts             клиент REST API
  types.ts           модели данных
  constants.ts       этапы анализа, подписи AI-действий, настройки
  export.ts          сохранение файла экспорта
```
