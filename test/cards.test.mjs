import assert from "node:assert/strict";
import { test } from "node:test";
import { day, makeHass, NOW, st } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const ml = load({ now: NOW });
const { cards } = ml;
const json = (v) => JSON.parse(JSON.stringify(v));
const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
};

// A card whose shadow root answers every selector with nodes recording their click listeners; the meal plan and the
// shopping list fetched before the test reads them.
const make = async (tag, config = {}, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  await settle();
  return card;
};

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["meal-card", "meal-mini-card"]) {
    assert.ok(ml.customElements.get(tag), tag);
    assert.ok(ml.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(ml.window.customCards.map((c) => c.type)), ["meal-card", "meal-mini-card"]);
});

test("discovery: the meal plans and the shopping list of the home", () => {
  const h = makeHass();
  assert.deepEqual(json(ml.mlPlans(h)), ["calendar.mealie_dinner", "calendar.mealie_lunch", "calendar.cookidoo_meal_plan", "sensor.grocy_meal_plan"]);
  assert.equal(ml.mlShopping(h), "todo.mealie_shopping_list");
  assert.equal(ml.mlShopping({ entities: { "todo.chores": { platform: "local_todo" }, "todo.bring_groceries": { platform: "bring" } } }), "todo.bring_groceries");
});

test("parsing: meal types, durations, servings, Mealie, calendars and Grocy", () => {
  assert.equal(ml.mlType("calendar.mealie_lunch"), "lunch");
  assert.equal(ml.mlType("Petit-déjeuner"), "breakfast");
  assert.equal(ml.mlType("anything"), "dinner");
  assert.equal(ml.mlType("calendar.middag"), "dinner", "middag is dinner in Danish, Norwegian and Swedish");
  assert.equal(ml.mlType("Lunsj"), "lunch");
  assert.equal(ml.mlMinutes("PT1H15M"), 75);
  assert.equal(ml.mlMinutes("45 min"), 45);
  assert.equal(ml.mlMinutes("1 h 15"), 75);
  assert.equal(ml.mlMinutes(30), 30);
  assert.equal(ml.mlMinutes("soon"), null);
  assert.equal(ml.mlServings("4 servings"), 4);
  assert.equal(ml.mlServings(""), null);
  const me = ml.mlFromMealie({ mealplan: [{ mealplan_date: "2026-06-25", entry_type: "dinner", recipe: { name: "Soup", total_time: "PT20M", recipe_yield: "2" } }, { mealplan_date: "2026-06-25", entry_type: "side", title: "Bread" }] }, "m");
  assert.deepEqual(json(me.map((m) => [m.day, m.type, m.name, m.minutes ?? null, m.servings ?? null])), [
    ["2026-06-25", "dinner", "Soup", 20, 2],
    ["2026-06-25", "side", "Bread", null, null],
  ]);
  assert.deepEqual(json(ml.mlFromEvent({ summary: "Pasta", start: { date: "2026-06-26" } }, "calendar.mealie_dinner")), { day: "2026-06-26", type: "dinner", name: "Pasta", source: "calendar.mealie_dinner" });
  const g = ml.mlFromGrocy(st("sensor.grocy_meal_plan", "1", { meals: [{ day: "2026-06-27", section: { name: "Lunch" }, recipe: { name: "Salad", base_servings: 3 } }, { day: "2026-06-27", note: "Leftovers" }] }));
  assert.deepEqual(json(g.map((m) => [m.type, m.name, m.servings ?? null])), [
    ["lunch", "Salad", 3],
    ["dinner", "Leftovers", null],
  ]);
});

test("Mealie's entries come from its entities' devices, once each", () => {
  const h = makeHass();
  h.devices.dev_mealie2 = { config_entries: ["mealie2"] };
  h.entities["calendar.mealie_other"] = { platform: "mealie", device_id: "dev_mealie2" };
  assert.deepEqual(json(ml.mlMealieEntries(h, ["calendar.mealie_dinner", "calendar.mealie_lunch", "calendar.mealie_other", "calendar.cookidoo_meal_plan"])), ["mealie1", "mealie2"]);
  assert.deepEqual(json(ml.mlMealieEntries({ entities: {} }, ["calendar.x"])), []);
});

