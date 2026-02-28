# Market-Intel Agent Spec — Personal German Coach

---

## Цель Market-Intel агента

Автоматически собирать данные о рынке онлайн-обучения немецкому языку для:
- Понимания конкурентного ландшафта
- Выявления незанятых ниш
- Адаптации контента под тренды
- Ценообразования

---

## ЧТО СОБИРАТЬ (источники данных)

### 1. YouTube — видеоконтент

| Канал / Запрос | Что отслеживать |
|---|---|
| "Deutsch lernen" | Количество просмотров, топ-видео за месяц |
| "Deutsch für Beruf" | Профессиональный немецкий — спрос |
| "Deutsch Integration" | Интеграционные темы — что популярно |
| "Goethe B1 Prüfung" | Экзаменационная подготовка — тренды |
| "TestDaF Vorbereitung" | Спрос на высокие уровни |
| "Deutsch Aussprache" | Произношение — растущая ниша |
| Easy German (канал) | Формат и темы популярного контента |
| Deutsch für Euch (канал) | Структура занятий |
| DW Deutsch lernen | Официальный контент — benchmark |
| Nicos Weg (канал) | A1–B1 сериальный формат |

**Что фиксировать:** views_30d, likes, comments_count, upload_frequency, top_keywords

---

### 2. Instagram / TikTok — социальные сети

| Хэштег | Платформа | Частота |
|---|---|---|
| #deutschlernen | Instagram + TikTok | weekly |
| #germanlearning | Instagram | weekly |
| #deutschfüranfänger | Instagram | weekly |
| #deutschkurs | Instagram | weekly |
| #germangrammar | TikTok | weekly |
| #sprachenlernen | Instagram | weekly |
| #deutschmitgermancoach | TikTok | weekly |
| #Integration Deutschland | Instagram | weekly |

**Что фиксировать:** топ-посты, engagement_rate, формат (Reel/Carousel/Story), тема контента

---

### 3. Платформы — цены и предложения

| Платформа | URL | Что мониторить |
|---|---|---|
| Lingoda | lingoda.com | Цены групп/индивидуал, уровни, акции |
| italki | italki.com | Цены репетиторов (немецкий, B1–C1) |
| Preply | preply.com | Цены и рейтинг репетиторов |
| Babbel | babbel.com | Структура курсов, цены подписки |
| Udemy | udemy.com/topic/german | Топ-курсы, количество студентов, цены |
| Goethe-Institut | goethe.de | Официальные курсы и цены |
| Deutsch Online | deutsch-online.com | Нишевые предложения |
| VHS Online | vhs-lernportal.de | Государственные курсы (бесплатно) |
| Coursera / edX | coursera.org | Немецкий от университетов |
| Chatterbug | chatterbug.com | AI + human гибридная модель |

**Что фиксировать:** price_per_hour, group_vs_individual, target_audience, course_format, reviews_count

---

### 4. Рынок русскоязычных в Германии

| Источник | Тип |
|---|---|
| Telegram: "Русские в Берлине / Мюнхене" | Группы — боли и вопросы |
| Facebook: "Русскоязычные в Германии" | Группы — запросы |
| Reddit: r/germany, r/de | Вопросы о языке |
| VK группы: "Русские в Германии" | Боли интеграции |
| Expat Forums (toytown-germany.com) | Вопросы на английском/немецком |

**Что фиксировать:** топ-вопросы, частые боли, запросы на репетиторов, форматы которые ищут

---

## ЧАСТОТА СБОРА

| Задача | Частота | Инструмент |
|---|---|---|
| YouTube trending videos | Daily | YouTube Data API v3 |
| Instagram top posts by hashtag | Weekly | Apify Instagram Scraper |
| TikTok trending | Weekly | TikTok Research API / Apify |
| Competitor pricing | Monthly | Manual + Apify web scraper |
| Reddit mentions | Weekly | Reddit API / Pushshift |
| Telegram group posts | Weekly | Manual or Telethon |

---

## 20 КОНКРЕТНЫХ ИСТОЧНИКОВ / КЛЮЧЕВЫХ СЛОВ

1. **YouTube:** "Deutsch B1 lernen 2025"
2. **YouTube:** "Deutsch für Arbeit Deutschland"
3. **YouTube:** "Goethe B2 Prüfung bestehen"
4. **YouTube:** "Deutsch Aussprache üben"
5. **YouTube:** "Integration Deutschland Deutsch"
6. **Instagram:** #deutschlernen2025
7. **TikTok:** #germanwithtiktok
8. **TikTok:** #deutscherfolg
9. **Udemy:** "German for work" (sort by bestselling)
10. **italki:** немецкие репетиторы >4.8 рейтинг, $25–60/h
11. **Lingoda:** цены и структура B1–B2 курсов
12. **Chatterbug:** гибридная AI+человек модель
13. **Reddit r/germany:** "german lessons" / "Sprachkurs"
14. **Reddit r/de:** вопросы про интеграцию
15. **Telegram:** "Русские в Мюнхене/Берлине/Гамбурге"
16. **Facebook Groups:** "Работа в Германии для русских"
17. **Google Trends:** "Deutsch B1" vs "Deutsch B2" (DE регион)
18. **Google Trends:** "Integrationskurs online"
19. **Producthunt:** новые Ed-Tech продукты по языкам
20. **Goethe.de:** расписание и цены официальных курсов

