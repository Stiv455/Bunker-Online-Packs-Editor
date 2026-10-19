import React, { useEffect, useState } from "react";
import logo from "./img/defaultPhoto.png";
import PackEditor from "./PackEditor.jsx";
import PackList from "./PackList.jsx";

export default function App() {
  const [boot, setBoot] = useState(true);
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("list");
  const [packId, setPackId] = useState(null);
  const [filePack, setFilePack] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  function say(text, kind = "error") {
    setNote({ text, kind });
  }

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 5000);
    return () => clearTimeout(t);
  }, [note]);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.packApi.boot();
        if (r.login) setLogin(r.login);
        setRemember(r.rememberMe !== false);
        if (r.ok) setSession(r);
        else if (r.error) say(r.error);
      } catch (e) {
        say(e.message || String(e));
      } finally {
        setBoot(false);
      }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      setSession(await window.packApi.login(login.trim(), password, remember));
      setPassword("");
    } catch (err) {
      say(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (offline) {
      setOffline(false);
      setFilePack(null);
      setFilePath("");
      setScreen("list");
      return;
    }
    await window.packApi.logout();
    setSession(null);
    setScreen("list");
  }

  if (boot) {
    return (
      <div className="gate boot-screen">
        <div className="boot-card">
          <span className="home-mark boot-logo">
            <img src={logo} alt="" />
          </span>
          <p className="home-kicker">Bunker Online</p>
          <h1>Подождите..</h1>
          <div className="boot-spin" />
          <p className="muted">Проверяем сессию…</p>
        </div>
      </div>
    );
  }

  if (!session?.token && !offline) {
    return (
      <div className="gate boot-screen">
        <form className="boot-card login-card" onSubmit={submit}>
          <span className="home-mark boot-logo">
            <img src={logo} alt="" />
          </span>
          <p className="home-kicker">Bunker Online</p>
          <h1>Вход</h1>
          {note ? <p className={note.kind === "ok" ? "ok" : "err"}>{note.text}</p> : null}
          <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин" autoFocus />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" />
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Запомнить
          </label>
          <button disabled={busy || !login.trim() || !password}>{busy ? "Входим…" : "Войти"}</button>
          <button type="button" className="ghost" onClick={() => setOffline(true)}>
            Автономный режим
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      {note ? <div className={`toast ${note.kind}`}>{note.text}</div> : null}
      {screen === "editor" ? (
        <PackEditor
          packId={packId}
          filePack={filePack}
          filePath={filePath}
          offline={offline}
          onBack={() => {
            setFilePack(null);
            setFilePath("");
            setScreen("list");
          }}
          onError={(t) => say(t, "error")}
          onInfo={(t) => say(t, "ok")}
        />
      ) : (
        <PackList
          session={session}
          offline={offline}
          onLogout={logout}
          onEdit={(id) => {
            setFilePack(null);
            setFilePath("");
            setPackId(id);
            setScreen("editor");
          }}
          onOpenFile={(json, path) => {
            setFilePack(json);
            setFilePath(path || "");
            setPackId("file");
            setScreen("editor");
          }}
          onError={(t) => say(t, "error")}
          onInfo={(t) => say(t, "ok")}
        />
      )}
    </div>
  );
}
