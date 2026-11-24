# Changelog

## 1.0.3 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/shared/` (entry `src/shared/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.0.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.0.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.0.0 - 2026-11-22

### Features
- First release: `meal-card` and `meal-mini-card`. Tonight's dinner in big with its plate, time and servings, today's lunch, the week day by day as plates (today marked, the past faded), and the shopping list to tick off, by aisle when its items carry one; an illustrated kitchen header whose pot steams while a dinner is planned. Mealie (its meal plan action and calendars), Cookidoo and any calendar, Grocy's meal plan sensor, and any to-do list for the shopping (Mealie, Bring!, OurGroceries, KitchenOwl, Grocy, Cookidoo).