test("aisles: the items of an aisle together, only when the descriptions read like aisles", () => {
  const items = [
    { summary: "A", description: "Produce" },
    { summary: "B", description: "Dairy" },
    { summary: "C", description: "Produce" },
    { summary: "D" },
    { summary: "E", description: "Dairy" },
  ];
  assert.deepEqual(json(ml.mlAisles(items).map((i) => i.summary)), ["B", "E", "A", "C", "D"]);
  const qty = [
    { summary: "A", description: "2 kg" },
    { summary: "B", description: "1" },
    { summary: "C", description: "2 kg" },
  ];
  assert.deepEqual(json(ml.mlAisles(qty).map((i) => i.summary)), ["A", "B", "C"], "quantities are no aisles");
});

test("full card: tonight, lunch, the week as plates, the shopping list", async () => {
  const hass = makeHass();
  const card = await make("meal-card", {}, hass);
  const m = card._items;
  assert.deepEqual(json(hass.ws.map((w) => w.type)), ["call_service", "todo/item/list"], "no admin-only config_entries/get");
  assert.equal(hass.ws[0].service_data.config_entry_id, "mealie1", "the entry of the Mealie device");
  assert.equal(hass.ws[0].service_data.start_date, day(-3), "this week from Monday");
  assert.equal(hass.ws[0].service_data.end_date, day(3));
  assert.deepEqual(json(hass.api.map((p) => p.split("?")[0])), ["calendars/calendar.cookidoo_meal_plan"], "Mealie's calendars are skipped once its action answered");
  assert.equal(m.state, "planned");
  assert.equal(m.tonight.name, "Lemon chicken traybake");
  assert.equal(m.tonight.minutes, 45);
  assert.equal(m.lunch.name, "Lentil & carrot soup");
  assert.equal(m.tomorrow.name, "Homemade pizza");
  assert.equal(m.open, 5);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner"/);
  assert.match(html, /<span class="bpt">Dinner planned<\/span>/);
  assert.match(html, /<div class="subt">Lunch: Lentil &amp; carrot soup<\/div>/);
  assert.match(html, /<span class="dish">Lemon chicken traybake<\/span>/);
  assert.match(html, /45 min/);
  assert.match(html, /Serves 4/);
  assert.equal((html.match(/class="day[ "]/g) || []).length, 7);
  assert.equal((html.match(/class="day past"/g) || []).length, 3);
  assert.match(html, /class="day today"/);
  assert.match(html, /title="Dinner: Thermomix bread"/, "a Cookidoo calendar event");
  assert.match(html, /<div class="tom">Tomorrow: <b>Homemade pizza<\/b><\/div>/);
  assert.match(html, /<span class="cnt">5 left<\/span>/);
  assert.match(html, /data-uid="5"[^>]*>.*Mozzarella<\/span><span class="ia">Dairy<\/span>/, "by aisle: Dairy first");
  assert.ok(html.indexOf('data-uid="5"') < html.indexOf('data-uid="4"') && html.indexOf('data-uid="1"') < html.indexOf('data-uid="3"'), "the bought items last");
  assert.match(html, /class="it done" data-uid="3"/);
  assert.match(html, /class="steam"/, "the pot steams while a dinner is planned");
});

test("ticking an item calls todo.update_item, shown at once", async () => {
  const hass = makeHass();
  const card = await make("meal-card", {}, hass);
  const buttons = [{ dataset: { uid: "1" }, addEventListener(_type, fn) { this.fn = fn; } }];
  card.shadowRoot.querySelectorAll = (s) => (s === ".it[data-uid]" ? buttons : []);
  card._bindAfter(card.shadowRoot);
  buttons[0].fn();
  assert.deepEqual(json(hass.calls.at(-1)), ["todo", "update_item", { entity_id: "todo.mealie_shopping_list", item: "1", status: "completed" }]);
  assert.equal(card._items.open, 4);
});

test("a tick that fails is undone; one the list never reports is undone after a while", async () => {
  const hass = makeHass();
  hass.callService = () => Promise.reject(new Error("unavailable"));
  const card = await make("meal-card", {}, hass);
  const buttons = [{ dataset: { uid: "1" }, addEventListener(_type, fn) { this.fn = fn; } }];
  card.shadowRoot.querySelectorAll = (s) => (s === ".it[data-uid]" ? buttons : []);
  card._bindAfter(card.shadowRoot);
  buttons[0].fn();
  assert.equal(card._items.open, 4, "shown at once");
  await settle();
  assert.equal(card._items.open, 5, "back as it was");
  card._asked.set("2", { status: "completed", at: NOW - 9000 });
  card._sig = null;
  card._render();
  assert.equal(card._items.open, 5, "never reported: the list's own status after 8 s");
  assert.equal(card._asked.size, 0);
});