---

## ШАБЛОН WEEKLY REPORT

```
---
📊 MARKET INTEL WEEKLY REPORT
Период: [дд.мм — дд.мм]
Составлен: [дата]
---

## 🔥 ЧТО ПРОДАЁТСЯ (What Sells)

Top YouTube:
1. "[Название видео]" — [канал], [views], тема: [...]
2. ...

Top Udemy (немецкий):
- "#1 bestseller": [курс, цена, students]
- Ценовой диапазон: [$X–$Y] за курс

Конкуренты — акции этой недели:
- Lingoda: [акция/скидка]
- Babbel: [новое предложение]

---

## 💬 ЧТО ВОВЛЕКАЕТ (What Engages)

Топ Instagram-форматы (по engagement):
- [Тип контента]: avg engagement [X%]
- Лучшая тема недели: [...]

Топ TikTok:
- Формат: [...]
- Тема: [...]

Что спрашивают русскоязычные в Германии (Telegram/Reddit):
- Топ-3 вопроса:
  1. [...]
  2. [...]
  3. [...]

---

## 📉 ПЕРЕНАСЫЩЕНО (Oversaturated)

- [Тема / формат]: слишком много похожего контента, нет дифференциации
- [Пример]: "Базовый A1 немецкий" — 1000+ курсов, конкуренция максимальная

---

## 🔍 НЕЗАНЯТЫЕ НИШИ (Niche Gaps)

Что недостаточно представлено:
1. [Ниша]: [почему нет конкурентов / что мешает / как войти]
2. [Ниша]: ...
3. [Ниша]: ...

---

## 💡 РЕКОМЕНДОВАННЫЙ ПРОДУКТ НА ЭТОТ МЕСЯЦ (Suggested Build)

**Идея:** [название продукта / формата]
**Почему сейчас:** [тренд / пробел / спрос]
**Формат:** [email-курс / видео-серия / шаблон / инструмент]
**Целевая аудитория:** [сегмент]
**Ожидаемый спрос:** [высокий / средний / нишевый]
**Сложность создания:** [1–2 дня / 1 неделя / 1 месяц]
**Монетизация:** [цена / модель]

---

## 📌 ACTION ITEMS

- [ ] [Конкретное действие на основе данных]
- [ ] [Обновить контент-план]
- [ ] [Проверить конкурентное предложение]
```

---

## Claude Prompt для генерации weekly report

```
Ты — аналитик рынка онлайн-обучения немецкому языку.

Проанализируй следующие данные за неделю:

YOUTUBE (топ-видео):
{{youtube_data}}

INSTAGRAM/TIKTOK (топ-посты):
{{social_data}}

КОНКУРЕНТЫ (цены и акции):
{{competitor_data}}

ВОПРОСЫ АУДИТОРИИ (Reddit/Telegram):
{{audience_questions}}

Составь Weekly Market Intel Report по следующей структуре:
1. ЧТО ПРОДАЁТСЯ (топ-3 тренда)
2. ЧТО ВОВЛЕКАЕТ (топ-форматы)
3. ПЕРЕНАСЫЩЕНО (где не стоит инвестировать)
4. НЕЗАНЯТЫЕ НИШИ (3 возможности)
5. РЕКОМЕНДОВАННЫЙ ПРОДУКТ НЕДЕЛИ (1 конкретная идея с обоснованием)

Формат: структурированный отчёт на русском, с конкретными данными и цифрами.
Длина: 400–600 слов.
```

---

## Технические инструменты для сбора данных

| Задача | Инструмент | Цена |
|---|---|---|
| YouTube Analytics | YouTube Data API v3 (бесплатно до квоты) | Free |
| Instagram scraping | Apify Instagram Scraper | $49/мес |
| TikTok data | TikTok Research API (для бизнеса) | Free |
| Web scraping (цены конкурентов) | Apify Web Scraper / Bright Data | $49–99/мес |
| Reddit monitoring | Reddit API / Pushshift | Free |
| Google Trends | SerpAPI + Python | $50/мес |
| Оркестрация | n8n (self-hosted) / Zapier | Free / $20+/мес |
| Хранение данных | Airtable (маркетинговая база) | $20/мес |
| Визуализация | Google Looker Studio | Free |

**Минимальный MVP:** YouTube Data API + ручной мониторинг Udemy/italki 1 раз в неделю (~2 часа). Бюджет: 0€.
**Автоматизированный:** Apify + n8n + Airtable. Бюджет: ~$100/мес.
