/**
 * Shared by the meal cards (its names are used by the other src/ files): the meal plan's and shopping list's sources, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-meal-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── Meals ────────────────────────────────────────────────────────────────────
// The meal plan comes from Mealie (its get_mealplan action, with the recipes' times and servings), from calendars
// (Mealie's per meal type, Cookidoo's, or any listed in `meal_plan`) and from Grocy's meal plan sensor (its `meals`
// attribute). The shopping list is a to-do list: `shopping_list`, else the first one of a shopping integration.
const ML_TYPES = ["breakfast", "lunch", "dinner", "side"];
const ML_PLAN_PLATFORMS = ["mealie", "cookidoo", "grocy"];
const ML_SHOP_PLATFORMS = ["mealie", "bring", "ourgroceries", "kitchenowl", "grocy", "cookidoo", "shopping_list"];

// The meal type a name says (an entity id, a calendar, a Grocy section, a Mealie entry type), else `fallback`.
const mlType = (text, fallback = "dinner") => {
  const t = String(text || "").toLowerCase();
  if (/breakfast|petit.?d[ée]j|fr[üu]hst[üu]ck|desayuno|colazione|ontbijt|śniadanie/.test(t)) return "breakfast";
  if (/lunch|d[ée]jeuner|mittag|almuerzo|comida|pranzo|obiad|middag/.test(t)) return "lunch";
  if (/\bside|accompagnement|beilage/.test(t)) return "side";
  if (/dinner|d[îi]ner|supper|abend|cena|souper|kolacja|avondeten/.test(t)) return "dinner";
  return fallback;
};

// "YYYY-MM-DD" of a date, in the browser's time zone.
const mlDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// A duration in minutes: a number, an ISO 8601 duration ("PT1H15M"), or a text ("45 min", "1 h 15", "1 hour").
const mlMinutes = (v) => {
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
const mlServings = (v) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// The meal plans of the home: Mealie's and Cookidoo's calendars, Grocy's meal plan sensor.
const mlPlans = (hass) =>
  Object.keys(hass.entities || {}).filter((id) => {
    const p = hass.entities[id].platform;
    if (!ML_PLAN_PLATFORMS.includes(p)) return false;
    return id.startsWith("calendar.") || (id.startsWith("sensor.") && /meal/.test(id));
  });

// Mealie's config entries, from the devices of the Mealie entities among `plans` (read by any user, unlike
// config_entries/get): one get_mealplan call each.
const mlMealieEntries = (hass, plans) => [
  ...new Set(plans.filter((id) => hass.entities?.[id]?.platform === "mealie").flatMap((id) => hass.devices?.[hass.entities[id].device_id]?.config_entries || [])),
];

// What says that a to-do list changed: its state (the items left) and its last update (an item renamed or moved).
const mlListSig = (st) => (st ? `${st.state}|${st.last_updated ?? ""}` : "");

// The shopping list of the home: a to-do list of a shopping integration, one named like a shopping list first.
const mlShopping = (hass) => {
  const lists = Object.keys(hass.entities || {}).filter((id) => id.startsWith("todo.") && ML_SHOP_PLATFORMS.includes(hass.entities[id].platform));
  return lists.find((id) => /shop|course|einkauf|compra|spesa|boodschap|zakup/i.test(id)) || lists[0];
};

// A meal from a calendar event, typed by its calendar (Mealie has one per meal type).
const mlFromEvent = (ev, calendar) => {
  const start = ev.start?.date || ev.start?.dateTime || ev.start;
  if (!start || !ev.summary) return null;
  return { day: mlDay(String(start).length === 10 ? `${start}T12:00:00` : start), type: mlType(`${calendar} ${ev.summary}`), name: ev.summary, source: calendar };
};

// The meals of Mealie's get_mealplan response.
const mlFromMealie = (resp, source) =>
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
      };
    })
    .filter(Boolean);

// The meals of Grocy's meal plan sensor (its `meals` attribute): a recipe, a note or a product per day and section.
const mlFromGrocy = (st) =>
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
const mlAisles = (items) => {
  const label = (i) => String(i.description || "").trim();
  const words = items.map(label).filter((d) => d && d.length <= 20 && !/\d/.test(d));
  const shared = words.some((d, i) => words.indexOf(d) !== i);
  if (!shared || words.length < items.length * 0.6) return items;
  const key = (i) => (words.includes(label(i)) ? label(i) : "\uffff");
  return items.map((i, n) => [i, n]).sort(([a, x], [b, y]) => key(a).localeCompare(key(b)) || x - y).map(([i]) => i);
};

// The Intl formats, made once per language and options.
const mlIntlCache = new Map();
const mlIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!mlIntlCache.has(key)) mlIntlCache.set(key, new Kind(lang, opts));
  return mlIntlCache.get(key);
};

// Strings of the meal cards; the shared ones above (editor basics) complete them.
const ML_I18N = {
  en: {
    title: "Meals",
    st_planned: "Dinner planned",
    st_unplanned: "Nothing tonight",
    st_empty: "No meal plan",
    tonight: "Tonight",
    nothing_tonight: "Nothing planned for tonight",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    side: "Side",
    this_week: "This week",
    next_days: "Next 7 days",
    tomorrow_meal: "Tomorrow: {v}",
    sub_lunch: "Lunch: {v}",
    nothing_day: "Nothing planned",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Serves {n}",
    shopping: "Shopping list",
    left: "{n} left",
    to_buy: "{n} to buy",
    nothing_to_buy: "Nothing to buy",
    chip_tonight: "Tonight: {v}",
    mark_bought: "Mark as bought: {v}",
    mark_needed: "Put back on the list: {v}",
    none: "No meal plan or shopping list found",
    ed_meal_plan: "Meal plan",
    ed_meal_plan_helper: "Calendars or a Grocy meal plan sensor; empty: Mealie, Cookidoo and Grocy found by themselves",
    ed_shopping_list: "Shopping list",
    ed_shopping_list_helper: "A to-do list; empty: the first shopping list found",
    ed_days: "Days shown",
    ed_days_week: "This week, Monday to Sunday",
    ed_days_next7: "The next 7 days",
    ed_show_week: "Week",
    ed_show_shopping: "Shopping list",
    ed_shopping_limit: "Items shown",
    ed_shopping_limit_helper: "How many items of the shopping list are shown",
    ed_show_subtitle: "Show subtitle",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_animations: "Animations",
    ed_title_helper: "Empty: Meals",
  },
  fr: {
    title: "Repas",
    st_planned: "Dîner prévu",
    st_unplanned: "Rien ce soir",
    st_empty: "Aucun menu",
    tonight: "Ce soir",
    nothing_tonight: "Rien de prévu pour ce soir",
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    side: "Accompagnement",
    this_week: "Cette semaine",
    next_days: "Les 7 prochains jours",
    tomorrow_meal: "Demain : {v}",
    sub_lunch: "Déjeuner : {v}",
    nothing_day: "Rien de prévu",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Pour {n}",
    shopping: "Liste de courses",
    left: "{n} restants",
    to_buy: "{n} à acheter",
    nothing_to_buy: "Rien à acheter",
    chip_tonight: "Ce soir : {v}",
    mark_bought: "Marquer comme acheté : {v}",
    mark_needed: "Remettre sur la liste : {v}",
    none: "Aucun menu ni liste de courses trouvé",
    ed_meal_plan: "Menu",
    ed_meal_plan_helper: "Calendriers ou capteur de menu Grocy ; vide : Mealie, Cookidoo et Grocy trouvés tout seuls",
    ed_shopping_list: "Liste de courses",
    ed_shopping_list_helper: "Une liste de tâches ; vide : la première liste de courses trouvée",
    ed_days: "Jours affichés",
    ed_days_week: "Cette semaine, du lundi au dimanche",
    ed_days_next7: "Les 7 prochains jours",
    ed_show_week: "Semaine",
    ed_show_shopping: "Liste de courses",
    ed_shopping_limit: "Articles affichés",
    ed_shopping_limit_helper: "Combien d'articles de la liste de courses sont affichés",
    ed_show_subtitle: "Afficher le sous-titre",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_animations: "Animations",
    ed_title_helper: "Vide : Repas",
  },
  de: {
    title: "Mahlzeiten",
    st_planned: "Abendessen geplant",
    st_unplanned: "Heute Abend nichts",
    st_empty: "Kein Speiseplan",
    tonight: "Heute Abend",
    nothing_tonight: "Für heute Abend ist nichts geplant",
    breakfast: "Frühstück",
    lunch: "Mittagessen",
    dinner: "Abendessen",
    side: "Beilage",
    this_week: "Diese Woche",
    next_days: "Die nächsten 7 Tage",
    tomorrow_meal: "Morgen: {v}",
    sub_lunch: "Mittagessen: {v}",
    nothing_day: "Nichts geplant",
    dur_min: "{n} Min.",
    dur_h: "{h} Std.",
    dur_hm: "{h} Std. {m}",
    servings: "Für {n}",
    shopping: "Einkaufsliste",
    left: "Noch {n}",
    to_buy: "Noch {n} kaufen",
    nothing_to_buy: "Nichts zu kaufen",
    chip_tonight: "Heute Abend: {v}",
    mark_bought: "Als gekauft markieren: {v}",
    mark_needed: "Wieder auf die Liste: {v}",
    none: "Kein Speiseplan und keine Einkaufsliste gefunden",
    ed_meal_plan: "Speiseplan",
    ed_meal_plan_helper: "Kalender oder ein Grocy-Speiseplan-Sensor; leer: Mealie, Cookidoo und Grocy werden selbst gefunden",
    ed_shopping_list: "Einkaufsliste",
    ed_shopping_list_helper: "Eine To-do-Liste; leer: die erste gefundene Einkaufsliste",
    ed_days: "Angezeigte Tage",
    ed_days_week: "Diese Woche, Montag bis Sonntag",
    ed_days_next7: "Die nächsten 7 Tage",
    ed_show_week: "Woche",
    ed_show_shopping: "Einkaufsliste",
    ed_shopping_limit: "Angezeigte Artikel",
    ed_shopping_limit_helper: "Wie viele Artikel der Einkaufsliste angezeigt werden",
    ed_show_subtitle: "Untertitel anzeigen",
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_theme: "Design der Kopfzeile",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_animations: "Animationen",
    ed_title_helper: "Leer: Mahlzeiten",
  },
  es: {
    title: "Comidas",
    st_planned: "Cena prevista",
    st_unplanned: "Nada esta noche",
    st_empty: "Sin menú",
    tonight: "Esta noche",
    nothing_tonight: "Nada previsto para esta noche",
    breakfast: "Desayuno",
    lunch: "Almuerzo",
    dinner: "Cena",
    side: "Guarnición",
    this_week: "Esta semana",
    next_days: "Los próximos 7 días",
    tomorrow_meal: "Mañana: {v}",
    sub_lunch: "Almuerzo: {v}",
    nothing_day: "Nada previsto",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Para {n}",
    shopping: "Lista de la compra",
    left: "Quedan {n}",
    to_buy: "Por comprar: {n}",
    nothing_to_buy: "Nada que comprar",
    chip_tonight: "Esta noche: {v}",
    mark_bought: "Marcar como comprado: {v}",
    mark_needed: "Volver a la lista: {v}",
    none: "No se encontró ningún menú ni lista de la compra",
    ed_meal_plan: "Menú",
    ed_meal_plan_helper: "Calendarios o un sensor de menú de Grocy; vacío: Mealie, Cookidoo y Grocy se encuentran solos",
    ed_shopping_list: "Lista de la compra",
    ed_shopping_list_helper: "Una lista de tareas; vacío: la primera lista de la compra encontrada",
    ed_days: "Días mostrados",
    ed_days_week: "Esta semana, de lunes a domingo",
    ed_days_next7: "Los próximos 7 días",
    ed_show_week: "Semana",
    ed_show_shopping: "Lista de la compra",
    ed_shopping_limit: "Artículos mostrados",
    ed_shopping_limit_helper: "Cuántos artículos de la lista de la compra se muestran",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_animations: "Animaciones",
    ed_title_helper: "Vacío: Comidas",
  },
  sr: {
    title: "Оброци",
    st_planned: "Вечера испланирана",
    st_unplanned: "Вечерас ништа",
    st_empty: "Нема јеловника",
    tonight: "Вечерас",
    nothing_tonight: "Ништа није планирано за вечерас",
    breakfast: "Доручак",
    lunch: "Ручак",
    dinner: "Вечера",
    side: "Прилог",
    this_week: "Ове недеље",
    next_days: "Наредних 7 дана",
    tomorrow_meal: "Сутра: {v}",
    sub_lunch: "Ручак: {v}",
    nothing_day: "Ништа није планирано",
    dur_min: "{n} мин",
    dur_h: "{h} ч",
    dur_hm: "{h} ч {m}",
    servings: "Порције: {n}",
    shopping: "Списак за куповину",
    left: "Преостало: {n}",
    to_buy: "За куповину: {n}",
    nothing_to_buy: "Ништа за куповину",
    chip_tonight: "Вечерас: {v}",
    mark_bought: "Означи као купљено: {v}",
    mark_needed: "Врати на списак: {v}",
    none: "Није пронађен јеловник ни списак за куповину",
    ed_meal_plan: "Јеловник",
    ed_meal_plan_helper: "Календари или Grocy сензор јеловника; празно: Mealie, Cookidoo и Grocy се проналазе сами",
    ed_shopping_list: "Списак за куповину",
    ed_shopping_list_helper: "Листа задатака; празно: први пронађени списак за куповину",
    ed_days: "Приказани дани",
    ed_days_week: "Ове недеље, од понедељка до недеље",
    ed_days_next7: "Наредних 7 дана",
    ed_show_week: "Недеља",
    ed_show_shopping: "Списак за куповину",
    ed_shopping_limit: "Приказане ставке",
    ed_shopping_limit_helper: "Колико ставки са списка за куповину се приказује",
    ed_show_subtitle: "Прикажи поднаслов",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_animations: "Анимације",
    ed_title_helper: "Празно: Оброци",
  },
  "sr-Latn": {
    title: "Obroci",
    st_planned: "Večera isplanirana",
    st_unplanned: "Večeras ništa",
    st_empty: "Nema jelovnika",
    tonight: "Večeras",
    nothing_tonight: "Ništa nije planirano za večeras",
    breakfast: "Doručak",
    lunch: "Ručak",
    dinner: "Večera",
    side: "Prilog",
    this_week: "Ove nedelje",
    next_days: "Narednih 7 dana",
    tomorrow_meal: "Sutra: {v}",
    sub_lunch: "Ručak: {v}",
    nothing_day: "Ništa nije planirano",
    dur_min: "{n} min",
    dur_h: "{h} č",
    dur_hm: "{h} č {m}",
    servings: "Porcije: {n}",
    shopping: "Spisak za kupovinu",
    left: "Preostalo: {n}",
    to_buy: "Za kupovinu: {n}",
    nothing_to_buy: "Ništa za kupovinu",
    chip_tonight: "Večeras: {v}",
    mark_bought: "Označi kao kupljeno: {v}",
    mark_needed: "Vrati na spisak: {v}",
    none: "Nije pronađen jelovnik ni spisak za kupovinu",
    ed_meal_plan: "Jelovnik",
    ed_meal_plan_helper: "Kalendari ili Grocy senzor jelovnika; prazno: Mealie, Cookidoo i Grocy se pronalaze sami",
    ed_shopping_list: "Spisak za kupovinu",
    ed_shopping_list_helper: "Lista zadataka; prazno: prvi pronađeni spisak za kupovinu",
    ed_days: "Prikazani dani",
    ed_days_week: "Ove nedelje, od ponedeljka do nedelje",
    ed_days_next7: "Narednih 7 dana",
    ed_show_week: "Nedelja",
    ed_show_shopping: "Spisak za kupovinu",
    ed_shopping_limit: "Prikazane stavke",
    ed_shopping_limit_helper: "Koliko stavki sa spiska za kupovinu se prikazuje",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: Obroci",
  },
  it: {
    title: "Pasti",
    st_planned: "Cena prevista",
    st_unplanned: "Niente stasera",
    st_empty: "Nessun menù",
    tonight: "Stasera",
    nothing_tonight: "Niente di previsto per stasera",
    breakfast: "Colazione",
    lunch: "Pranzo",
    dinner: "Cena",
    side: "Contorno",
    this_week: "Questa settimana",
    next_days: "I prossimi 7 giorni",
    tomorrow_meal: "Domani: {v}",
    sub_lunch: "Pranzo: {v}",
    nothing_day: "Niente di previsto",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Per {n}",
    shopping: "Lista della spesa",
    left: "Ne restano {n}",
    to_buy: "Da comprare: {n}",
    nothing_to_buy: "Niente da comprare",
    chip_tonight: "Stasera: {v}",
    mark_bought: "Segna come comprato: {v}",
    mark_needed: "Rimetti nella lista: {v}",
    none: "Nessun menù né lista della spesa trovati",
    ed_meal_plan: "Menù",
    ed_meal_plan_helper: "Calendari o un sensore del menù di Grocy; vuoto: Mealie, Cookidoo e Grocy trovati da soli",
    ed_shopping_list: "Lista della spesa",
    ed_shopping_list_helper: "Una lista di cose da fare; vuoto: la prima lista della spesa trovata",
    ed_days: "Giorni mostrati",
    ed_days_week: "Questa settimana, da lunedì a domenica",
    ed_days_next7: "I prossimi 7 giorni",
    ed_show_week: "Settimana",
    ed_show_shopping: "Lista della spesa",
    ed_shopping_limit: "Articoli mostrati",
    ed_shopping_limit_helper: "Quanti articoli della lista della spesa vengono mostrati",
    ed_show_subtitle: "Mostra sottotitolo",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_animations: "Animazioni",
    ed_title_helper: "Vuoto: Pasti",
  },
  nl: {
    title: "Maaltijden",
    st_planned: "Avondeten gepland",
    st_unplanned: "Vanavond niets",
    st_empty: "Geen menu",
    tonight: "Vanavond",
    nothing_tonight: "Niets gepland voor vanavond",
    breakfast: "Ontbijt",
    lunch: "Lunch",
    dinner: "Avondeten",
    side: "Bijgerecht",
    this_week: "Deze week",
    next_days: "De komende 7 dagen",
    tomorrow_meal: "Morgen: {v}",
    sub_lunch: "Lunch: {v}",
    nothing_day: "Niets gepland",
    dur_min: "{n} min",
    dur_h: "{h} u",
    dur_hm: "{h} u {m}",
    servings: "Voor {n}",
    shopping: "Boodschappenlijst",
    left: "Nog {n}",
    to_buy: "Nog {n} te kopen",
    nothing_to_buy: "Niets te kopen",
    chip_tonight: "Vanavond: {v}",
    mark_bought: "Markeren als gekocht: {v}",
    mark_needed: "Terug op de lijst: {v}",
    none: "Geen menu of boodschappenlijst gevonden",
    ed_meal_plan: "Menu",
    ed_meal_plan_helper: "Agenda's of een Grocy-menusensor; leeg: Mealie, Cookidoo en Grocy worden vanzelf gevonden",
    ed_shopping_list: "Boodschappenlijst",
    ed_shopping_list_helper: "Een takenlijst; leeg: de eerste gevonden boodschappenlijst",
    ed_days: "Getoonde dagen",
    ed_days_week: "Deze week, maandag tot zondag",
    ed_days_next7: "De komende 7 dagen",
    ed_show_week: "Week",
    ed_show_shopping: "Boodschappenlijst",
    ed_shopping_limit: "Getoonde artikelen",
    ed_shopping_limit_helper: "Hoeveel artikelen van de boodschappenlijst worden getoond",
    ed_show_subtitle: "Ondertitel tonen",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_animations: "Animaties",
    ed_title_helper: "Leeg: Maaltijden",
  },
  pt: {
    title: "Refeições",
    st_planned: "Jantar previsto",
    st_unplanned: "Nada esta noite",
    st_empty: "Sem ementa",
    tonight: "Esta noite",
    nothing_tonight: "Nada previsto para esta noite",
    breakfast: "Pequeno-almoço",
    lunch: "Almoço",
    dinner: "Jantar",
    side: "Acompanhamento",
    this_week: "Esta semana",
    next_days: "Os próximos 7 dias",
    tomorrow_meal: "Amanhã: {v}",
    sub_lunch: "Almoço: {v}",
    nothing_day: "Nada previsto",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Para {n}",
    shopping: "Lista de compras",
    left: "Faltam {n}",
    to_buy: "Por comprar: {n}",
    nothing_to_buy: "Nada para comprar",
    chip_tonight: "Esta noite: {v}",
    mark_bought: "Marcar como comprado: {v}",
    mark_needed: "Voltar a pôr na lista: {v}",
    none: "Nenhuma ementa nem lista de compras encontrada",
    ed_meal_plan: "Ementa",
    ed_meal_plan_helper: "Calendários ou um sensor de ementa do Grocy; vazio: Mealie, Cookidoo e Grocy encontrados sozinhos",
    ed_shopping_list: "Lista de compras",
    ed_shopping_list_helper: "Uma lista de tarefas; vazio: a primeira lista de compras encontrada",
    ed_days: "Dias mostrados",
    ed_days_week: "Esta semana, de segunda a domingo",
    ed_days_next7: "Os próximos 7 dias",
    ed_show_week: "Semana",
    ed_show_shopping: "Lista de compras",
    ed_shopping_limit: "Artigos mostrados",
    ed_shopping_limit_helper: "Quantos artigos da lista de compras são mostrados",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_animations: "Animações",
    ed_title_helper: "Vazio: Refeições",
  },
  pl: {
    title: "Posiłki",
    st_planned: "Kolacja zaplanowana",
    st_unplanned: "Dziś wieczorem nic",
    st_empty: "Brak jadłospisu",
    tonight: "Dziś wieczorem",
    nothing_tonight: "Nic nie zaplanowano na dziś wieczór",
    breakfast: "Śniadanie",
    lunch: "Obiad",
    dinner: "Kolacja",
    side: "Dodatek",
    this_week: "Ten tydzień",
    next_days: "Najbliższe 7 dni",
    tomorrow_meal: "Jutro: {v}",
    sub_lunch: "Obiad: {v}",
    nothing_day: "Nic nie zaplanowano",
    dur_min: "{n} min",
    dur_h: "{h} godz.",
    dur_hm: "{h} godz. {m}",
    servings: "Porcje: {n}",
    shopping: "Lista zakupów",
    left: "Pozostało: {n}",
    to_buy: "Do kupienia: {n}",
    nothing_to_buy: "Nic do kupienia",
    chip_tonight: "Dziś wieczorem: {v}",
    mark_bought: "Oznacz jako kupione: {v}",
    mark_needed: "Przywróć na listę: {v}",
    none: "Nie znaleziono jadłospisu ani listy zakupów",
    ed_meal_plan: "Jadłospis",
    ed_meal_plan_helper: "Kalendarze lub czujnik jadłospisu Grocy; puste: Mealie, Cookidoo i Grocy znalezione automatycznie",
    ed_shopping_list: "Lista zakupów",
    ed_shopping_list_helper: "Lista zadań; puste: pierwsza znaleziona lista zakupów",
    ed_days: "Wyświetlane dni",
    ed_days_week: "Ten tydzień, od poniedziałku do niedzieli",
    ed_days_next7: "Najbliższe 7 dni",
    ed_show_week: "Tydzień",
    ed_show_shopping: "Lista zakupów",
    ed_shopping_limit: "Wyświetlane pozycje",
    ed_shopping_limit_helper: "Ile pozycji listy zakupów jest wyświetlanych",
    ed_show_subtitle: "Pokaż podtytuł",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatycznie (zgodnie z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_animations: "Animacje",
    ed_title_helper: "Puste: Posiłki",
  },
  ro: {
    title: "Mese",
    st_planned: "Cină planificată",
    st_unplanned: "Nimic în seara asta",
    st_empty: "Niciun meniu",
    tonight: "În seara asta",
    nothing_tonight: "Nimic planificat pentru diseară",
    breakfast: "Mic dejun",
    lunch: "Prânz",
    dinner: "Cină",
    side: "Garnitură",
    this_week: "Săptămâna aceasta",
    next_days: "Următoarele 7 zile",
    tomorrow_meal: "Mâine: {v}",
    sub_lunch: "Prânz: {v}",
    nothing_day: "Nimic planificat",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Porții: {n}",
    shopping: "Listă de cumpărături",
    left: "Rămase: {n}",
    to_buy: "De cumpărat: {n}",
    nothing_to_buy: "Nimic de cumpărat",
    chip_tonight: "În seara asta: {v}",
    mark_bought: "Marchează ca cumpărat: {v}",
    mark_needed: "Pune înapoi pe listă: {v}",
    none: "Nu s-a găsit niciun meniu sau listă de cumpărături",
    ed_meal_plan: "Meniu",
    ed_meal_plan_helper: "Calendare sau un senzor de meniu Grocy; gol: Mealie, Cookidoo și Grocy găsite singure",
    ed_shopping_list: "Listă de cumpărături",
    ed_shopping_list_helper: "O listă de sarcini; gol: prima listă de cumpărături găsită",
    ed_days: "Zile afișate",
    ed_days_week: "Săptămâna aceasta, de luni până duminică",
    ed_days_next7: "Următoarele 7 zile",
    ed_show_week: "Săptămână",
    ed_show_shopping: "Listă de cumpărături",
    ed_shopping_limit: "Articole afișate",
    ed_shopping_limit_helper: "Câte articole din lista de cumpărături sunt afișate",
    ed_show_subtitle: "Afișează subtitlul",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_animations: "Animații",
    ed_title_helper: "Gol: Mese",
  },
  da: {
    title: "Måltider",
    st_planned: "Aftensmad planlagt",
    st_unplanned: "Intet i aften",
    st_empty: "Ingen madplan",
    tonight: "I aften",
    nothing_tonight: "Intet planlagt i aften",
    breakfast: "Morgenmad",
    lunch: "Frokost",
    dinner: "Aftensmad",
    side: "Tilbehør",
    this_week: "Denne uge",
    next_days: "De næste 7 dage",
    tomorrow_meal: "I morgen: {v}",
    sub_lunch: "Frokost: {v}",
    nothing_day: "Intet planlagt",
    dur_min: "{n} min",
    dur_h: "{h} t",
    dur_hm: "{h} t {m}",
    servings: "Til {n}",
    shopping: "Indkøbsliste",
    left: "{n} tilbage",
    to_buy: "Skal købes: {n}",
    nothing_to_buy: "Intet at købe",
    chip_tonight: "I aften: {v}",
    mark_bought: "Markér som købt: {v}",
    mark_needed: "Sæt på listen igen: {v}",
    none: "Ingen madplan eller indkøbsliste fundet",
    ed_meal_plan: "Madplan",
    ed_meal_plan_helper: "Kalendere eller en Grocy-madplansensor; tom: Mealie, Cookidoo og Grocy findes af sig selv",
    ed_shopping_list: "Indkøbsliste",
    ed_shopping_list_helper: "En opgaveliste; tom: den første indkøbsliste, der findes",
    ed_days: "Viste dage",
    ed_days_week: "Denne uge, mandag til søndag",
    ed_days_next7: "De næste 7 dage",
    ed_show_week: "Uge",
    ed_show_shopping: "Indkøbsliste",
    ed_shopping_limit: "Viste varer",
    ed_shopping_limit_helper: "Hvor mange varer fra indkøbslisten der vises",
    ed_show_subtitle: "Vis undertitel",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: Måltider",
  },
  sv: {
    title: "Måltider",
    st_planned: "Middag planerad",
    st_unplanned: "Inget i kväll",
    st_empty: "Ingen matsedel",
    tonight: "I kväll",
    nothing_tonight: "Inget planerat i kväll",
    breakfast: "Frukost",
    lunch: "Lunch",
    dinner: "Middag",
    side: "Tillbehör",
    this_week: "Den här veckan",
    next_days: "De kommande 7 dagarna",
    tomorrow_meal: "I morgon: {v}",
    sub_lunch: "Lunch: {v}",
    nothing_day: "Inget planerat",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "För {n}",
    shopping: "Inköpslista",
    left: "{n} kvar",
    to_buy: "Att köpa: {n}",
    nothing_to_buy: "Inget att köpa",
    chip_tonight: "I kväll: {v}",
    mark_bought: "Markera som köpt: {v}",
    mark_needed: "Lägg tillbaka på listan: {v}",
    none: "Ingen matsedel eller inköpslista hittades",
    ed_meal_plan: "Matsedel",
    ed_meal_plan_helper: "Kalendrar eller en matsedelssensor från Grocy; tom: Mealie, Cookidoo och Grocy hittas av sig själva",
    ed_shopping_list: "Inköpslista",
    ed_shopping_list_helper: "En att göra-lista; tom: den första inköpslistan som hittas",
    ed_days: "Visade dagar",
    ed_days_week: "Den här veckan, måndag till söndag",
    ed_days_next7: "De kommande 7 dagarna",
    ed_show_week: "Vecka",
    ed_show_shopping: "Inköpslista",
    ed_shopping_limit: "Visade varor",
    ed_shopping_limit_helper: "Hur många varor från inköpslistan som visas",
    ed_show_subtitle: "Visa underrubrik",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: Måltider",
  },
  bg: {
    title: "Хранения",
    st_planned: "Вечерята е планирана",
    st_unplanned: "Тази вечер нищо",
    st_empty: "Няма меню",
    tonight: "Тази вечер",
    nothing_tonight: "Нищо не е планирано за тази вечер",
    breakfast: "Закуска",
    lunch: "Обяд",
    dinner: "Вечеря",
    side: "Гарнитура",
    this_week: "Тази седмица",
    next_days: "Следващите 7 дни",
    tomorrow_meal: "Утре: {v}",
    sub_lunch: "Обяд: {v}",
    nothing_day: "Нищо не е планирано",
    dur_min: "{n} мин",
    dur_h: "{h} ч",
    dur_hm: "{h} ч {m}",
    servings: "Порции: {n}",
    shopping: "Списък за пазаруване",
    left: "Остават: {n}",
    to_buy: "За купуване: {n}",
    nothing_to_buy: "Нищо за купуване",
    chip_tonight: "Тази вечер: {v}",
    mark_bought: "Отбележи като купено: {v}",
    mark_needed: "Върни в списъка: {v}",
    none: "Не са намерени меню или списък за пазаруване",
    ed_meal_plan: "Меню",
    ed_meal_plan_helper: "Календари или сензор за меню на Grocy; празно: Mealie, Cookidoo и Grocy се намират сами",
    ed_shopping_list: "Списък за пазаруване",
    ed_shopping_list_helper: "Списък със задачи; празно: първият намерен списък за пазаруване",
    ed_days: "Показани дни",
    ed_days_week: "Тази седмица, от понеделник до неделя",
    ed_days_next7: "Следващите 7 дни",
    ed_show_week: "Седмица",
    ed_show_shopping: "Списък за пазаруване",
    ed_shopping_limit: "Показани артикули",
    ed_shopping_limit_helper: "Колко артикула от списъка за пазаруване се показват",
    ed_show_subtitle: "Показване на подзаглавие",
    ed_illustration: "Илюстрирано заглавие",
    ed_illustration_theme: "Тема на заглавието",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_animations: "Анимации",
    ed_title_helper: "Празно: Хранения",
  },
  ru: {
    title: "Питание",
    st_planned: "Ужин запланирован",
    st_unplanned: "Сегодня вечером ничего",
    st_empty: "Нет меню",
    tonight: "Сегодня вечером",
    nothing_tonight: "На сегодняшний вечер ничего не запланировано",
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
    side: "Гарнир",
    this_week: "Эта неделя",
    next_days: "Следующие 7 дней",
    tomorrow_meal: "Завтра: {v}",
    sub_lunch: "Обед: {v}",
    nothing_day: "Ничего не запланировано",
    dur_min: "{n} мин",
    dur_h: "{h} ч",
    dur_hm: "{h} ч {m}",
    servings: "Порций: {n}",
    shopping: "Список покупок",
    left: "Осталось: {n}",
    to_buy: "Купить: {n}",
    nothing_to_buy: "Покупать нечего",
    chip_tonight: "Сегодня вечером: {v}",
    mark_bought: "Отметить как купленное: {v}",
    mark_needed: "Вернуть в список: {v}",
    none: "Меню и список покупок не найдены",
    ed_meal_plan: "Меню",
    ed_meal_plan_helper: "Календари или датчик меню Grocy; пусто: Mealie, Cookidoo и Grocy находятся сами",
    ed_shopping_list: "Список покупок",
    ed_shopping_list_helper: "Список дел; пусто: первый найденный список покупок",
    ed_days: "Показываемые дни",
    ed_days_week: "Эта неделя, с понедельника по воскресенье",
    ed_days_next7: "Следующие 7 дней",
    ed_show_week: "Неделя",
    ed_show_shopping: "Список покупок",
    ed_shopping_limit: "Показываемые позиции",
    ed_shopping_limit_helper: "Сколько позиций списка покупок показывается",
    ed_show_subtitle: "Показывать подзаголовок",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_animations: "Анимации",
    ed_title_helper: "Пусто: Питание",
  },
  uk: {
    title: "Харчування",
    st_planned: "Вечерю заплановано",
    st_unplanned: "Сьогодні ввечері нічого",
    st_empty: "Немає меню",
    tonight: "Сьогодні ввечері",
    nothing_tonight: "На сьогоднішній вечір нічого не заплановано",
    breakfast: "Сніданок",
    lunch: "Обід",
    dinner: "Вечеря",
    side: "Гарнір",
    this_week: "Цей тиждень",
    next_days: "Наступні 7 днів",
    tomorrow_meal: "Завтра: {v}",
    sub_lunch: "Обід: {v}",
    nothing_day: "Нічого не заплановано",
    dur_min: "{n} хв",
    dur_h: "{h} год",
    dur_hm: "{h} год {m}",
    servings: "Порцій: {n}",
    shopping: "Список покупок",
    left: "Залишилося: {n}",
    to_buy: "Купити: {n}",
    nothing_to_buy: "Купувати нічого",
    chip_tonight: "Сьогодні ввечері: {v}",
    mark_bought: "Позначити як куплене: {v}",
    mark_needed: "Повернути до списку: {v}",
    none: "Меню та список покупок не знайдено",
    ed_meal_plan: "Меню",
    ed_meal_plan_helper: "Календарі або датчик меню Grocy; порожньо: Mealie, Cookidoo і Grocy знаходяться самі",
    ed_shopping_list: "Список покупок",
    ed_shopping_list_helper: "Список справ; порожньо: перший знайдений список покупок",
    ed_days: "Показані дні",
    ed_days_week: "Цей тиждень, з понеділка по неділю",
    ed_days_next7: "Наступні 7 днів",
    ed_show_week: "Тиждень",
    ed_show_shopping: "Список покупок",
    ed_shopping_limit: "Показані позиції",
    ed_shopping_limit_helper: "Скільки позицій списку покупок показується",
    ed_show_subtitle: "Показувати підзаголовок",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_animations: "Анімації",
    ed_title_helper: "Порожньо: Харчування",
  },
  hu: {
    title: "Étkezések",
    st_planned: "Vacsora betervezve",
    st_unplanned: "Ma este semmi",
    st_empty: "Nincs étrend",
    tonight: "Ma este",
    nothing_tonight: "Ma estére nincs semmi tervezve",
    breakfast: "Reggeli",
    lunch: "Ebéd",
    dinner: "Vacsora",
    side: "Köret",
    this_week: "Ezen a héten",
    next_days: "A következő 7 nap",
    tomorrow_meal: "Holnap: {v}",
    sub_lunch: "Ebéd: {v}",
    nothing_day: "Nincs semmi tervezve",
    dur_min: "{n} perc",
    dur_h: "{h} óra",
    dur_hm: "{h} óra {m}",
    servings: "{n} adag",
    shopping: "Bevásárlólista",
    left: "Még {n}",
    to_buy: "Megvenni: {n}",
    nothing_to_buy: "Nincs mit venni",
    chip_tonight: "Ma este: {v}",
    mark_bought: "Megvettnek jelöl: {v}",
    mark_needed: "Vissza a listára: {v}",
    none: "Nem található étrend és bevásárlólista",
    ed_meal_plan: "Étrend",
    ed_meal_plan_helper: "Naptárak vagy egy Grocy étrend-érzékelő; üres: a Mealie, a Cookidoo és a Grocy magától megtalálható",
    ed_shopping_list: "Bevásárlólista",
    ed_shopping_list_helper: "Egy teendőlista; üres: az első talált bevásárlólista",
    ed_days: "Megjelenített napok",
    ed_days_week: "Ezen a héten, hétfőtől vasárnapig",
    ed_days_next7: "A következő 7 nap",
    ed_show_week: "Hét",
    ed_show_shopping: "Bevásárlólista",
    ed_shopping_limit: "Megjelenített tételek",
    ed_shopping_limit_helper: "A bevásárlólista hány tétele jelenjen meg",
    ed_show_subtitle: "Alcím megjelenítése",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_animations: "Animációk",
    ed_title_helper: "Üres: Étkezések",
  },
  sk: {
    title: "Jedlá",
    st_planned: "Večera naplánovaná",
    st_unplanned: "Dnes večer nič",
    st_empty: "Žiadny jedálniček",
    tonight: "Dnes večer",
    nothing_tonight: "Na dnešný večer nie je nič naplánované",
    breakfast: "Raňajky",
    lunch: "Obed",
    dinner: "Večera",
    side: "Príloha",
    this_week: "Tento týždeň",
    next_days: "Najbližších 7 dní",
    tomorrow_meal: "Zajtra: {v}",
    sub_lunch: "Obed: {v}",
    nothing_day: "Nič nie je naplánované",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Porcie: {n}",
    shopping: "Nákupný zoznam",
    left: "Zostáva: {n}",
    to_buy: "Kúpiť: {n}",
    nothing_to_buy: "Nič na kúpu",
    chip_tonight: "Dnes večer: {v}",
    mark_bought: "Označiť ako kúpené: {v}",
    mark_needed: "Vrátiť do zoznamu: {v}",
    none: "Nenašiel sa žiadny jedálniček ani nákupný zoznam",
    ed_meal_plan: "Jedálniček",
    ed_meal_plan_helper: "Kalendáre alebo senzor jedálnička Grocy; prázdne: Mealie, Cookidoo a Grocy sa nájdu samy",
    ed_shopping_list: "Nákupný zoznam",
    ed_shopping_list_helper: "Zoznam úloh; prázdne: prvý nájdený nákupný zoznam",
    ed_days: "Zobrazené dni",
    ed_days_week: "Tento týždeň, od pondelka do nedele",
    ed_days_next7: "Najbližších 7 dní",
    ed_show_week: "Týždeň",
    ed_show_shopping: "Nákupný zoznam",
    ed_shopping_limit: "Zobrazené položky",
    ed_shopping_limit_helper: "Koľko položiek nákupného zoznamu sa zobrazí",
    ed_show_subtitle: "Zobraziť podnadpis",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_animations: "Animácie",
    ed_title_helper: "Prázdne: Jedlá",
  },
  cs: {
    title: "Jídla",
    st_planned: "Večeře naplánována",
    st_unplanned: "Dnes večer nic",
    st_empty: "Žádný jídelníček",
    tonight: "Dnes večer",
    nothing_tonight: "Na dnešní večer není nic naplánováno",
    breakfast: "Snídaně",
    lunch: "Oběd",
    dinner: "Večeře",
    side: "Příloha",
    this_week: "Tento týden",
    next_days: "Příštích 7 dní",
    tomorrow_meal: "Zítra: {v}",
    sub_lunch: "Oběd: {v}",
    nothing_day: "Nic není naplánováno",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Porce: {n}",
    shopping: "Nákupní seznam",
    left: "Zbývá: {n}",
    to_buy: "Koupit: {n}",
    nothing_to_buy: "Nic ke koupi",
    chip_tonight: "Dnes večer: {v}",
    mark_bought: "Označit jako koupené: {v}",
    mark_needed: "Vrátit na seznam: {v}",
    none: "Nebyl nalezen žádný jídelníček ani nákupní seznam",
    ed_meal_plan: "Jídelníček",
    ed_meal_plan_helper: "Kalendáře nebo senzor jídelníčku Grocy; prázdné: Mealie, Cookidoo a Grocy se najdou samy",
    ed_shopping_list: "Nákupní seznam",
    ed_shopping_list_helper: "Seznam úkolů; prázdné: první nalezený nákupní seznam",
    ed_days: "Zobrazené dny",
    ed_days_week: "Tento týden, od pondělí do neděle",
    ed_days_next7: "Příštích 7 dní",
    ed_show_week: "Týden",
    ed_show_shopping: "Nákupní seznam",
    ed_shopping_limit: "Zobrazené položky",
    ed_shopping_limit_helper: "Kolik položek nákupního seznamu se zobrazí",
    ed_show_subtitle: "Zobrazit podtitul",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_animations: "Animace",
    ed_title_helper: "Prázdné: Jídla",
  },
  sl: {
    title: "Obroki",
    st_planned: "Večerja načrtovana",
    st_unplanned: "Nocoj nič",
    st_empty: "Ni jedilnika",
    tonight: "Nocoj",
    nothing_tonight: "Za nocoj ni nič načrtovano",
    breakfast: "Zajtrk",
    lunch: "Kosilo",
    dinner: "Večerja",
    side: "Priloga",
    this_week: "Ta teden",
    next_days: "Naslednjih 7 dni",
    tomorrow_meal: "Jutri: {v}",
    sub_lunch: "Kosilo: {v}",
    nothing_day: "Nič ni načrtovano",
    dur_min: "{n} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m}",
    servings: "Porcije: {n}",
    shopping: "Nakupovalni seznam",
    left: "Preostalo: {n}",
    to_buy: "Kupiti: {n}",
    nothing_to_buy: "Ničesar za kupiti",
    chip_tonight: "Nocoj: {v}",
    mark_bought: "Označi kot kupljeno: {v}",
    mark_needed: "Vrni na seznam: {v}",
    none: "Ni najdenega jedilnika ali nakupovalnega seznama",
    ed_meal_plan: "Jedilnik",
    ed_meal_plan_helper: "Koledarji ali senzor jedilnika Grocy; prazno: Mealie, Cookidoo in Grocy najdeni samodejno",
    ed_shopping_list: "Nakupovalni seznam",
    ed_shopping_list_helper: "Seznam opravil; prazno: prvi najdeni nakupovalni seznam",
    ed_days: "Prikazani dnevi",
    ed_days_week: "Ta teden, od ponedeljka do nedelje",
    ed_days_next7: "Naslednjih 7 dni",
    ed_show_week: "Teden",
    ed_show_shopping: "Nakupovalni seznam",
    ed_shopping_limit: "Prikazani artikli",
    ed_shopping_limit_helper: "Koliko artiklov nakupovalnega seznama je prikazanih",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: Obroki",
  },
  lv: {
    title: "Maltītes",
    st_planned: "Vakariņas ieplānotas",
    st_unplanned: "Šovakar nekā",
    st_empty: "Nav ēdienkartes",
    tonight: "Šovakar",
    nothing_tonight: "Šovakar nekas nav ieplānots",
    breakfast: "Brokastis",
    lunch: "Pusdienas",
    dinner: "Vakariņas",
    side: "Piedeva",
    this_week: "Šonedēļ",
    next_days: "Nākamās 7 dienas",
    tomorrow_meal: "Rīt: {v}",
    sub_lunch: "Pusdienas: {v}",
    nothing_day: "Nekas nav ieplānots",
    dur_min: "{n} min",
    dur_h: "{h} st.",
    dur_hm: "{h} st. {m}",
    servings: "Porcijas: {n}",
    shopping: "Iepirkumu saraksts",
    left: "Atlicis: {n}",
    to_buy: "Jānopērk: {n}",
    nothing_to_buy: "Nav ko pirkt",
    chip_tonight: "Šovakar: {v}",
    mark_bought: "Atzīmēt kā nopirktu: {v}",
    mark_needed: "Atlikt sarakstā: {v}",
    none: "Nav atrasta ne ēdienkarte, ne iepirkumu saraksts",
    ed_meal_plan: "Ēdienkarte",
    ed_meal_plan_helper: "Kalendāri vai Grocy ēdienkartes sensors; tukšs: Mealie, Cookidoo un Grocy tiek atrasti paši",
    ed_shopping_list: "Iepirkumu saraksts",
    ed_shopping_list_helper: "Uzdevumu saraksts; tukšs: pirmais atrastais iepirkumu saraksts",
    ed_days: "Rādītās dienas",
    ed_days_week: "Šonedēļ, no pirmdienas līdz svētdienai",
    ed_days_next7: "Nākamās 7 dienas",
    ed_show_week: "Nedēļa",
    ed_show_shopping: "Iepirkumu saraksts",
    ed_shopping_limit: "Rādītās preces",
    ed_shopping_limit_helper: "Cik iepirkumu saraksta preces tiek rādītas",
    ed_show_subtitle: "Rādīt apakšvirsrakstu",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (pēc motīva)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_animations: "Animācijas",
    ed_title_helper: "Tukšs: Maltītes",
  },
  el: {
    title: "Γεύματα",
    st_planned: "Το δείπνο προγραμματίστηκε",
    st_unplanned: "Τίποτα απόψε",
    st_empty: "Χωρίς μενού",
    tonight: "Απόψε",
    nothing_tonight: "Τίποτα προγραμματισμένο για απόψε",
    breakfast: "Πρωινό",
    lunch: "Μεσημεριανό",
    dinner: "Δείπνο",
    side: "Συνοδευτικό",
    this_week: "Αυτή την εβδομάδα",
    next_days: "Τις επόμενες 7 ημέρες",
    tomorrow_meal: "Αύριο: {v}",
    sub_lunch: "Μεσημεριανό: {v}",
    nothing_day: "Τίποτα προγραμματισμένο",
    dur_min: "{n} λεπ.",
    dur_h: "{h} ώ.",
    dur_hm: "{h} ώ. {m}",
    servings: "Μερίδες: {n}",
    shopping: "Λίστα αγορών",
    left: "Απομένουν: {n}",
    to_buy: "Για αγορά: {n}",
    nothing_to_buy: "Τίποτα για αγορά",
    chip_tonight: "Απόψε: {v}",
    mark_bought: "Σήμανση ως αγορασμένο: {v}",
    mark_needed: "Επιστροφή στη λίστα: {v}",
    none: "Δεν βρέθηκε μενού ούτε λίστα αγορών",
    ed_meal_plan: "Μενού",
    ed_meal_plan_helper: "Ημερολόγια ή αισθητήρας μενού Grocy· κενό: τα Mealie, Cookidoo και Grocy βρίσκονται μόνα τους",
    ed_shopping_list: "Λίστα αγορών",
    ed_shopping_list_helper: "Μια λίστα εργασιών· κενό: η πρώτη λίστα αγορών που βρέθηκε",
    ed_days: "Εμφανιζόμενες ημέρες",
    ed_days_week: "Αυτή την εβδομάδα, Δευτέρα έως Κυριακή",
    ed_days_next7: "Τις επόμενες 7 ημέρες",
    ed_show_week: "Εβδομάδα",
    ed_show_shopping: "Λίστα αγορών",
    ed_shopping_limit: "Εμφανιζόμενα είδη",
    ed_shopping_limit_helper: "Πόσα είδη της λίστας αγορών εμφανίζονται",
    ed_show_subtitle: "Εμφάνιση υπότιτλου",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_animations: "Κινούμενα σχέδια",
    ed_title_helper: "Κενό: Γεύματα",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-meal-card",
  });
};

if (!customElements.get("meal-card")) {
  console.info(`%c HA-MEAL-CARD %c v${RC_VERSION} `, "background:#f76707;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
