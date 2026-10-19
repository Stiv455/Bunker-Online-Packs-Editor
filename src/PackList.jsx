import React, { useEffect, useRef, useState } from "react";
import logo from "./img/defaultPhoto.png";
import About from "./About.jsx";

function text(v) {
  if (v == null) return "";
  if (typeof v === "object") return String(v.ru || v.en || "");
  return String(v);
}



export default function PackList({ session, offline, onLogout, onEdit, onOpenFile, onError, onInfo }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ mayCreate: false, maxCustomPacks: 0 });
  const [busy, setBusy] = useState(false);
  const [about, setAbout] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    setBusy(true);
    try {
      const data = await window.packApi.listPacks();
      setRows(data.packs || []);
      setMeta({ mayCreate: Boolean(data.mayCreate), maxCustomPacks: Number(data.maxCustomPacks) || 0 });
    } catch (e) {
      onError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!offline) load();
  }, [offline]);

  const custom = rows.filter((p) => Number(p.status) === 2);

  async function remove(pack) {
    const name = text(pack.namePack) || pack.id;
    if (!window.confirm(`Удалить пак «${name}»? Это нельзя отменить.`)) return;
    try {
      await window.packApi.deletePack(pack.id);
      setRows((list) => list.filter((p) => p.id !== pack.id));
      onInfo("Пак удалён");
    } catch (e) {
      onError(e.message || String(e));
    }
  }

  const limit = meta.maxCustomPacks > 0 && custom.length >= meta.maxCustomPacks;

  return (
    <div className="home">
      <header className="home-top">
        <div className="home-brand">
          <span className="home-mark">
            <img src={logo} alt="" />
          </span>
          <div>
            <strong>Главное меню</strong>
            <div className="muted">{offline ? "Автономный режим" : session?.nickname || "аккаунт"}</div>
          </div>
        </div>
        <div className="home-user">
          {offline ? null : (
            <button className="ghost" disabled={busy} onClick={load}>
              Обновить
            </button>
          )}
          <button className="ghost" onClick={() => setAbout(true)}>
            О программе
          </button>
          <button className="ghost" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>
      <div className="home-body">
        <div className="pack-toolbar">
          {offline ? (
            <button onClick={() => onEdit("local")}>Создать пак</button>
          ) : (
            <button disabled={!meta.mayCreate || limit} onClick={() => onEdit("new")}>
              Создать пак
            </button>
          )}
          <button className="ghost" onClick={() => fileRef.current?.click()}>
            Открыть
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  let diskPath = "";
                  try {
                    diskPath = window.packApi.filePath(file) || "";
                  } catch {
                    diskPath = "";
                  }
                  onOpenFile(JSON.parse(String(reader.result || "{}")), diskPath);
                } catch {
                  onError("Не удалось прочитать JSON");
                }
              };
              reader.readAsText(file);
            }}
          />
          {!offline && !meta.mayCreate ? <span className="muted">У вас нет права создавать свои паки.</span> : null}
          {!offline && limit ? (
            <span className="muted">
              Лимит своих паков: {custom.length} из {meta.maxCustomPacks}
            </span>
          ) : null}
        </div>
        <section className="home-card">
          <h2>
            {offline ? "Локальные паки" : "Мои паки"} {!offline ? <em className="home-count">{custom.length}</em> : null}
          </h2>
          {offline ? (
            <p className="muted">В данном режиме поддерживается работа с локальными паками. Открой действующий пак или создай новый.</p>
          ) : null}
          {!offline && !custom.length ? <p className="muted">Своих паков пока нет.</p> : null}
          {!offline ? (
          <ul className="pack-list">
            {custom.map((p) => (
              <li key={p.id} className="pack-row">
                <div>
                  <b>{text(p.namePack) || text(p.title) || `Пак ${p.id}`}</b>
                  {text(p.text) ? <div className="muted">{text(p.text)}</div> : null}
                  {p.changingRightNow ? <span className="tag gold">Обновляется</span> : null}
                </div>
                <div className="row">
                  <button className="tiny" onClick={() => onEdit(p.id)}>
                    Редактировать
                  </button>
                  <button className="tiny danger" onClick={() => remove(p)}>
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
          ) : null}
        </section>
      </div>
      {about ? <About onClose={() => setAbout(false)} onError={onError} /> : null}
    </div>
  );
}
