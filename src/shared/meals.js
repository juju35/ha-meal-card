// ── Meals ────────────────────────────────────────────────────────────────────
// The meal plan comes from Mealie (its get_mealplan action, with the recipes' times and servings), from calendars
// (Mealie's per meal type, Cookidoo's, or any listed in `meal_plan`) and from Grocy's meal plan sensor (its `meals`
// attribute). The shopping list is a to-do list: `shopping_list`, else the first one of a shopping integration.
export const ML_TYPES = ["breakfast", "lunch", "dinner", "side"];
export const ML_PLAN_PLATFORMS = ["mealie", "cookidoo", "grocy"];
export const ML_SHOP_PLATFORMS = ["mealie", "bring", "ourgroceries", "kitchenowl", "grocy", "cookidoo", "shopping_list"];

// The meal type a name says (an entity id, a calendar, a Grocy section, a Mealie entry type), else `fallback`.
export const mlType = (text, fallback = "dinner") => {
  const t = String(text || "").toLowerCase();
  if (/breakfast|petit.?d[ée]j|fr[üu]hst[üu]ck|desayuno|colazione|ontbijt|śniadanie/.test(t)) return "breakfast";
  if (/lunch|d[ée]jeuner|mittag|almuerzo|comida|pranzo|obiad|lunsj/.test(t)) return "lunch";
  if (/\bside|accompagnement|beilage/.test(t)) return "side";
  if (/dinner|d[îi]ner|supper|abend|cena|souper|kolacja|avondeten|middag|aftensmad/.test(t)) return "dinner";
  return fallback;
};

// "YYYY-MM-DD" of a date, in the browser's time zone.
export const mlDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// A duration in minutes: a number, an ISO 8601 duration ("PT1H15M"), or a text ("45 min", "1 h 15", "1 hour").
export const mlMinutes = (v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  const s = String(v).trim();
  const iso = s.match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (iso && (iso[1] || iso[2])) return Number(iso[1] || 0) * 60 + Number(iso[2] || 0);
  const h = s.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hours?|heures?|std)/i);
  const m = s.match(/(\d+)\s*(?:m|min|minutes?)\b/i) || (h ? s.match(/(?:h|hours?|heures?|std)\s*(\d+)/i) : null);
  if (h || m) return Math.round(Number(String(h?.[1] || 0).replace(",", ".")) * 60 + Number(m?.[1] || 0));
  return /^\d+$/.test(s) ? Number(s) : null;
};

// The servings of a recipe: a number, or the first number of its yield ("4 servings").
export const mlServings = (v) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// The meal plans of the home: Mealie's and Cookidoo's calendars, Grocy's meal plan sensor.
export const mlPlans = (hass) =>
  Object.keys(hass.entities || {}).filter((id) => {
    const p = hass.entities[id].platform;
    if (!ML_PLAN_PLATFORMS.includes(p)) return false;
    return id.startsWith("calendar.") || (id.startsWith("sensor.") && /meal/.test(id));
  });

// Mealie's config entries, from the devices of the Mealie entities among `plans` (read by any user, unlike
// config_entries/get): one get_mealplan call each.
export const mlMealieEntries = (hass, plans) => [
  ...new Set(plans.filter((id) => hass.entities?.[id]?.platform === "mealie").flatMap((id) => hass.devices?.[hass.entities[id].device_id]?.config_entries || [])),
];

// What says that a to-do list changed: its state (the items left) and its last update (an item renamed or moved).
export const mlListSig = (st) => (st ? `${st.state}|${st.last_updated ?? ""}` : "");

// The shopping list of the home: a to-do list of a shopping integration, one named like a shopping list first.
export const mlShopping = (hass) => {
  const lists = Object.keys(hass.entities || {}).filter((id) => id.startsWith("todo.") && ML_SHOP_PLATFORMS.includes(hass.entities[id].platform));
  return lists.find((id) => /shop|course|einkauf|compra|spesa|boodschap|zakup/i.test(id)) || lists[0];
};