test("the shopping list is fetched again when an item changes, even with as many left", async () => {
  const hass = makeHass();
  const card = await make("meal-card", {}, hass);
  const lists = () => hass.ws.filter((w) => w.type === "todo/item/list").length;
  const before = lists();
  card.hass = { ...hass, states: { ...hass.states } };
  await settle();
  assert.equal(lists(), before, "nothing changed: no fetch");
  const shop = hass.states["todo.mealie_shopping_list"];
  card.hass = { ...hass, states: { ...hass.states, "todo.mealie_shopping_list": { ...shop, last_updated: "2026-06-25T17:59:00Z" } } };
  await settle();
  assert.equal(lists(), before + 1, "an item renamed: same count, a new last update");
});

test("states: nothing tonight, no meal plan at all, nothing found", async () => {
  const unplanned = await make("meal-card", {}, makeHass({ plan: [[1, "dinner", "Pizza", "", ""]] }));
  assert.equal(unplanned._items.state, "unplanned");
  assert.match(unplanned.shadowRoot.innerHTML, /Nothing planned for tonight/);
  assert.match(unplanned.shadowRoot.innerHTML, /<div class="subt">Tomorrow: Pizza<\/div>/);
  const empty = await make("meal-card", { meal_plan: ["calendar.mealie_dinner"] }, makeHass({ plan: [] }));
  assert.equal(empty._items.state, "empty");
  const none = await make("meal-card", {}, { ...makeHass({ ws: false }), entities: {}, states: {} });
  assert.equal(none._items.state, "empty");
  assert.ok(none._items.none);
  assert.match(none.shadowRoot.innerHTML, /lvl-empty/);
  assert.match(none.shadowRoot.innerHTML, /No meal plan or shopping list found/);
});

test("the next 7 days instead of the week, and an empty shopping list", async () => {
  const hass = makeHass({ items: [] });
  const card = await make("meal-card", { days: "next7" }, hass);
  assert.equal(hass.ws[0].service_data.start_date, day(0));
  assert.equal((card.shadowRoot.innerHTML.match(/class="day past"/g) || []).length, 0);
  assert.match(card.shadowRoot.innerHTML, /Next 7 days/);
  assert.match(card.shadowRoot.innerHTML, /stroke-dasharray="4 4"/, "next Monday: nothing planned");
  assert.match(card.shadowRoot.innerHTML, /Nothing to buy/);
});

test("mini card: tonight and what is left to buy", async () => {
  const card = await make("meal-mini-card");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-planned bn">/);
  assert.match(html, /Tonight: Lemon chicken traybake/);
  assert.match(html, /5 to buy/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="days"/);
});

test("the dark theme darkens the plates and the kitchen", async () => {
  const card = await make("meal-card", {}, makeHass({ themes: { darkMode: true } }));
  assert.match(card.shadowRoot.innerHTML, /<ha-card class="lvl-planned dk">/);
  assert.match(card.shadowRoot.innerHTML, /class="banner night"/);
});

test("plurals: one, two, few and many, by language", () => {
  const t = { en: { x_one: "{n} item", x_many: "{n} items" }, fr: { x_one: "{n} article", x_many: "{n} articles" }, sl: { x_one: "{n} kos", x_two: "{n} kosa", x_few: "{n} kosi", x_many: "{n} kosov" }, pl: { x_one: "{n} rzecz", x_few: "{n} rzeczy", x_many: "{n} rzeczy" }, sr: { x_one: "{n} ствар", x_few: "{n} ствари", x_many: "{n} ствари" } };
  const k = (lang, n) => ml.rcPluralKey(t, lang, "x", n);
  assert.deepEqual([k("en", 1), k("en", 2), k("en", 0)], ["x_one", "x_many", "x_many"]);
  assert.deepEqual([k("fr", 0), k("fr", 1), k("fr", 2)], ["x_one", "x_one", "x_many"], "French: 0 and 1 are singular");
  assert.deepEqual([k("sl", 1), k("sl", 2), k("sl", 3), k("sl", 5), k("sl", 102)], ["x_one", "x_two", "x_few", "x_many", "x_two"], "Slovenian dual");
  assert.equal(ml.rcPluralKey({ sl: { x_one: "", x_few: "", x_many: "" } }, "sl", "x", 2), "x_few", "no dual: the few form");
  assert.deepEqual([k("pl", 2), k("pl", 5), k("pl", 22)], ["x_few", "x_many", "x_few"]);
  assert.equal(k("sr", 21), "x_one");
});

