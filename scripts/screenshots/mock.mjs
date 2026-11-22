// The mock home of the screenshots and animations: Mealie (its dinner and lunch calendars, its get_mealplan action
// answering the week, its shopping list by aisle) and a Cookidoo calendar. The clock is fixed, so that a capture only
// changes when the card does: Thursday 25 June 2026, 18:30.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-06-25T00:00:00Z" });
const NOW = new Date(2026, 5, 25, 18, 30).getTime();
const day = (offset) => {
  const d = new Date(2026, 5, 25 + offset, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PLAN = [
  [-3, "dinner", "Chickpea curry", "PT40M", "4"],
  [-2, "dinner", "Mushroom risotto", "PT35M", "4"],
  [-1, "dinner", "Fish tacos", "PT30M", "4"],
  [0, "dinner", "Lemon chicken traybake", "PT45M", "4 servings"],
  [0, "lunch", "Lentil & carrot soup", "PT25M", "2"],
  [1, "dinner", "Homemade pizza", "PT1H", "4"],
  [3, "dinner", "Ratatouille", "PT50M", "4"],
];
const ITEMS = [
  ["Lemons", "Produce", false],
  ["Courgettes", "Produce", false],
  ["Rosemary", "Produce", true],
  ["Chicken thighs", "Meat", false],
  ["Mozzarella", "Dairy", false],
  ["Flour", "Pantry", true],
  ["Quinoa", "Pantry", false],
].map(([summary, description, done], i) => ({ uid: String(i + 1), summary, description, status: done ? "completed" : "needs_action" }));

// `scene`: planned (a dinner tonight), unplanned (nothing tonight, the week still planned), done (everything bought).
const SCENES = {
  planned: { plan: PLAN, items: ITEMS },
  unplanned: { plan: PLAN.filter(([off]) => off !== 0), items: ITEMS },
  done: { plan: PLAN, items: [] },
};

// The page's clock and the card's callWS / callApi, as script source: window.Date fixed, window.__ws and window.__api
// answering from the data put on the hass object (`this.__mock`).
export const pageScript = () => `(() => {
  const N = ${NOW};
  const R = Date;
  window.Date = class extends R {
    constructor(...a) { super(...(a.length ? a : [N])); }
    static now() { return N; }
  };
  window.__ws = async function (msg) {
    const d = this.__mock || {};
    if (msg.type === "call_service" && msg.service === "get_mealplan") return { response: { mealplan: d.plan } };
    if (msg.type === "todo/item/list") return { items: d.items };
    return null;
  };
  window.__api = async function (_method, path) {
    return path.startsWith("calendars/calendar.cookidoo") ? (this.__mock || {}).cookidoo : [];
  };
})();`;

export const setup = (s) => {
  const v = SCENES[s.scene];
  const open = v.items.filter((i) => i.status !== "completed").length;
  return {
    hass: {
      language: "en",
      locale: { language: "en" },
      entities: {
        "calendar.mealie_dinner": { entity_id: "calendar.mealie_dinner", platform: "mealie", device_id: "dev_mealie" },
        "calendar.mealie_lunch": { entity_id: "calendar.mealie_lunch", platform: "mealie", device_id: "dev_mealie" },
        "todo.mealie_shopping_list": { entity_id: "todo.mealie_shopping_list", platform: "mealie", device_id: "dev_mealie" },
        "calendar.cookidoo_meal_plan": { entity_id: "calendar.cookidoo_meal_plan", platform: "cookidoo" },
      },
      // The Mealie device: its config entry is what get_mealplan needs.
      devices: { dev_mealie: { id: "dev_mealie", config_entries: ["mealie1"] } },
      states: {
        "calendar.mealie_dinner": st("calendar.mealie_dinner", "off"),
        "calendar.mealie_lunch": st("calendar.mealie_lunch", "off"),
        "todo.mealie_shopping_list": st("todo.mealie_shopping_list", String(open)),
        "calendar.cookidoo_meal_plan": st("calendar.cookidoo_meal_plan", "off"),
      },
      __mock: {
        plan: v.plan.map(([off, type, name, time, yieldText]) => ({ mealplan_date: day(off), entry_type: type, title: "", recipe: { name, total_time: time, recipe_yield: yieldText } })),
        items: v.items,
        cookidoo: [{ summary: "Thermomix bread", start: { date: day(2) }, end: { date: day(3) } }],
      },
    },
    config: { ...s.config },
    open: s.open,
  };
};
