/**
 * meal-card / meal-mini-card: the week's meal plan and the shopping list. Tonight's dinner first, today's lunch, the
 * week day by day as plates, and the shopping list to tick off.
 * https://github.com/juju35/ha-meal-card
 */

// The badge's icon of each state (its colour is the stylesheet's).
const ML_ICONS = { planned: "mdi:silverware-fork-knife", unplanned: "mdi:silverware-fork-knife", empty: "mdi:silverware-fork-knife", none: "mdi:silverware-fork-knife" };
// One loop of the banner's animation (s): the steam rises from the pot while a dinner is planned.
const ML_LOOP = 3;
// How often the meal plan and the shopping list are fetched again (ms), and at each new day.
const ML_REFRESH = 10 * 60 * 1000;
// A shopping item ticked off shows as such at once, until the list reports it (or for this long); back as it was
// when the action fails.
const ML_OPTIMISTIC = 8000;
// The colours a plate's food is drawn with, picked from the dish's name.
const ML_FOOD = ["#f59f00", "#e8590c", "#7cb87a", "#ffd43b", "#e03131", "#ffa94d", "#c2410c", "#74c0fc", "#a9e34b", "#f783ac"];

// A plate seen from above, its food in colours picked from the dish's name (the same dish, the same plate); an empty
// day is a dashed circle.
const mlPlate = (name, size) => {
  if (!name)
    return `<svg class="plate" width="${size}" height="${size}" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" fill="none" stroke="var(--ml-line)" stroke-width="2" stroke-dasharray="4 4"/></svg>`;
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const col = (k) => ML_FOOD[(h >>> (k * 3)) % ML_FOOD.length];
  return `<svg class="plate" width="${size}" height="${size}" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="27" fill="var(--ml-plate)" stroke="var(--ml-line)" stroke-width="2"/><circle cx="28" cy="28" r="19" fill="var(--ml-plate-in)"/><circle cx="23" cy="25" r="8" fill="${col(0)}"/><circle cx="33" cy="31" r="7" fill="${col(1)}"/><circle cx="31" cy="21" r="3.5" fill="${col(2)}"/><circle cx="22" cy="34" r="3" fill="${col(3)}"/></svg>`;
};

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's scene: a kitchen corner, 200 × 80, drawn to the banner's right edge. A tiled wall, a shelf
// of jars, the worktop with a chopping board of vegetables and a pot on the stove; the steam rises from the pot while
// a dinner is planned. By night (the dark theme), darker.
const mlScene = ({ night, cooking, animate }) => {
  const [joint, shelf, top, edge, pot, lid, board] = night
    ? ["#363a40", "#5a4d40", "#3a3f45", "#4a5058", "#8a96a6", "#a7b0bc", "#6b5440"]
    : ["#ead7c3", "#b99672", "#efe4d6", "#d8c6b0", "#4a5568", "#2d3748", "#c8915c"];
  const rows = [20, 32, 44, 56].map((y) => `<line x1="20" y1="${y}" x2="200" y2="${y}"/>`).join("");
  const cols = [40, 70, 100, 130, 160, 190].map((x) => `<line x1="${x}" y1="8" x2="${x}" y2="62"/>`).join("");
  const jars = [
    [64, 4, 10, "#e8c07a"],
    [76, 2, 12, "#7cb87a"],
    [88, 5, 9, "#d4537e"],
    [100, 3, 11, "#f5b400"],
  ]
    .map(([x, y, hgt, c]) => `<rect x="${x}" y="${y}" width="8" height="${hgt}" rx="2" fill="${c}" opacity="${night ? 0.7 : 1}"/>`)
    .join("");
  const steam = cooking
    ? [134, 143, 152]
        .map((x, i) => {
          const rise = animate
            ? `<animateTransform attributeName="transform" type="translate" values="0 2;0 -5" dur="${ML_LOOP}s" begin="${(-i * ML_LOOP) / 3}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.9;0" dur="${ML_LOOP}s" begin="${(-i * ML_LOOP) / 3}s" repeatCount="indefinite"/>`
            : "";
          return `<path class="steam" d="M${x} 38 q3 -5 0 -10" stroke="${night ? "#7d8691" : "#c9b8a6"}" stroke-width="1.6" fill="none" stroke-linecap="round">${rise}</path>`;
        })
        .join("")
    : "";
  return `<g stroke="${joint}" stroke-width=".8">${rows}${cols}</g>
    <rect x="60" y="14" width="56" height="3" fill="${shelf}"/>${jars}
    <rect x="20" y="62" width="180" height="18" fill="${top}"/><rect x="20" y="60" width="180" height="3" fill="${edge}"/>
    <path d="M126 44 h34 v12 a6 6 0 0 1 -6 6 h-22 a6 6 0 0 1 -6 -6z" fill="${pot}"/><rect x="122" y="42" width="42" height="4" rx="2" fill="${lid}"/>
    ${steam}
    <rect x="44" y="54" width="44" height="7" rx="2" fill="${board}"/><circle cx="56" cy="52" r="4" fill="#f76707"/><circle cx="66" cy="53" r="3" fill="#7cb87a"/><circle cx="75" cy="52" r="3.5" fill="#e03131"/>`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const mlPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

const ML_SVG = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 19"/>',
  cart: '<path d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h8.2a1.5 1.5 0 0 0 1.4-1l1.9-6.3H6.2"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  off: '<circle cx="12" cy="12" r="8.5"/>',
  on: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M8 12.4l2.7 2.6L16.2 9.5" stroke="var(--ml-check)"/>',
};
const mlIcon = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