test("the counts agree with their number", async () => {
  const one = await make("meal-card", { language: "fr" }, makeHass({ items: [{ uid: "1", summary: "Pain", status: "needs_action" }] }));
  assert.match(one.shadowRoot.innerHTML, /<span class="cnt">1 restant<\/span>/);
  const two = await make("meal-card", { language: "fr" }, makeHass({ items: [{ uid: "1", summary: "Pain", status: "needs_action" }, { uid: "2", summary: "Lait", status: "needs_action" }] }));
  assert.match(two.shadowRoot.innerHTML, /<span class="cnt">2 restants<\/span>/);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(ml.ML_I18N.en);
  for (const [lang, table] of Object.entries(ml.ML_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(ml.ML_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (ml.customElements.get("meal-card-editor"))();
  ed.setConfig({ type: "custom:meal-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["meal_plan", "shopping_list", "days", "shopping_limit", "show_week", "show_shopping", "illustration_theme", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:meal-card", days: "week", shopping_limit: 8, show_week: true, shopping_list: "todo.mealie_shopping_list" } } });
  assert.deepEqual(json(out), { type: "custom:meal-card", shopping_list: "todo.mealie_shopping_list" });
});

// ── Editing (Mealie) ──────────────────────────────────────────────────────────
// A card whose shadow root keeps the nodes of every selector, so a test can click what the card bound.
const clickable = (card) => {
  const nodes = {};
  const node = (key, dataset = {}) => (nodes[key] ||= { ...fakeNode(), dataset, value: "" });
  card.shadowRoot.querySelector = (s) => node(s);
  card.shadowRoot.querySelectorAll = (s) => {
    const html = card.shadowRoot.innerHTML;
    if (s === ".day[data-day]") return [...html.matchAll(/data-day="([^"]+)"/g)].map(([, d]) => node(`day:${d}`, { day: d }));
    if (s === ".slot[data-type]") return [...html.matchAll(/data-type="([^"]+)"/g)].map(([, t]) => node(`slot:${t}`, { type: t }));
    if (s === ".res[data-rid]") return [...html.matchAll(/data-rid="([^"]+)"/g)].map(([, r]) => node(`res:${r}`, { rid: r }));
    return [];
  };
  return (key) => {
    card._bindAfter(card.shadowRoot);
    return nodes[key]?.listeners;
  };
};

test("the editing popup: a day's slots, a recipe searched, picked and saved with set_mealplan", async () => {
  const hass = makeHass();
  hass.callService = async function (domain, service, data) {
    this.calls.push([domain, service, data]);
  };
  const card = await make("meal-card", {}, hass);
  assert.equal(card._items.edit, true, "Mealie answered: editable");
  assert.match(card.shadowRoot.innerHTML, /<button class="day past" data-day="2026-06-22"/);
  const on = clickable(card);
  on(`day:${day(2)}`).click();
  let html = card.shadowRoot.innerHTML;
  assert.match(html, /class="pop" role="dialog"/);
  assert.equal((html.match(/class="slot"/g) || []).length, 4, "breakfast, lunch, dinner, side");
  on("slot:dinner").click();
  await settle();
  html = card.shadowRoot.innerHTML;
  assert.match(html, /data-rid="c1"/);
  assert.match(html, /data-k="ed-left"/, "the meal before can be had as leftovers");
  on('[data-k="ed-q"]').input({ target: { value: "coco" } });
  await new Promise((r) => setTimeout(r, 350));
  await settle();
  html = card.shadowRoot.innerHTML;
  assert.doesNotMatch(html, /data-rid="c1"/);
  assert.match(html, /data-rid="c2"/);
  on("res:c2").click();
  assert.match(card.shadowRoot.innerHTML, /class="res sel" data-rid="c2"/);
  on('[data-k="ed-save"]').click();
  await settle();
  assert.deepEqual(json(hass.calls.at(-1)), ["mealie", "set_mealplan", { config_entry_id: "mealie1", date: day(2), entry_type: "dinner", recipe_id: "c2" }]);
  assert.equal(card._edit, null, "closed once saved");
  assert.ok(hass.ws.filter((w) => w.service === "get_mealplan").length >= 2, "the meal plan fetched again");
});

test("editing a planned slot updates it; clear deletes it; leftovers and random", async () => {
  const hass = makeHass();
  hass.callService = async function (domain, service, data) {
    this.calls.push([domain, service, data]);
  };
  const card = await make("meal-card", {}, hass);
  const open = (d, type) => {
    const on = clickable(card);
    on(`day:${d}`).click();
    on(`slot:${type}`).click();
    return clickable(card);
  };
  let on = open(day(1), "dinner");
  on('[data-k="ed-q"]').input({ target: { value: "Pizza night" } });
  on('[data-k="ed-save"]').click();
  await settle();
  assert.deepEqual(
    json(hass.calls.slice(-2)),
    [
      ["mealie", "delete_mealplan", { config_entry_id: "mealie1", mealplan_id: 105 }],
      ["mealie", "set_mealplan", { config_entry_id: "mealie1", date: day(1), entry_type: "dinner", note_title: "Pizza night" }],
    ],
    "a typed text without a recipe is a note; replacing a recipe, a new entry",
  );
  on = open(day(0), "lunch");
  await settle();
  clickable(card)("res:c1").click();
  clickable(card)('[data-k="ed-save"]').click();
  await settle();
  assert.deepEqual(json(hass.calls.at(-1)), ["mealie", "update_mealplan", { config_entry_id: "mealie1", mealplan_id: 104, date: day(0), entry_type: "lunch", recipe_id: "c1" }], "a recipe over a recipe: updated");
  on = open(day(0), "dinner");
  on('[data-k="ed-clear"]').click();
  await settle();
  assert.deepEqual(json(hass.calls.at(-1)), ["mealie", "delete_mealplan", { config_entry_id: "mealie1", mealplan_id: 103 }]);
  on = open(day(2), "lunch");
  on('[data-k="ed-left"]').click();
  await settle();
  assert.deepEqual(json(hass.calls.at(-1)), ["mealie", "set_mealplan", { config_entry_id: "mealie1", date: day(2), entry_type: "lunch", note_title: "Leftovers: Homemade pizza" }]);
  on = open(day(3), "dinner");
  on('[data-k="ed-rand"]').click();
  await settle();
  assert.deepEqual(json(hass.calls.slice(-2).map((c) => c[1])), ["delete_mealplan", "set_random_mealplan"]);
});

test("a change Mealie refuses keeps the popup open with an error; no Mealie, or edit: false, no editing", async () => {
  const hass = makeHass();
  hass.callService = () => Promise.reject(new Error("refused"));
  const card = await make("meal-card", {}, hass);
  const on = clickable(card);
  on(`day:${day(2)}`).click();
  clickable(card)("slot:dinner").click();
  await settle();
  clickable(card)('[data-k="ed-rand"]').click();
  await settle();
  assert.equal(card._edit.err, true);
  assert.match(card.shadowRoot.innerHTML, /class="err" role="alert"/);
  assert.ok(hass.ws.filter((w) => w.service === "get_mealplan").length >= 2, "fetched again after a refusal (a change may be half done)");
  card.disconnectedCallback();
  assert.equal(card._edit, null, "leaving the page closes the popup");
  const off = await make("meal-card", { edit: false });
  assert.equal(off._items.edit, false);
  assert.doesNotMatch(off.shadowRoot.innerHTML, /data-day=/);
  const cal = await make("meal-card", {}, makeHass({ ws: false }));
  assert.equal(cal._items.edit, false, "calendars only: read only");
});

test("mlRecipes and mlBefore", () => {
  assert.deepEqual(json(ml.mlRecipes({ recipes: { items: [{ recipe_id: "a", name: "A", total_time: "PT10M" }, { name: "no id" }] } })), [{ id: "a", name: "A", minutes: 10 }]);
  const meals = [
    { day: "2026-06-24", type: "dinner", name: "Tacos" },
    { day: "2026-06-25", type: "lunch", name: "Soup" },
    { day: "2026-06-25", type: "dinner", name: "Chicken" },
  ];
  assert.equal(ml.mlBefore(meals, "2026-06-25", "dinner").name, "Soup");
  assert.equal(ml.mlBefore(meals, "2026-06-25", "lunch").name, "Tacos");
  assert.equal(ml.mlBefore(meals, "2026-06-24", "breakfast"), null);
});

test("a fetch asked for while one runs runs again once it's done", async () => {
  const hass = makeHass();
  const card = await make("meal-card", {}, hass);
  const n = () => hass.ws.filter((w) => w.service === "get_mealplan").length;
  const before = n();
  const first = card._fetch();
  await card._fetch();
  assert.equal(card._again, true);
  await first;
  await settle();
  assert.equal(n(), before + 2);
  assert.equal(card._again, false);
});
