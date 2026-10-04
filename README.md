# SEO Article AI

Frontend информационной системы для подготовки SEO-статей с помощью ИИ.
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Данные пока mock.

## Запуск

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production-сборка
```

## Экраны

| Маршрут | Экран |
| --- | --- |
| `/` | редирект на `/articles/new` |
| `/articles/new` | Исходные данные: тема, требования, план, ссылки, файлы |
| `/articles/demo/research` | Анализ выдачи, интент, ключи, конкуренты, редактируемая структура |
| `/articles/demo/editor` | Редактор статьи, SEO-оценка, предпросмотр сниппета, публикация |

После нажатия «Начать анализ» на втором экране проигрывается состояние загрузки с этапами анализа.
При прямом открытии сразу показывается результат. Кнопка «Повторить анализ» запускает загрузку снова.

## Структура

```
app/                 маршруты
components/
  layout/            AppShell, AppSidebar, AppHeader, StepIndicator, PageIntro
  article/           ArticleForm, SourceList, FileUploader, HowItWorksCard
  research/          SearchIntentCard, KeywordList, CompetitorList, RecommendationsCard,
                     OutlineEditor, OutlineSummary, AnalysisProgress, ResearchWorkspace
  editor/            ArticleEditor, EditorToolbar, EditorWorkspace
  seo/               SeoScore, SeoChecklist, KeywordStats, SearchPreview, SourcesCard
  publication/       PublishModal, RegenerateDialog
  ui/                базовые компоненты (Button, Card, Badge, Field, Dialog, Toast)
lib/
  types.ts           модели данных (Article, ResearchResult, OutlineSection, SeoAnalysis, ...)
  mock-data.ts       mock-данные
  api.ts             слой доступа к данным
```

## Интеграция со Spring Boot

Все обращения к данным идут через `lib/api.ts`. В комментарии к файлу перечислены
ожидаемые REST-эндпоинты. Чтобы подключить backend, задайте `NEXT_PUBLIC_API_URL`
(см. `.env.example`) и замените тела методов `articleApi` на вызовы `request()`.
Типы в `lib/types.ts` соответствуют DTO.
