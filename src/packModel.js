export const SECTION_INFO = {
  profession:
    "Наименование, описание (проф. возможность) и стаж. <br><b>Базовые стажи</b> - Новичок, Стажер, Любитель, Опытный, Профессионал и Эксперт. Рекомендуемый вариант. <br><b>Кастомные стажи</b> - появится дополнительная панель для ввода характеристик, куда вы должны вписать свои виды стажей. Внимание! Их должно быть обязательно 6. <br><b>Универсальные кастомные стажи</b> - к каждой характеристике профессии и описанию идет свой стаж. Если где-то вы его не указываете, то никакие значения подставлены не будут. В панели ведущего 'Изменить стаж профессии' не сработает",
  sex:
    "<b>Базовый возраст</b> - по умолчанию - от 16 до 85 лет. Рекомендуемый вариант. <br><b>Кастомный возраст</b> - вы вписываете свои характеристики возраста 'от' и 'до' в числовом варианте. Настройки в панели ведущего параметров 'Молодой', 'Взрослый' и 'Пожилой' работать не будут. <br><b>Универсальный кастомный возраст</b> - вы сами вписываете значения 'от' и 'до' к любой характеристике. Если возраст не будет заполнен - он не будет указан. <br><b>Пользовательские значения</b> - вы можете ввести свои вариации гендеров. Один гендер - одна характеристика. <br><b>Добавить 'Чайлдфри'</b> - возможность рандомного выпадения данного значения",
  health:
    "<b>Базовые степени болезни</b> - Легкая, Средняя, Тяжелая и Критическая. Рекомендуемый вариант. <br><b>Кастомные степени болезни</b> - появится дополнительная панель для ввода характеристик, куда вы должны вписать свои виды степеней болезни. Внимание! Их должно быть обязательно 6. <br><b>Универсальные кастомные степени болезни</b> - к каждой характеристике здоровья идет своя степень. Если где-то вы его не указываете, то никакие значения подставлены не будут. В панели ведущего нельзя будет сменить степень болезни",
  hobbies:
    "<b>Базовые стажи</b> - Новичок, Любитель, Опытный, Продвинутый, Мастер (гуру). Рекомендуемый вариант. <br><b>Кастомные стажи</b> - появится дополнительная панель для ввода характеристик, куда вы должны вписать свои виды стажей. Внимание! Их должно быть обязательно 6. <br><b>Универсальные кастомные стажи</b> - к каждой характеристике идет свой стаж. Если где-то вы его не указываете, то никакие значения подставлены не будут",
  body:
    "<b>Базовый рост</b> - по умолчанию - от 150 см. до 210 см. Рекомендуемый вариант. <br><b>Кастомный рост</b> - вы вписываете свои характеристики роста 'от' и 'до' в числовом варианте. В панели ведущего функция «Сделать телосложение» не сработает. <br><b>Универсальный кастомный рост</b> - вы сами вписываете значения роста 'от' и 'до' к любой характеристике. Если рост не будет заполнен - он не будет указан. В панели ведущего функция «Сделать телосложение» не сработает.",
};

export const SECTIONS = [
  { key: "catastrophe", title: "Катаклизм", fileTitle: "Катаклизм", kind: "catastrophe" },
  { key: "bunkerSize", title: "Размер бункера", fileTitle: "Размер бункера", kind: "text" },
  { key: "bunkerTimeSpent", title: "Время нахождения", fileTitle: "Время нахождения", kind: "text" },
  { key: "bunkerFoodAmount", title: "Еда и вода", fileTitle: "Количество еды и воды", kind: "text" },
  { key: "bunkerPresence", title: "В бункере присутствуют", fileTitle: "В бункере присутствуют", kind: "text" },
  { key: "bunkerLocation", title: "Локация бункера", fileTitle: "Локация бункера", kind: "text" },
  { key: "bunkerCreated", title: "Как и где построен", fileTitle: "Как и где был построен (есть ли проблемы)", kind: "text" },
  { key: "bunkerBedroom", title: "Описание комнат", fileTitle: "Описание комнат", kind: "text" },
  { key: "sex", title: "Пол", fileTitle: "Пол", kind: "sex" },
  { key: "body", title: "Телосложение", fileTitle: "Телосложение", kind: "body" },
  { key: "trait", title: "Человеческая черта", fileTitle: "Человеческая черта", kind: "text" },
  { key: "profession", title: "Профессия", fileTitle: "Профессия", kind: "stage" },
  { key: "health", title: "Здоровье", fileTitle: "Здоровье", kind: "health" },
  { key: "hobbies", title: "Хобби", fileTitle: "Хобби/Увлечение", kind: "stage" },
  { key: "phobia", title: "Фобия", fileTitle: "Фобия/Страх", kind: "text" },
  { key: "inventory", title: "Крупный инвентарь", fileTitle: "Крупный инвентарь", kind: "text" },
  { key: "backpack", title: "Рюкзак", fileTitle: "Рюкзак", kind: "text" },
  { key: "addInfo", title: "Доп. сведение", fileTitle: "Дополнительное сведение", kind: "text" },
  { key: "spec", title: "Спецвозможность", fileTitle: "Специальная возможность", kind: "spec" },
];

