# ha-meal-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-meal-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-meal-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-meal-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-meal-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-meal-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-meal-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-meal-card)](https://github.com/juju35/ha-meal-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-meal-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/icon.svg" alt="Meal Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/mealie.png" alt="Mealie" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/bonap.png" alt="Bonap" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/grocy.png" alt="Grocy" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/kitchenowl.png" alt="KitchenOwl" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/cookidoo.png" alt="Cookidoo" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/bring.png" alt="Bring!" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/ourgroceries.png" alt="OurGroceries" height="24">
</p>

A Lovelace card for **the week's meal plan** and the **shopping list**: tonight's dinner at a glance, today's lunch, the week day by day as plates, and the shopping list to tick off. With Mealie, the week's meals can be planned, changed or cleared right from the card.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-meal-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [Meal](#screenshots) | `custom:meal-card` | Tonight's dinner with its time and servings, today's lunch, the week as plates (a tap on a day edits its meals, with Mealie), and the shopping list to tick off. |
| [Meal mini](#meal-mini) | `custom:meal-mini-card` | Tonight's dinner and what is left to buy on two lines, with a zoom to the full card. |

| Dinner planned | Nothing tonight |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-planned.png" alt="Dinner planned" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-unplanned.png" alt="Nothing tonight" width="400"> |

## Features

- **Tonight first**: tonight's dinner in big, with a plate drawn in colours picked from the dish's name, its time and its servings; *Nothing planned for tonight* when the plan has no dinner today
- **Today's lunch** on a line, with its time
- **The week as plates**: Monday to Sunday (or the next 7 days), a plate per day, today marked, the past faded, a dashed plate when nothing is planned; hover a day for its meals; tomorrow's dinner under it
- **The shopping list to tick off**: what is left to buy first, by aisle when the items carry one, then what was bought, struck through; a tap ticks an item off (or puts it back) on the to-do list
- **Edit the meal plan (Mealie)**: tap a day of the week, then a meal: search a recipe, type a note, take the meal before as leftovers, pick a random recipe, or clear it; Mealie's actions do the change
- **Illustrated header**: a kitchen corner whose pot steams while a dinner is planned tonight; the dark theme darkens it
- **Mini card**: the state, tonight's dinner and what is left to buy; its zoom button opens the full card in place
- Visual editor for both cards, light and dark themes, 22 languages, no external dependency

## Supported integrations

The card reads the meal plans of these integrations (Mealie's meal plan action, Mealie's and Cookidoo's calendars, Grocy's meal plan sensor, and any calendar listed in `meal_plan`), and takes any `todo` list for the shopping; it edits the meal plan through Mealie's actions:

| | Integration | What the cards show |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/mealie.png" alt="Mealie" height="16"> | [Mealie](https://www.home-assistant.io/integrations/mealie/) (built in) | Meal plan (read and edited from the card), recipes and shopping lists |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/bonap.png" alt="Bonap" height="16"> | [Bonap](https://github.com/AymericLeFeyer/bonap) (Home Assistant app, through Mealie) | The meal plan planned in Bonap, read and edited through Mealie |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/grocy.png" alt="Grocy" height="16"> | [Grocy](https://github.com/custom-components/grocy) (Marketplace) | Meal plan, stock and shopping list |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/kitchenowl.png" alt="KitchenOwl" height="16"> | [KitchenOwl](https://github.com/TomBursch/kitchenowl-ha) (Marketplace) | Shopping list |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/cookidoo.png" alt="Cookidoo" height="16"> | [Cookidoo](https://www.home-assistant.io/integrations/cookidoo/) (built in) | Thermomix recipes, calendar and shopping list |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/bring.png" alt="Bring!" height="16"> | [Bring!](https://www.home-assistant.io/integrations/bring/) (built in) | Shopping list |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/ourgroceries.png" alt="OurGroceries" height="16"> | [OurGroceries](https://www.home-assistant.io/integrations/ourgroceries/) (built in) | Shopping list |

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-meal-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-meal-card` — Type: **Dashboard**
3. Open **Meal Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you: `/local/community/ha-meal-card/ha-meal-card.js`.

### Manual

1. Download `ha-meal-card.js` and the `ha-meal-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-meal-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-meal-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

Every option is in the visual editor. Without any option, the card finds the meal plans (Mealie, Cookidoo, Grocy) and the first shopping list of the home. In YAML:

```yaml
type: custom:meal-card

# A family calendar as the meal plan, the Bring! list, the next 7 days
type: custom:meal-card
meal_plan:
  - calendar.family_meals
shopping_list: todo.bring_groceries
days: next7

# Two lines on a phone dashboard
type: custom:meal-mini-card
```

| Option | Type | Default | Description |
|---|---|---|---|
| `meal_plan` | string or list | Mealie, Cookidoo and Grocy found | Calendars (an event's calendar or summary says its meal type: *breakfast*, *lunch*, *dinner*, *side*; dinner otherwise) or a Grocy meal plan sensor |
| `shopping_list` | string | the first shopping list found | A `todo` entity |
| `title` | string | `Meals` | Both: card title |
| `show_title` | boolean | `true` | Both: show the title |
| `show_subtitle` | boolean | `true` | Both: today's lunch (else tomorrow's dinner) under the title |
| `navigation_path` | string | | Both: a tap on the header opens this dashboard path |
| `days` | string | `week` | `week` (Monday to Sunday) or `next7` (from today) |
| `show_week` | boolean | `true` | The week as plates |
| `show_shopping` | boolean | `true` | The shopping list |
| `shopping_limit` | number | `8` | How many items of the shopping list are shown |
| `edit` | boolean | `true` | Both: with Mealie, a tap on a day of the week opens the editing popup (`false`: read only) |
| `illustration` | boolean | `true` | Both: the illustrated header (`false`: the classic header) |
| `illustration_theme` | string | `auto` | Both: `auto` (follows the Home Assistant theme: night with a dark theme, day with a light theme), `day` or `night` |
| `animations` | boolean | `true` | Both: the steam over the pot |
| `zoom` | boolean | `true` | Mini card: the zoom button |
| `language` | string | Home Assistant's | Advanced: one of the [languages](#translations) |

## Screenshots

| Dinner planned | Nothing tonight | Next 7 days, nothing to buy |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-planned.png" alt="Dinner planned" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-unplanned.png" alt="Nothing tonight" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-done.png" alt="Next 7 days" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-planned-dark.png" alt="Dinner planned, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-unplanned-dark.png" alt="Nothing tonight, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-done-dark.png" alt="Next 7 days, dark" width="400"> |

| Narrow | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-narrow.png" alt="Narrow" width="300"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-narrow-dark.png" alt="Narrow, dark" width="300"> |

**Editing (Mealie)**: a day of the week opens its meals; a meal opens the recipe search, with the leftovers and random shortcuts.

| A day's meals | A recipe for dinner |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-edit-day.png" alt="Editing a day" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-edit-recipe.png" alt="Searching a recipe" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-edit-day-dark.png" alt="Editing a day, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-edit-recipe-dark.png" alt="Searching a recipe, dark" width="400"> |

**Cooking animation**: the steam rises from the pot while a dinner is planned tonight (still with `animations: false`, or when the system asks for reduced motion).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-cooking.gif" alt="Cooking animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-cooking-dark.gif" alt="Cooking animation, dark" width="400"> |

### Meal mini

| Dinner planned | Nothing tonight | Zoomed in |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-planned.png" alt="Mini, dinner planned" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-unplanned.png" alt="Mini, nothing tonight" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-zoom.png" alt="Mini, zoomed in" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-planned-dark.png" alt="Mini, dinner planned, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-unplanned-dark.png" alt="Mini, nothing tonight, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-zoom-dark.png" alt="Mini, zoomed in, dark" width="400"> |

| Cooking animation | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-cooking.gif" alt="Mini, cooking animation" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/screenshots/ml-mini-cooking-dark.gif" alt="Mini, cooking animation, dark" width="320"> |

## How it works

- **Meal plan**: `meal_plan`, else the home's Mealie and Cookidoo calendars and Grocy meal plan sensor
- **Mealie**: its `mealie.get_mealplan` action for the days shown (each Mealie entry, found from its entities' devices, so any user, admin or not, gets it), with the recipes' total time and servings; its calendars are then skipped. Without the action's answer, its calendars are read like any other
- **Calendars**: their events of the days shown (`calendars/<entity>`); the calendar's id or the event's summary says the meal type (*breakfast*, *lunch*, *dinner*, *side*, in several languages), dinner otherwise
- **Grocy**: the `meals` attribute of its meal plan sensor (recipe, product or note, the section as the meal type)
- **Shopping list**: `shopping_list`, else the first to-do list of Mealie, Bring!, OurGroceries, KitchenOwl, Grocy, Cookidoo or the Shopping list integration (one named like a shopping list first); its items (`todo/item/list`), sorted by aisle when their descriptions read like aisles (short words shared by several items); a tap calls `todo.update_item` (`completed` / `needs_action`), shown at once until the list reports it (8 seconds at most) and undone if the action fails
- **Refresh**: at first, every 10 minutes, at each new day, and whenever the shopping list changes
- **Editing (Mealie)**: offered once Mealie's `get_mealplan` answered (`edit: false` turns it off). The popup lies at the top of the card and closes when the card leaves the page, nothing saved. The search calls `mealie.get_recipes` (6 recipes, 300 ms after the last key); *Save* plans the recipe picked or, without one, the text typed as a note: `mealie.update_mealplan` on a slot Mealie already plans (a recipe replaced by a note: the entry deleted and planned again, `mealie.delete_mealplan` then `mealie.set_mealplan`), else `mealie.set_mealplan`; *Leftovers* plans the main course before again (the same recipe, as Bonap counts leftovers; a note-only meal gives a note `Leftovers: <the meal before>`); *Random* calls `mealie.set_random_mealplan` (the slot's entry deleted first); *Clear* calls `mealie.delete_mealplan`. The meal plan is fetched again after a change (also when Mealie refuses it, the popup then staying open with an error), and the search field is never redrawn while typing
- **Bonap**: the markers Bonap puts at the start of a meal's note (`[s:4]` servings, `[c:dessert]` course, `[g:…]` guests, `[b:…]` batch stock) are never shown; a note-only meal shows its note; with a starter or a dessert in the same slot, the card shows and edits the main course; a meal changed from the card keeps the servings, course and guests markers (`note_text`), not the batch one
- **Actions**: `todo.update_item` on the shopping list; with Mealie, `mealie.set_mealplan`, `update_mealplan`, `set_random_mealplan` and `delete_mealplan` from the editing popup

## Development

```bash
npm install
npm run build        # stamps the version of package.json into dist/ha-meal-card.js
npm run check        # builds and checks the bundle (run in CI)
npm test             # unit tests
npm run screenshots  # renders the cards with a mock meal plan into screenshots/ (and the GIFs, needs ffmpeg)
```

The source is split into ES modules under `src/shared/` (entry `src/shared/index.js`); `npm run build` assembles them (`scripts/bundle.mjs`) into the single file the Marketplace serves.

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built files to the release, which is where the Marketplace installs them from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-meal-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `ha-meal-card.js` and its translation files

## Translations

The card auto-detects the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-meal-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