// ── Card ─────────────────────────────────────────────────────────────────────
class MealCard extends RcCard {
  static tag = "meal-card";
  static i18n = ML_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, show_week: true, show_shopping: true, animations: true, days: "week", shopping_limit: 8 };

  // The meal plans and the shopping list of the home.
  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 7;
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._timer ??= setInterval(() => this._fetch(), ML_REFRESH);
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._timer);
    this._timer = undefined;
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  // The meal plan sources: `meal_plan` (one entity or a list), else the home's Mealie, Cookidoo and Grocy ones.
  _plans() {
    const p = this._config.meal_plan;
    if (p) return (Array.isArray(p) ? p : [p]).filter(Boolean);
    const h = this._hass;
    return rcMemo((this._memo ||= {}), "plans", [h.entities], () => mlPlans(h));
  }

  _shoppingId() {
    const h = this._hass;
    return this._config.shopping_list || rcMemo((this._memo ||= {}), "shop", [h.entities], () => mlShopping(h));
  }

  // The days shown: this week from Monday, or the next 7 days from today.
  _days(now) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    if (this._config.days !== "next7") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      return x.getTime();
    });
  }

  // The meal plan and the shopping list from Home Assistant: Mealie's get_mealplan action (per Mealie entry), the
  // calendars' events (Mealie's are skipped once its action answered), the shopping list's items.
  async _fetch() {
    const h = this._hass;
    if (!h?.callWS || this._busy) return;
    this._busy = true;
    const now = Date.now();
    try {
      const days = this._days(now);
      const start = new Date(days[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(days[6]);
      end.setHours(23, 59, 59, 0);
      const meals = [];
      const plans = this._plans();
      let mealie = false;
      // Mealie's entries from its entities' devices (any user can read them; config_entries/get is admin only).
      const entries = mlMealieEntries(h, plans);
      const answers = await Promise.all(
        entries.map((entry) =>
          h
            .callWS({
              type: "call_service",
              domain: "mealie",
              service: "get_mealplan",
              service_data: { config_entry_id: entry, start_date: mlDay(start), end_date: mlDay(end) },
              return_response: true,
            })
            .catch(() => null),
        ),
      );
      answers.forEach((r, i) => {
        if (!r?.response) return;
        mealie = true;
        meals.push(...mlFromMealie(r.response, entries[i]));
      });
      const range = `start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
      const calendars = h.callApi ? plans.filter((x) => x.startsWith("calendar.") && !(mealie && h.entities?.[x]?.platform === "mealie")) : [];
      const shop = this._shoppingId();
      const [events, list] = await Promise.all([
        Promise.all(calendars.map((id) => h.callApi("GET", `calendars/${id}?${range}`).catch(() => null))),
        shop ? h.callWS({ type: "todo/item/list", entity_id: shop }).catch(() => null) : null,
      ]);
      events.forEach((evs, i) => {
        for (const ev of evs || []) {
          const m = mlFromEvent(ev, calendars[i]);
          if (m) meals.push(m);
        }
      });
      const items = list?.items || null;
      this._ws = { meals, items, shop, day: mlDay(now), todo: mlListSig(h.states[shop]), at: now };
    } finally {
      this._busy = false;
    }
    this._sig = null;
    this._render();
  }

  _dur(n) {
    if (n == null) return "";
    if (n < 60) return this._t("dur_min", { n });
    return n % 60 ? this._t("dur_hm", { h: Math.floor(n / 60), m: String(n % 60).padStart(2, "0") }) : this._t("dur_h", { h: n / 60 });
  }

  _weekday(t) {
    try {
      return mlIntl(Intl.DateTimeFormat, this._lang(), { weekday: "short" }).format(new Date(t));
    } catch {
      return new Date(t).toDateString().slice(0, 3);
    }
  }

  // The meal plan of the days shown, today's meals, and the shopping list.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const now = Date.now();
    const ws = this._ws;
    const shop = this._shoppingId();
    // Fetched at first, every ML_REFRESH, at each new day, and when the shopping list changes (an item added, ticked,
    // renamed or moved to another aisle: its state or its last update).
    if (h.callWS && !this._busy && (!ws || ws.day !== mlDay(now) || ws.shop !== shop || ws.todo !== mlListSig(h.states[shop]))) this._fetch();
    const plans = this._plans();
    const meals = [...(ws?.meals || [])];
    for (const id of plans.filter((x) => x.startsWith("sensor."))) meals.push(...mlFromGrocy(h.states[id]));
    // The first meal of each type and day (a calendar repeating Mealie's is ignored).
    const byDay = new Map();
    for (const m of meals) {
      const d = byDay.get(m.day) || {};
      if (!d[m.type]) d[m.type] = m;
      byDay.set(m.day, d);
    }
    const today = mlDay(now);
    const tomorrow = mlDay(new Date(now).setDate(new Date(now).getDate() + 1));
    const t = byDay.get(today) || {};
    const next = byDay.get(tomorrow) || {};
    const days = this._days(now).map((d) => {
      const k = mlDay(d);
      const day = byDay.get(k) || {};
      return { t: d, key: k, today: k === today, past: k < today, main: day.dinner || day.lunch || day.breakfast || day.side || null, meals: ML_TYPES.map((type) => day[type]).filter(Boolean) };
    });
    const items = this._overlay(ws?.items || null, now);
    const open = items ? items.filter((i) => i.status !== "completed") : [];
    const done = items ? items.filter((i) => i.status === "completed") : [];
    const limit = Math.max(1, Number(c.shopping_limit) || 8);
    const shown = [...mlAisles(open), ...done].slice(0, limit);
    const any = plans.length > 0 || !!shop;
    const state = !any ? "none" : t.dinner ? "planned" : byDay.size ? "unplanned" : "empty";
    return {
      none: state === "none",
      state,
      name: c.title || this._t("title"),
      tonight: t.dinner || null,
      lunch: t.lunch || null,
      tomorrow: next.dinner || next.lunch || null,
      days,
      shop,
      items,
      open: open.length,
      shown,
      plan: plans[0] || null,
    };
  }

  // The shopping items with the ticks not reported yet by the list (for ML_OPTIMISTIC at most).
  _overlay(items, now) {
    const asked = this._asked;
    if (!items || !asked?.size) return items;
    for (const [uid, a] of asked) {
      const item = items.find((i) => i.uid === uid);
      if (!item || item.status === a.status || now - a.at > ML_OPTIMISTIC) asked.delete(uid);
    }
    return items.map((i) => (asked.has(i.uid) ? { ...i, status: asked.get(i.uid).status } : i));
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // The banner's night: forced by `illustration_theme`, else Home Assistant's dark theme alone.
  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  // The illustrated header: the badge, the title and `sub` on the kitchen wall at the left, the kitchen corner at the
  // right, a 10 px wooden strip edge to edge. `ring`: the mini card's ring around the badge.
  _banner(m, sub, ring = "", pill = "") {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const scene = mlScene({ night, cooking: m.state === "planned", animate: this._animate() });
    const chip = pill ? `<span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>` : "";
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge">${ring}<ha-icon icon="${ML_ICONS[m.state]}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${chip}</div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${scene}</svg>
        <div class="ground"></div>
      </div>`;
  }

  // The status pill's place, on the banner and on the classic header (see mlPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      mlPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  _sub(m) {
    if (m.lunch) return this._t("sub_lunch", { v: m.lunch.name });
    return m.tomorrow ? this._t("tomorrow_meal", { v: m.tomorrow.name }) : "";
  }

  _meta(meal) {
    const parts = [];
    if (meal.minutes != null) parts.push(`<span>${mlIcon(ML_SVG.clock)}${rcEsc(this._dur(meal.minutes))}</span>`);
    if (meal.servings != null) parts.push(`<span>${mlIcon(ML_SVG.people)}${rcEsc(this._t("servings", { n: meal.servings }))}</span>`);
    return parts.length ? `<span class="meta">${parts.join("")}</span>` : "";
  }

  // Tonight's dinner in big, today's lunch on a line.
  _today(m) {
    const hero = m.tonight
      ? `<button class="box hero" data-id="${rcEsc(m.tonight.source?.includes(".") ? m.tonight.source : m.plan || "")}">${mlPlate(m.tonight.name, 72)}<span class="ht"><span class="lbl">${rcEsc(this._t("tonight"))}</span><span class="dish">${rcEsc(m.tonight.name)}</span>${this._meta(m.tonight)}</span></button>`
      : `<div class="box hero empty">${mlPlate(null, 56)}<span class="ht"><span class="lbl">${rcEsc(this._t("tonight"))}</span><span class="dish none">${rcEsc(this._t("nothing_tonight"))}</span></span></div>`;
    const lunch = m.lunch
      ? `<div class="box row">${mlPlate(m.lunch.name, 36)}<span class="rt"><span class="rl">${rcEsc(this._t("lunch"))}</span><span class="rn">${rcEsc(m.lunch.name)}</span></span>${m.lunch.minutes != null ? `<span class="rm">${rcEsc(this._dur(m.lunch.minutes))}</span>` : ""}</div>`
      : "";
    return hero + lunch;
  }

  // The days shown, a plate each (dashed when nothing is planned), today marked, the past faded.
  _week(m) {
    if (this._config.show_week === false) return "";
    const cells = m.days
      .map((d) => {
        const title = d.meals.length ? d.meals.map((x) => `${this._t(x.type)}: ${x.name}`).join("\n") : this._t("nothing_day");
        return `<div class="day${d.today ? " today" : ""}${d.past ? " past" : ""}" title="${rcEsc(title)}"><span class="dn">${rcEsc(this._weekday(d.t))}</span>${mlPlate(d.main?.name, 28)}</div>`;
      })
      .join("");
    const tom = m.tomorrow ? `<div class="tom">${rcEsc(this._t("tomorrow_meal", { v: "" }).trim())} <b>${rcEsc(m.tomorrow.name)}</b></div>` : "";
    return `<div class="box wk"><div class="bh"><span>${rcEsc(this._t(this._config.days === "next7" ? "next_days" : "this_week"))}</span></div><div class="days">${cells}</div>${tom}</div>`;
  }

  // The shopping list to tick off: what is left first (by aisle when the items carry one), then what was bought.
  _shopping(m) {
    if (this._config.show_shopping === false || !m.shop || !m.items) return "";
    const head = `<div class="bh">${mlIcon(ML_SVG.cart)}<span>${rcEsc(this._t("shopping"))}</span>${m.items.length ? `<span class="cnt">${rcEsc(this._t("left", { n: m.open }))}</span>` : ""}</div>`;
    if (!m.items.length) return `<div class="box sh">${head}<div class="nothing">${rcEsc(this._t("nothing_to_buy"))}</div></div>`;
    const row = (i) => {
      const done = i.status === "completed";
      const note = i.description ? `<span class="ia">${rcEsc(i.description)}</span>` : "";
      return `<button class="it${done ? " done" : ""}" data-uid="${rcEsc(i.uid)}" aria-pressed="${done}" aria-label="${rcEsc(this._t(done ? "mark_needed" : "mark_bought", { v: i.summary }))}">${mlIcon(done ? ML_SVG.on : ML_SVG.off)}<span class="in">${rcEsc(i.summary)}</span>${note}</button>`;
    };
    return `<div class="box sh">${head}${m.shown.map(row).join("")}</div>`;
  }

  _draw(m) {
    const c = this._config;
    const status = this._t(`st_${m.state === "none" ? "empty" : m.state}`);
    const parts = [m.state, m.tonight, m.lunch, m.tomorrow, m.days, m.shown, m.open, this._night(), this._dark()];
    if (!this._changed(parts)) return;
    const sub = this._sub(m);
    const subHtml = c.show_subtitle !== false && sub ? `<div class="subt">${rcEsc(sub)}</div>` : "";
    const head =
      c.illustration !== false
        ? this._banner(m, subHtml, "", m.none ? "" : status)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="${ML_ICONS[m.state]}"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${m.none ? "" : `<span class="pill" title="${rcEsc(status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`}</div>${subHtml}</div>
          </div>`;
    const dk = this._dark() ? " dk" : "";
    if (m.none) {
      this._paint("none", `${head}<div class="box nothing">${rcEsc(this._t("none"))}</div>`, "", dk);
      this._fitPill();
      return;
    }
    this._paint(m.state, head + this._today(m) + this._week(m) + this._shopping(m), "", dk);
    this._fitPill();
  }

  _bindAfter(root) {
    const m = this._items;
    root.querySelector(".hero[data-id]")?.addEventListener("click", (ev) => {
      const id = ev.currentTarget?.dataset?.id;
      if (id) rcMoreInfo(this, id);
    });
    for (const b of root.querySelectorAll(".it[data-uid]") || [])
      b.addEventListener("click", () => {
        const item = m?.items?.find((i) => i.uid === b.dataset.uid);
        if (!item) return;
        const status = item.status === "completed" ? "needs_action" : "completed";
        // Shown at once; the list is fetched again when the to-do list reports the change, and the tick is undone
        // when the action fails.
        const asked = (this._asked ||= new Map());
        asked.set(item.uid, { status, at: Date.now() });
        const redraw = () => {
          this._sig = null;
          this._render();
        };
        redraw();
        Promise.resolve(this._hass.callService("todo", "update_item", { entity_id: m.shop, item: item.uid, status })).catch(() => {
          asked.delete(item.uid);
          redraw();
        });
      });
  }

  static styles = `
    :host { --ml-plate: #ffffff; --ml-plate-in: #fbf3ea; --ml-line: #ead7c3; --ml-check: #ffffff; --ml-acc: #f76707; }
    ha-card.dk { --ml-plate: #2b2f34; --ml-plate-in: #34383e; --ml-line: #4a4f56; --ml-check: #1c1c1c; }
    ha-card.lvl-planned { --c: #f76707; }
    ha-card.lvl-unplanned { --c: #f59f00; }
    ha-card.lvl-empty, ha-card.lvl-none { --c: var(--rc-idle); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .box { all: unset; box-sizing: border-box; display: block; width: 100%; margin-top: 10px; border-radius: 12px; padding: 10px 12px;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .nothing { font-size: 13px; color: var(--secondary-text-color); }
    .sh .nothing { padding: 2px 4px 4px; }
    .box.nothing { margin-top: 10px; }
    .plate { flex: none; display: block; }
    .hero { display: flex; align-items: center; gap: 14px; padding: 12px; margin-top: 12px; }
    button.hero { cursor: pointer; }
    button.hero:focus-visible, .it:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .ht { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
    .lbl { font-size: 12px; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; color: color-mix(in srgb, var(--ml-acc) 70%, var(--primary-text-color, #212121)); }
    .dish { font-size: 20px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color); overflow-wrap: anywhere; }
    .dish.none { font-size: 15px; font-weight: 400; color: var(--secondary-text-color); }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 13px; color: var(--secondary-text-color); }
    .meta span { display: inline-flex; align-items: center; gap: 4px; }
    .meta svg { width: 15px; height: 15px; color: var(--ml-acc); }
    .row { display: flex; align-items: center; gap: 10px; }
    .rt { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .rl { font-size: 12px; color: var(--secondary-text-color); }
    .rn { font-size: 15px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rm { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; }
    .bh { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--secondary-text-color); margin-bottom: 8px; }
    .bh svg { width: 16px; height: 16px; color: var(--ml-acc); flex: none; }
    .bh .cnt { margin-left: auto; }
    .days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .day { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 2px; border-radius: 10px; min-width: 0;
           background: var(--card-background-color, #fff); }
    .day.today { background: color-mix(in srgb, var(--ml-acc) 18%, var(--card-background-color, #fff)); }
    .day.today .dn { color: color-mix(in srgb, var(--ml-acc) 55%, var(--primary-text-color, #212121)); }
    .day.past { opacity: .5; }
    .dn { font-size: 11px; font-weight: 500; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .dn::first-letter { text-transform: uppercase; }
    .tom { margin-top: 8px; font-size: 13px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tom b { font-weight: 500; }
    .sh { padding: 8px 10px; }
    .sh .bh { padding: 2px 4px 2px; margin-bottom: 2px; }
    .it { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 4px; border-radius: 8px; }
    .it:hover { background: color-mix(in srgb, var(--ml-acc) 8%, transparent); }
    .it svg { flex: none; width: 20px; height: 20px; color: var(--secondary-text-color); opacity: .7; }
    .it.done svg { color: var(--ml-acc); opacity: 1; }
    .in { flex: 1; min-width: 0; font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .it.done .in { text-decoration: line-through; color: var(--secondary-text-color); }
    .ia { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; }
    @container (max-width: 340px) {
      .hero { gap: 10px; }
      .hero .plate { width: 56px; height: 56px; }
      .dish { font-size: 17px; }
      .days { gap: 2px; }
      .day { padding: 4px 1px; }
      .day .plate { width: 22px; height: 22px; }
    }
    /* Illustrated header (banner): 90 px, edge to edge, the title on the kitchen wall, the kitchen corner at the right,
       a 10 px wooden strip at the bottom. The badge's icon is in the state's colour, grey when idle, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #fbf3ea 0%, #f5e6d6 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #2a2d32 0%, #23262a 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .lvl-empty .banner, .lvl-none .banner { --ic: #6b7680; }
    .lvl-empty .banner.night, .lvl-none .banner.night { --ic: #a7b0b8; }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #b08259 0 30px, #a57650 30px 60px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #5a4330 0 30px, #4e3a29 30px 60px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see mlPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the wall. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the scene is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; max-width: 100%; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.62); }
    .banner .r.acc { color: color-mix(in srgb, var(--ml-acc) 60%, #10283f); background: color-mix(in srgb, var(--ml-acc) 16%, rgba(255,255,255,.7)); }
    .banner.night .r { background: rgba(10,20,40,.4); }
    .banner.night .r.acc { color: color-mix(in srgb, var(--ml-acc) 45%, #fff); background: color-mix(in srgb, var(--ml-acc) 22%, rgba(10,20,40,.5)); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const mlSchema = (booleans) => (lang) => [
  { name: "meal_plan", selector: { entity: { multiple: true, domain: ["calendar", "sensor"] } } },
  { name: "shopping_list", selector: { entity: { domain: "todo" } } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "days", selector: { select: { mode: "dropdown", options: ["week", "next7"].map((value) => ({ value, label: rcT(ML_I18N, lang, `ed_days_${value}`) })) } } },
  { name: "shopping_limit", selector: { number: { min: 1, max: 30, step: 1, mode: "box" } } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(ML_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(ML_I18N, lang, "language"),
];

const ML_HELPERS = ["meal_plan", "shopping_list", "title", "shopping_limit", "zoom", "language"];

const MealCardEditor = rcEditor({
  card: MealCard,
  helpers: ML_HELPERS,
  schema: mlSchema(["show_title", "show_subtitle", "illustration", "show_week", "show_shopping", "animations"]),
});

rcRegister(MealCard, MealCardEditor, "Meal Card", "The week's meal plan and the shopping list: tonight's dinner, the week as plates, and the shopping list to tick off");

// ── Mini card ────────────────────────────────────────────────────────────────
// The meals on two lines: the badge, the title and the state, then tonight's dinner and what is left to buy as chips;
// the zoom button opens the full card in place.
class MealMiniCard extends rcMini(MealCard, "meal-mini-card", "") {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    const night = this._night();
    if (!this._changed(["mini", m.state, m.tonight?.name, m.tomorrow?.name, m.open, !!m.items, night, this._dark()])) return;
    const status = this._t(`st_${m.state === "none" ? "empty" : m.state}`);
    const chip = (text, cls = "") => `<button class="r${cls}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const chips = m.none
      ? chip(this._t("none"))
      : [
          m.tonight ? chip(this._t("chip_tonight", { v: m.tonight.name })) : m.tomorrow ? chip(this._t("tomorrow_meal", { v: m.tomorrow.name })) : "",
          m.items ? chip(m.open ? this._t("to_buy", { n: m.open }) : this._t("nothing_to_buy"), " acc") : "",
        ].join("");
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} bn${this._dark() ? " dk" : ""}">${this._banner(m, chips ? `<div class="rs">${chips}</div>` : "", "", m.none ? "" : status)}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    this._fitPill();
  }
}

const MealMiniCardEditor = rcEditor({
  card: MealMiniCard,
  helpers: ML_HELPERS,
  schema: mlSchema(["show_title", "show_subtitle", "illustration", "show_week", "show_shopping", "animations", "zoom"]),
});

rcRegister(MealMiniCard, MealMiniCardEditor, "Meal Mini Card", "The meals on two lines: tonight's dinner and what is left to buy, with a zoom to the full card");