const STAGE_KEYS = new Set(["profession", "health", "hobbies"]);
const FILE_TYPE_KEYS = new Set([
  "catastrophe",
  "bunkerSize",
  "bunkerTimeSpent",
  "bunkerFoodAmount",
  "bunkerPresence",
  "bunkerLocation",
  "bunkerCreated",
  "bunkerBedroom",
  "sex",
  "body",
  "profession",
  "health",
  "hobbies",
]);

export function titleLimit(key) {
  if (key === "catastrophe") return 1400;
  if (key === "spec") return 700;
  return 240;
}

function blankSection(key) {
  const sec = { type: "base", data: [] };
  if (STAGE_KEYS.has(key)) sec.stage = ["", "", "", "", "", ""];
  if (key === "sex") {
    sec.sexType = "base";
    sec.childFree = false;
    sec.age1 = "";
    sec.age2 = "";
  }
  if (key === "body") {
    sec.height1 = "";
    sec.height2 = "";
  }
  return sec;
}

export function emptyPack() {
  const sections = {};
  for (const s of SECTIONS) sections[s.key] = blankSection(s.key);
  return { packID: -1, title: "", description: "", sections };
}

function str(v) {
  if (v == null || v === 0 || v === "0") return "";
  return String(v);
}

export function packFromServer(raw) {
  const src = raw?.resultData || raw || {};
  const pack = emptyPack();
  pack.packID = src.packID ?? src.id ?? -1;
  pack.title = typeof src.title === "string" ? src.title : src.title?.ru || "";
  pack.description = typeof src.description === "string" ? src.description : src.description?.ru || "";
  for (const s of SECTIONS) {
    const sec = src[s.key];
    if (!sec || typeof sec !== "object") continue;
    const base = blankSection(s.key);
    base.type = sec.type || "base";
    base.data = Array.isArray(sec.data)
      ? sec.data.map((row, i) => ({
          id: String(row.id ?? -(i + 1)),
          title: row.title || "",
          description: row.description || "",
          stage: row.stage || "",
          timer: str(row.timer),
          age1: str(row.age1),
          age2: str(row.age2),
          height1: str(row.height1),
          height2: str(row.height2),
        }))
      : [];
    if (Array.isArray(sec.stage)) {
      base.stage = [...sec.stage, "", "", "", "", "", ""].slice(0, 6).map((x) => x || "");
    }
    if (s.key === "sex") {
      base.sexType = sec.sexType || "base";
      base.childFree = Boolean(sec.isChildFree ?? sec.childFree);
      base.age1 = str(sec.age1);
      base.age2 = str(sec.age2);
    }
    if (s.key === "body") {
      base.height1 = str(sec.height1);
      base.height2 = str(sec.height2);
    }
    if (STAGE_KEYS.has(s.key) && base.type === "base" && base.data.some((c) => String(c.stage || "").trim())) {
      base.type = "universal";
    }
    if (s.key === "sex" && base.type === "base" && base.data.some((c) => c.age1 || c.age2)) base.type = "universal";
    if (s.key === "body" && base.type === "base" && base.data.some((c) => c.height1 || c.height2)) base.type = "universal";
    pack.sections[s.key] = base;
  }
  return pack;
}

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanCard(key, type, card) {
  const out = { id: String(card.id || "-1"), title: String(card.title || "").trim() };
  if (key === "profession" && String(card.description || "").trim()) out.description = String(card.description).trim();
  if (key === "catastrophe") {
    const t = num(card.timer);
    if (t) out.timer = t;
  }
  if (STAGE_KEYS.has(key) && type === "universal" && String(card.stage || "").trim()) out.stage = String(card.stage).trim();
  if (key === "sex" && type === "universal") {
    const a = num(card.age1);
    const b = num(card.age2);
    if (a) out.age1 = a;
    if (b) out.age2 = b;
  }
  if (key === "body" && type === "universal") {
    const a = num(card.height1);
    const b = num(card.height2);
    if (a) out.height1 = a;
    if (b) out.height2 = b;
  }
  return out;
}

