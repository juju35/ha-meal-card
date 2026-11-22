// A mock Home Assistant with Mealie (its dinner and lunch calendars, its get_mealplan action answering the week, its
// shopping list), a Cookidoo calendar and a Grocy meal plan sensor, all found by the card itself.
// The clock of the tests: Thursday 25 June 2026, 18:00 in the machine's time zone.
export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });

export const NOW = new Date(2026, 5, 25, 18, 0).getTime();
export const day = (offset) => {
  const d = new Date(2026, 5, 25 + offset, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Monday 22 June to Sunday 28 June: a dinner each day but Saturday, lunch today.
export const PLAN = [
  [-3, "dinner", "Chickpea curry", "PT40M", "4 servings"],
  [-2, "dinner", "Mushroom risotto", "PT35M", "4"],
  [-1, "dinner", "Fish tacos", "PT30M", "4"],
  [0, "dinner", "Lemon chicken traybake", "PT45M", "4 servings"],
  [0, "lunch", "Lentil & carrot soup", "PT25M", "2"],
  [1, "dinner", "Homemade pizza", "PT1H", "4"],
  [3, "dinner", "Ratatouille", "PT50M", "4"],
];

export const ITEMS = [
  { uid: "1", summary: "Lemons", status: "needs_action", description: "Produce" },
  { uid: "2", summary: "Courgettes", status: "needs_action", description: "Produce" },
  { uid: "3", summary: "Rosemary", status: "completed", description: "Produce" },
  { uid: "4", summary: "Chicken thighs", status: "needs_action", description: "Meat" },
  { uid: "5", summary: "Mozzarella", status: "needs_action", description: "Dairy" },
  { uid: "6", summary: "Flour", status: "completed", description: "Pantry" },
  { uid: "7", summary: "Quinoa", status: "needs_action", description: "Pantry" },
];

export const makeHass = ({ ws = true, items = ITEMS, plan = PLAN, ...overrides } = {}) => {
  const hass = {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    entities: {
      "calendar.mealie_dinner": { platform: "mealie", device_id: "dev_mealie" },
      "calendar.mealie_lunch": { platform: "mealie", device_id: "dev_mealie" },
      "todo.mealie_shopping_list": { platform: "mealie", device_id: "dev_mealie" },
      "calendar.cookidoo_meal_plan": { platform: "cookidoo" },
      "sensor.grocy_meal_plan": { platform: "grocy" },
    },
    // The Mealie device: its config entry is what get_mealplan needs (config_entries/get is for admins only).
    devices: { dev_mealie: { config_entries: ["mealie1"] } },
    states: {
      "calendar.mealie_dinner": st("calendar.mealie_dinner", "off"),
      "calendar.mealie_lunch": st("calendar.mealie_lunch", "off"),
      "todo.mealie_shopping_list": st("todo.mealie_shopping_list", String(items.filter((i) => i.status !== "completed").length)),
      "calendar.cookidoo_meal_plan": st("calendar.cookidoo_meal_plan", "off"),
      "sensor.grocy_meal_plan": st("sensor.grocy_meal_plan", "1", {
        meals: [{ day: day(2), section: { name: "Dinner" }, recipe: { name: "Grocy lasagne", base_servings: 6 } }],
      }),
    },
    calls: [],
    ws: [],
    api: [],
    callService(domain, service, data) {
      this.calls.push([domain, service, data]);
    },
    ...overrides,
  };
  if (ws) {
    hass.callWS = async (msg) => {
      hass.ws.push(msg);
      if (msg.type === "call_service" && msg.service === "get_mealplan")
        return {
          response: {
            mealplan: plan.map(([off, type, name, time, yieldText]) => ({ mealplan_date: day(off), entry_type: type, title: "", recipe: { name, total_time: time, recipe_yield: yieldText } })),
          },
        };
      if (msg.type === "todo/item/list") return { items: items.map((i) => ({ ...i })) };
      return null;
    };
    hass.callApi = async (_method, path) => {
      hass.api.push(path);
      if (path.startsWith("calendars/calendar.cookidoo_meal_plan")) return [{ summary: "Thermomix bread", start: { date: day(2) }, end: { date: day(3) } }];
      return [];
    };
  }
  return hass;
};