// A meal from a calendar event, typed by its calendar (Mealie has one per meal type).
export const mlFromEvent = (ev, calendar) => {
  const start = ev.start?.date || ev.start?.dateTime || ev.start;
  if (!start || !ev.summary) return null;
  return { day: mlDay(String(start).length === 10 ? `${start}T12:00:00` : start), type: mlType(`${calendar} ${ev.summary}`), name: ev.summary, source: calendar };
};

// The meals of Mealie's get_mealplan response.
export const mlFromMealie = (resp, source) =>
  (resp?.mealplan || [])
    .map((e) => {
      const r = e.recipe || {};
      const name = r.name || e.title;
      if (!name || !e.mealplan_date) return null;
      return {
        day: mlDay(`${String(e.mealplan_date).slice(0, 10)}T12:00:00`),
        type: mlType(e.entry_type),
        name,
        minutes: mlMinutes(r.total_time) ?? mlMinutes(r.perform_time),
        servings: mlServings(r.recipe_yield ?? r.recipe_servings),
        source,
        // What editing needs: the entry's id (update_mealplan, delete_mealplan) and its recipe's.
        id: e.mealplan_id ?? e.id ?? null,
        recipe: r.recipe_id ?? r.id ?? null,
      };
    })
    .filter(Boolean);

// The recipes of Mealie's get_recipes response ({ recipes: { items } }), at most `limit`.
export const mlRecipes = (resp, limit = 6) => {
  const r = resp?.recipes;
  const items = Array.isArray(r) ? r : Array.isArray(r?.items) ? r.items : [];
  return items
    .map((x) => ({ id: x.recipe_id ?? x.id ?? null, name: x.name, minutes: mlMinutes(x.total_time) ?? mlMinutes(x.perform_time) }))
    .filter((x) => x.id && x.name)
    .slice(0, limit);
};

// The meal planned before `type` on `day` (the latest one, of any type), for the leftovers shortcut.
export const mlBefore = (meals, day, type) => {
  const rank = (m) => `${m.day}|${ML_TYPES.indexOf(m.type)}`;
  const at = `${day}|${ML_TYPES.indexOf(type)}`;
  return meals.filter((m) => ML_TYPES.includes(m.type) && rank(m) < at).sort((a, b) => (rank(a) < rank(b) ? 1 : -1))[0] || null;
};

// The meals of Grocy's meal plan sensor (its `meals` attribute): a recipe, a note or a product per day and section.
export const mlFromGrocy = (st) =>
  (Array.isArray(st?.attributes?.meals) ? st.attributes.meals : [])
    .map((e) => {
      const name = e.recipe?.name || e.product?.name || e.note;
      if (!name || !e.day) return null;
      return {
        day: mlDay(`${String(e.day).slice(0, 10)}T12:00:00`),
        type: mlType(e.section?.name || e.type),
        name,
        minutes: mlMinutes(e.recipe?.total_time ?? e.recipe?.preparation_time),
        servings: mlServings(e.recipe?.base_servings ?? e.recipe_servings),
        source: st.entity_id,
      };
    })
    .filter(Boolean);

// The shopping list's items sorted by aisle when their descriptions read like aisles (short words, no quantities, one
// at least shared by several items, on most items): the items of an aisle together, the aisles in alphabetical
// order, the items without one last. Otherwise in the list's own order.
export const mlAisles = (items) => {
  const label = (i) => String(i.description || "").trim();
  const words = items.map(label).filter((d) => d && d.length <= 20 && !/\d/.test(d));
  const shared = words.some((d, i) => words.indexOf(d) !== i);
  if (!shared || words.length < items.length * 0.6) return items;
  const key = (i) => (words.includes(label(i)) ? label(i) : "\uffff");
  return items.map((i, n) => [i, n]).sort(([a, x], [b, y]) => key(a).localeCompare(key(b)) || x - y).map(([i]) => i);
};

// The Intl formats, made once per language and options.
export const mlIntlCache = new Map();
export const mlIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!mlIntlCache.has(key)) mlIntlCache.set(key, new Kind(lang, opts));
  return mlIntlCache.get(key);
};