export function buildPayload(pack) {
  const body = {
    title: String(pack.title || "").trim(),
    description: String(pack.description || "").trim(),
  };
  for (const s of SECTIONS) {
    const sec = pack.sections[s.key] || blankSection(s.key);
    const type = sec.type || "base";
    const out = { type, data: (sec.data || []).map((c) => cleanCard(s.key, type, c)) };
    if (STAGE_KEYS.has(s.key) && type === "custom") out.stage = (sec.stage || ["", "", "", "", "", ""]).slice(0, 6);
    if (s.key === "sex") {
      out.sexType = sec.sexType || "base";
      if (sec.childFree) out.childFree = true;
      if (type === "custom") {
        const a = num(sec.age1);
        const b = num(sec.age2);
        if (a) out.age1 = a;
        if (b) out.age2 = b;
      }
    }
    if (s.key === "body" && type === "custom") {
      const a = num(sec.height1);
      const b = num(sec.height2);
      if (a) out.height1 = a;
      if (b) out.height2 = b;
    }
    body[s.key] = out;
  }
  if (pack.packID != null && Number(pack.packID) !== -1) body.packID = Number(pack.packID);
  return body;
}

function fileId(id) {
  const n = Number(id);
  return Number.isFinite(n) ? n : -1;
}

function fileCard(key, card) {
  const out = { title: String(card.title || "").trim(), id: fileId(card.id) };
  if (key === "profession" && String(card.description || "").trim()) out.description = String(card.description).trim();
  if (key === "catastrophe") {
    const t = num(card.timer);
    out.timer = t || null;
  }
  if (STAGE_KEYS.has(key) && String(card.stage || "").trim()) out.stage = String(card.stage).trim();
  if (key === "sex") {
    const a = num(card.age1);
    const b = num(card.age2);
    if (a) out.age1 = a;
    if (b) out.age2 = b;
  }
  if (key === "body") {
    const a = num(card.height1);
    const b = num(card.height2);
    if (a) out.height1 = a;
    if (b) out.height2 = b;
  }
  return out;
}

/** Файл для импорта на сайте: только разделы с data, title и itemIndex. */
export function buildFile(pack) {
  const body = {};
  SECTIONS.forEach((s, index) => {
    const sec = pack.sections[s.key] || blankSection(s.key);
    const type = sec.type || "base";
    const out = {
      data: (sec.data || []).map((c) => fileCard(s.key, c)),
      itemIndex: SECTIONS.length - index,
      title: s.fileTitle || s.title,
    };
    if (FILE_TYPE_KEYS.has(s.key)) out.type = type;
    if (STAGE_KEYS.has(s.key)) {
      out.stage =
        type === "custom"
          ? [...(sec.stage || []), "", "", "", "", "", ""].slice(0, 6).map((x) => String(x || ""))
          : [];
    }
    if (SECTION_INFO[s.key]) out.smallInfo = SECTION_INFO[s.key];
    if (s.key === "sex") {
      out.sexType = sec.sexType || "base";
      out.childFree = Boolean(sec.childFree);
      out.isChildFree = Boolean(sec.childFree);
      if (type === "custom") {
        const a = num(sec.age1);
        const b = num(sec.age2);
        if (a) out.age1 = a;
        if (b) out.age2 = b;
      }
    }
    if (s.key === "body" && type === "custom") {
      const a = num(sec.height1);
      const b = num(sec.height2);
      if (a) out.height1 = a;
      if (b) out.height2 = b;
    }
    body[s.key] = out;
  });
  return body;
}

export function validatePack(pack) {
  const title = String(pack.title || "").trim();
  if (!title) return "Нужно название пака";
  if (title.length > 70) return "Название длиннее 70 символов";
  if (String(pack.description || "").length > 250) return "Описание длиннее 250 символов";
  for (const s of SECTIONS) {
    const sec = pack.sections[s.key];
    if (!sec) continue;
    if (s.key === "sex" && sec.sexType === "base") continue;
    for (const card of sec.data || []) {
      const t = String(card.title || "").trim();
      if (!t) return `${s.title}: пустая характеристика`;
      if (t.length > titleLimit(s.key)) return `${s.title}: текст длиннее ${titleLimit(s.key)}`;
      if (s.key === "catastrophe" && card.timer && !/^\d+$/.test(String(card.timer))) {
        return "Таймер катаклизма - только минуты, число";
      }
    }
    if (STAGE_KEYS.has(s.key) && sec.type === "custom") {
      const filled = (sec.stage || []).map((x) => String(x || "").trim()).filter(Boolean);
      if (filled.length && filled.length < 6) return `${s.title}: для кастомных стадий нужно 6 значений`;
    }
  }
  return "";
}

export function nextCardId(data) {
  let n = 0;
  for (const row of data || []) {
    const v = Number(row.id);
    if (Number.isFinite(v) && v < n) n = v;
  }
  return String(n - 1);
}

export function countCards(sec, key) {
  if (key === "sex" && sec?.sexType === "base") return 0;
  return (sec?.data || []).filter((c) => String(c.title || "").trim()).length;
}
