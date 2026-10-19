import { app, BrowserWindow, dialog, ipcMain, session as electronSession, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = "https://bunker-online.com";
const API = `${ORIGIN}/api`;
const DEV_URL = "http://127.0.0.1:5174";
const STORE_PATH = path.join(app.getPath("userData"), "session.json");
const PARTITION = "persist:bunker-packs";

let win;
let loginCooldownUntil = 0;
let refreshInFlight = null;
let session = {
  token: "",
  userId: null,
  nickname: "",
  rememberMe: false,
  savedLogin: "",
  savedPassword: "",
};

function hideSecret(s) {
  return Buffer.from(String(s || ""), "utf8").toString("base64");
}
function showSecret(s) {
  try {
    return Buffer.from(String(s || ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}
function loadStore() {
  try {
    session = { ...session, ...JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) };
  } catch {}
}
function saveStore() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(
      {
        token: session.token,
        userId: session.userId,
        nickname: session.nickname,
        rememberMe: session.rememberMe,
        savedLogin: session.savedLogin,
        savedPassword: session.savedPassword,
      },
      null,
      2
    )
  );
}
function publicSession() {
  return {
    token: session.token,
    userId: session.userId,
    nickname: session.nickname,
    rememberMe: Boolean(session.rememberMe),
    login: session.savedLogin || "",
  };
}
function tokenExpMs(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return 0;
    const json = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return json.exp ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}
function siteSession() {
  return electronSession.fromPartition(PARTITION);
}
function httpError(e) {
  const data = e?.data;
  if (e?.status === 422) {
    const first = Array.isArray(data?.errors) ? data.errors[0] : data?.message;
    return String(first || e.message || "Лимит паков");
  }
  if (e?.status === 409) {
    const ids = Array.isArray(data?.errors) ? data.errors.join(", ") : "";
    return ids ? `Пак уже используется: ${ids}` : data?.message || "Пак используется в игре";
  }
  if (e?.status === 402) return "Пак ещё обновляется. Подожди и открой снова.";
  if (e?.status === 404) return "Пак не найден";
  return String(data?.message || e?.message || e || "Ошибка запроса");
}

async function siteFetch(method, apiPath, { body } = {}) {
  const url = `${API}${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ru",
    Origin: ORIGIN,
    Referer: `${ORIGIN}/`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), method === "POST" && apiPath.includes("deleteDublicate") ? 60000 : 20000);
  try {
    const res = await siteSession().fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const err = new Error(String(data?.message || text || `HTTP ${res.status}`));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Сервер не ответил");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function refreshToken() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const data = await siteFetch("POST", "/user/refresh", { body: {} });
    if (data?.accessToken) {
      session.token = data.accessToken;
      if (data.user?.id != null) session.userId = data.user.id;
      if (data.user?.nickname) session.nickname = data.user.nickname;
      saveStore();
    }
    return session.token;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function ensureFreshToken() {
  if (!session.token) return;
  const exp = tokenExpMs(session.token);
  if (!exp || exp - Date.now() < 90_000) await refreshToken();
}

async function loginViaSite(login, password) {
  const hidden = new BrowserWindow({
    show: false,
    width: 480,
    height: 720,
    webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false },
  });
  const kill = setTimeout(() => {
    if (!hidden.isDestroyed()) hidden.destroy();
  }, 40000);
  try {
    await hidden.loadURL(`${ORIGIN}/ru`);
    await new Promise((r) => setTimeout(r, 1200));
    return await hidden.webContents.executeJavaScript(
      `;(async (login, password) => {
        let recaptchaToken = "";
        try {
          if (window.grecaptcha && grecaptcha.execute) {
            recaptchaToken = await grecaptcha.execute("6Lcmk30qAAAAAFE_GFuIDwYDjLO-Tuqv_RyBLQbK", { action: "login" });
          }
        } catch (e) {}
        const body = { login, password };
        if (recaptchaToken) body.recaptchaToken = recaptchaToken;
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
        return { status: res.status, data, retryAfter: Number(res.headers.get("retry-after") || 0) };
      })(${JSON.stringify(login)}, ${JSON.stringify(password)})`,
      true
    );
  } finally {
    clearTimeout(kill);
    if (!hidden.isDestroyed()) hidden.destroy();
  }
}

async function loginWithPassword(login, password, { bypassCooldown = false } = {}) {
  const wait = Math.ceil((loginCooldownUntil - Date.now()) / 1000);
  if (!bypassCooldown && wait > 0) throw new Error(`Слишком много попыток входа. Подожди ещё ${wait} сек.`);
  const result = await loginViaSite(login, password);
  const data = result?.data || {};
  if (result?.status === 429) {
    const sec = Number(result.retryAfter) > 0 ? Number(result.retryAfter) : 30;
    loginCooldownUntil = Date.now() + sec * 1000;
    throw new Error(`Слишком много попыток входа. Подожди ${sec} сек.`);
  }
  if (result?.status && result.status >= 400) throw new Error(data.message || `Вход не удался (${result.status})`);
  if (!data.accessToken) throw new Error(data.message || "Сервер не выдал токен");
  session.token = data.accessToken;
  session.userId = data.user?.id ?? null;
  session.nickname = data.user?.nickname || login;
  saveStore();
  return publicSession();
}

async function verifySession() {
  if (!session.token) return false;
  try {
    await ensureFreshToken();
    if (session.userId) await siteFetch("GET", `/user=${session.userId}`);
    return true;
  } catch {
    return false;
  }
}

async function authed(method, apiPath, body) {
  await ensureFreshToken();
  try {
    return await siteFetch(method, apiPath, body !== undefined ? { body } : {});
  } catch (e) {
    if (e.status !== 401 && e.status !== 403) throw e;
    if (!session.rememberMe || !session.savedLogin) throw e;
    await loginWithPassword(session.savedLogin, showSecret(session.savedPassword), { bypassCooldown: true });
    return await siteFetch(method, apiPath, body !== undefined ? { body } : {});
  }
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.resultData)) return data.resultData;
  if (Array.isArray(data?.packs)) return data.packs;
  const out = [];
  for (const key of ["basePacks", "advancePacks", "customPacks", "data"]) {
    if (Array.isArray(data?.[key])) out.push(...data[key]);
  }
  return out;
}

function loadPage(browserWindow) {
  if (!app.isPackaged) browserWindow.loadURL(DEV_URL);
  else browserWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#121214",
    autoHideMenuBar: true,
    title: "Паки Bunker",
    icon: path.join(__dirname, "../src/img/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  loadPage(win);
}

app.whenReady().then(() => {
  loadStore();
  createWindow();
});
app.on("window-all-closed", () => app.quit());

ipcMain.handle("session:boot", async () => {
  const remembered = { rememberMe: Boolean(session.rememberMe), login: session.savedLogin || "" };
  if (await verifySession()) return { ok: true, ...publicSession(), ...remembered };
  if (session.rememberMe && session.savedLogin && session.savedPassword) {
    try {
      const out = await loginWithPassword(session.savedLogin, showSecret(session.savedPassword));
      return { ok: true, ...out, rememberMe: true, login: session.savedLogin };
    } catch (e) {
      return { ok: false, ...remembered, error: e.message || "Автовход не удался" };
    }
  }
  return { ok: false, ...remembered };
});

ipcMain.handle("auth:login", async (_e, { login, password, rememberMe }) => {
  const out = await loginWithPassword(String(login || "").trim(), String(password || ""));
  session.rememberMe = Boolean(rememberMe);
  session.savedLogin = rememberMe ? String(login || "").trim() : "";
  session.savedPassword = rememberMe ? hideSecret(password) : "";
  saveStore();
  return { ...out, rememberMe: session.rememberMe, login: session.savedLogin };
});

ipcMain.handle("auth:logout", async () => {
  session = { token: "", userId: null, nickname: "", rememberMe: false, savedLogin: "", savedPassword: "" };
  saveStore();
  return { ok: true };
});

ipcMain.handle("packs:list", async () => {
  if (!session.token) throw new Error("Сначала войди");
  try {
    const [packsRaw, permRaw] = await Promise.all([
      authed("POST", "/user/allPacks", {}),
      authed("GET", "/getPermissions").catch(() => ({})),
    ]);
    const rows = asList(packsRaw);
    let maxCustomPacks = Number(packsRaw?.maxCustomPacks) || 0;
    const packs = [];
    for (const row of rows) {
      if (row && (Number(row.id) === -1 || row.maxCustomPacks != null)) {
        maxCustomPacks = Number(row.maxCustomPacks) || maxCustomPacks;
      }
      if (!row || Number(row.id) === -1) continue;
      packs.push(row);
    }
    const perms = permRaw?.permissions || permRaw?.resultData || permRaw || [];
    const mayCreate = Array.isArray(perms)
      ? perms.map(Number).includes(3)
      : Boolean(permRaw?.mayCreateCustomPack || perms?.createCustomPack);
    return { packs, maxCustomPacks, mayCreate };
  } catch (e) {
    throw new Error(httpError(e));
  }
});

ipcMain.handle("packs:get", async (_e, id) => {
  if (!session.token) throw new Error("Сначала войди");
  try {
    const data = await authed("GET", `/user/customPack/${id}`);
    return { pack: data?.resultData || data, usedPack: data?.usedPack || null };
  } catch (e) {
    throw new Error(httpError(e));
  }
});

ipcMain.handle("packs:save", async (_e, payload) => {
  if (!session.token) throw new Error("Сначала войди");
  const update = payload?.packID != null && Number(payload.packID) !== -1;
  try {
    const data = await authed("POST", update ? "/user/customPack/update" : "/user/customPack/create", payload);
    return { packID: data?.packID ?? payload?.packID ?? null, raw: data };
  } catch (e) {
    throw new Error(httpError(e));
  }
});

const EXTERNAL_LINKS = new Set([
  "https://t.me/chikada2103",
  "https://github.com/Stiv455",
  "https://discord.com/users/524188893491494923",
]);

ipcMain.handle("app:openExternal", async (_e, url) => {
  const target = String(url || "").trim();
  if (!EXTERNAL_LINKS.has(target)) throw new Error("Ссылка не разрешена");
  await shell.openExternal(target);
  return { ok: true };
});

ipcMain.handle("packs:saveFile", async (_e, body) => {
  const text = String(body?.text ?? "");
  if (!text.trim()) throw new Error("Нечего сохранять");
  let target = "";
  const given = String(body?.filePath || "").trim();
  if (given) {
    target = path.resolve(given);
    if (!target.toLowerCase().endsWith(".json")) throw new Error("Можно сохранить только файл JSON");
  } else {
    const suggested = String(body?.suggestedName || "pack.json").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
    const pick = await dialog.showSaveDialog(win, {
      title: "Сохранить пак",
      defaultPath: suggested.toLowerCase().endsWith(".json") ? suggested : `${suggested}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (pick.canceled || !pick.filePath) return { canceled: true };
    target = pick.filePath;
    if (!target.toLowerCase().endsWith(".json")) target += ".json";
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text.endsWith("\n") ? text : `${text}\n`, "utf8");
  return { path: target };
});

ipcMain.handle("packs:delete", async (_e, id) => {
  if (!session.token) throw new Error("Сначала войди");
  try {
    await authed("POST", "/user/customPack/delete", { packID: Number(id) });
    return { ok: true };
  } catch (e) {
    throw new Error(httpError(e));
  }
});

ipcMain.handle("packs:dedupe", async (_e, id) => {
  if (!session.token) throw new Error("Сначала войди");
  try {
    await authed("POST", "/user/customPack/deleteDublicate", { packID: Number(id) });
    return { ok: true };
  } catch (e) {
    throw new Error(httpError(e));
  }
});

