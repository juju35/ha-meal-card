# ha-meal-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-meal-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/icon.svg" alt="Meal Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/mealie.png" alt="Mealie" height="36">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/grocy.png" alt="Grocy" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/kitchenowl.png" alt="KitchenOwl" height="36">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/cookidoo.png" alt="Cookidoo" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/bring.png" alt="Bring!" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/ourgroceries.png" alt="OurGroceries" height="24">
</p>

A Lovelace card for **the week's meal plan** and the **shopping list**: today's meals at a glance, the week day by day, and what is left to buy.

> [!NOTE]
> This card is being designed: there is no release yet. Watch the repository to know when the first version is out.

| Card | Type | What it shows |
|---|---|---|
| Meal | `custom:meal-card` | The week's meal plan, day by day, with the recipe's picture and the shopping list. |
| Meal mini | `custom:meal-mini-card` | Today's meals on two lines, with a zoom to the full card. |

## Supported integrations

The card reads the meal plans and shopping lists of these integrations, and any `todo` list for the shopping:

| | Integration | What the cards show |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/mealie.png" alt="Mealie" height="24"> | [Mealie](https://www.home-assistant.io/integrations/mealie/) (built in) | Meal plan, recipes and shopping lists |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/grocy.png" alt="Grocy" height="16"> | [Grocy](https://github.com/custom-components/grocy) (Marketplace) | Meal plan, stock and shopping list |
| <img src="https://raw.githubusercontent.com/juju35/ha-meal-card/main/images/kitchenowl.png" alt="KitchenOwl" height="24"> | [KitchenOwl](https://github.com/TomBursch/kitchenowl-ha) (Marketplace) | Shopping list |
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

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `ha-meal-card.js` and the `ha-meal-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-meal-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-meal-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## License

[MIT](https://github.com/juju35/ha-meal-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
