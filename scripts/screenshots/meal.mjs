// Renders the meal cards with a mock meal plan and shopping list and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/meal.mjs
import { pair, shoot } from "./harness.mjs";
import { pageScript, setup } from "./mock.mjs";

// Stills: animations: false keeps the steam where it is, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
// The editing popup (Mealie): ml-edit-day (a day's meals) and ml-edit-recipe (the recipe search for its dinner).
const ws = pageScript();
await shoot({
  prefix: "ml",
  tag: "meal-card",
  shots: [...still("planned", { scene: "planned" }), ...still("unplanned", { scene: "unplanned" }), ...still("done", { scene: "done", config: { days: "next7" } }), ...still("narrow", { scene: "planned", width: 300 }), ...still("edit-day", { scene: "planned", open: `.day[data-day="2026-06-27"]` }), ...still("edit-recipe", { scene: "planned", open: [`.day[data-day="2026-06-27"]`, `.slot[data-type="dinner"]`] })],
  setup,
  ws,
});
await shoot({
  prefix: "ml-mini",
  tag: "meal-mini-card",
  shots: [...still("planned", { scene: "planned" }), ...still("unplanned", { scene: "unplanned" }), ...still("zoom", { scene: "planned", open: ".zoom" })],
  setup,
  ws,
});
