import React, { useEffect, useMemo, useState } from "react";
import logo from "./img/defaultPhoto.png";
import {
  SECTION_INFO,
  SECTIONS,
  buildFile,
  buildPayload,
  countCards,
  emptyPack,
  nextCardId,
  packFromServer,
  titleLimit,
  validatePack,
} from "./packModel.js";

const STAGE_LABEL = ["1", "2", "3", "4", "5", "6"];

function TypeRadios({ value, onChange, labels }) {
  return (
    <div className="row wrap">
      {labels.map((item) => (
        <label key={item.value} className="check">
          <input type="radio" checked={value === item.value} onChange={() => onChange(item.value)} />
          {item.label}
        </label>
      ))}
    </div>
  );
}

function fileBase(p) {
  const parts = String(p || "").split(/[/\\]/);
  return parts[parts.length - 1] || "";
}

export default function PackEditor({ packId, filePack, filePath, offline, onBack, onError, onInfo }) {
  const [pack, setPack] = useState(null);
  const [snap, setSnap] = useState("");
  const [section, setSection] = useState("catastrophe");
  const [infoKey, setInfoKey] = useState(null);
  const [localPath, setLocalPath] = useState(filePath || "");
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState("");

  useEffect(() => {
    let stop = false;
    (async () => {
      if (packId === "new" || packId === "file" || packId === "local") {
        const fresh = packId === "file" && filePack ? packFromServer(filePack) : emptyPack();
        if (!fresh.title && filePath) fresh.title = fileBase(filePath).replace(/\.json$/i, "");
        if (!stop) {
          setPack(fresh);
          setSnap(JSON.stringify(fresh));
        }
        return;
      }
      try {
        const data = await window.packApi.getPack(packId);
        const next = packFromServer(data.pack);
        if (Number(next.packID) === -1) next.packID = Number(packId);
        if (stop) return;
        setPack(next);
        setSnap(JSON.stringify(next));
        if (data.usedPack) setWarn("Этот пак уже используется в игре. Сохранение может быть отклонено.");
      } catch (e) {
        onError(e.message || String(e));
        onBack();
      }
    })();
    return () => {
      stop = true;
    };
  }, [packId]);

  useEffect(() => {
    if (!infoKey) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setInfoKey(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoKey]);

  const dirty = pack && JSON.stringify(pack) !== snap;
  const meta = SECTIONS.find((s) => s.key === section) || SECTIONS[0];
  const infoHtml = infoKey ? SECTION_INFO[infoKey] : "";
  const sec = pack?.sections?.[section];

  function patchSection(partial) {
    setPack((cur) => ({
      ...cur,
      sections: { ...cur.sections, [section]: { ...cur.sections[section], ...partial } },
    }));
  }

  function patchCard(id, partial) {
    patchSection({
      data: sec.data.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    });
  }

  function addCard() {
    const id = nextCardId(sec.data);
    patchSection({
      data: [...sec.data, { id, title: "", description: "", stage: "", timer: "", age1: "", age2: "", height1: "", height2: "" }],
    });
  }

  function removeCard(id) {
    patchSection({ data: sec.data.filter((c) => c.id !== id) });
  }

  async function save() {
    if (offline) {
      onError("В автономном режиме выгрузка в профиль недоступна");
      return;
    }
    const problem = validatePack(pack);
    if (problem) {
      onError(problem);
      return;
    }
    setBusy(true);
    try {
      const payload = buildPayload(pack);
      const res = await window.packApi.savePack(payload);
      const next = { ...pack, packID: res.packID ?? pack.packID };
      setPack(next);
      setSnap(JSON.stringify(next));
      onInfo(packId === "file" ? "Пак выгружен в профиль" : Number(pack.packID) === -1 ? "Пак создан" : "Пак сохранён");
    } catch (e) {
      onError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function dedupe() {
    if (offline || Number(pack.packID) === -1) {
      setPack((cur) => {
        const sections = { ...cur.sections };
        for (const s of SECTIONS) {
          const seen = new Set();
          sections[s.key] = {
            ...sections[s.key],
            data: (sections[s.key].data || []).filter((c) => {
              const key = String(c.title || "").trim().toLowerCase();
              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            }),
          };
        }
        return { ...cur, sections };
      });
      onInfo("Повторы в тексте убраны локально. Сохрани пак.");
      return;
    }
    setBusy(true);
    try {
      await window.packApi.dedupePack(pack.packID);
      const data = await window.packApi.getPack(pack.packID);
      const next = packFromServer(data.pack);
      if (Number(next.packID) === -1) next.packID = Number(pack.packID);
      setPack(next);
      setSnap(JSON.stringify(next));
      onInfo("Дубликаты удалены");
    } catch (e) {
      onError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    if (!window.confirm("Очистить все характеристики? Название пака останется.")) return;
    const fresh = emptyPack();
    fresh.packID = pack.packID;
    fresh.title = pack.title;
    fresh.description = pack.description;
    setPack(fresh);
  }

  async function saveLocal() {
    setBusy(true);
    try {
      const text = JSON.stringify(buildFile(pack), null, 2);
      const name = `${(pack.title || "pack").replace(/[^\wа-яё-]+/gi, "_")}.json`;
      const res = await window.packApi.saveFile(localPath, text, name);
      if (res?.canceled) return;
      if (res?.path) setLocalPath(res.path);
      setSnap(JSON.stringify(pack));
      onInfo(res?.path ? `Сохранено: ${fileBase(res.path)}` : "Пак сохранён локально");
    } catch (e) {
      onError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(buildFile(pack), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(pack.title || "pack").replace(/[^\wа-яё-]+/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result || ""));
        const next = packFromServer(json);
        next.packID = pack.packID;
        if (!next.title) next.title = file.name.replace(/\.json$/i, "");
        setPack(next);
        onInfo("Файл подставлен. Проверь и сохрани.");
      } catch {
        onError("Не удалось прочитать JSON");
      }
    };
    reader.readAsText(file);
  }

  function leave() {
    if (dirty && !window.confirm("Есть несохранённые правки. Выйти?")) return;
    onBack();
  }

  const fromFile = packId === "file" || packId === "local";
  const localOnly = Boolean(offline) || packId === "local";
  const cards = useMemo(() => sec?.data || [], [sec]);
  const hideCards = section === "sex" && sec?.sexType === "base";

  if (!pack || !sec) {
    return (
      <div className="gate">
        <p className="muted">Загружаем пак…</p>
      </div>
    );
  }

  return (
    <div className="editor">
      <header className="home-top">
        <div className="home-brand">
          <span className="home-mark">
            <img src={logo} alt="" />
          </span>
          <div>
          <strong>
            {fromFile || localOnly ? "Локальный пак" : Number(pack.packID) === -1 ? "Новый пак" : `Пак #${pack.packID}`}
          </strong>
          <div className="muted">
            {fromFile && fileBase(localPath) ? `${fileBase(localPath)} · ` : ""}
            {dirty ? "Есть правки" : "Сохранено"}
          </div>
          </div>
        </div>
        <div className="home-user">
          {fromFile || localOnly ? (
            <>
              <button disabled={busy} onClick={saveLocal}>
                Сохранить локально
              </button>
              {localOnly ? null : (
                <button disabled={busy} onClick={save}>
                  Выгрузить в профиль
                </button>
              )}
            </>
          ) : (
            <button disabled={busy || !dirty} onClick={save}>
              {Number(pack.packID) === -1 ? "Создать" : "Сохранить"}
            </button>
          )}
          <button className="ghost" onClick={leave}>
            Выйти
          </button>
        </div>
      </header>
      {warn ? <p className="warn-line">{warn}</p> : null}
      <div className="editor-head home-card">
        <label>
          Название
          <input
            maxLength={70}
            value={pack.title}
            placeholder="Название вашего пака"
            onChange={(e) => setPack({ ...pack, title: e.target.value })}
          />
        </label>
        <label>
          Описание
          <textarea
            rows={2}
            maxLength={250}
            value={pack.description}
            placeholder="Краткое описание вашего пака"
            onChange={(e) => setPack({ ...pack, description: e.target.value })}
          />
        </label>
        <div className="row wrap">
          <button className="ghost tiny" onClick={clearAll}>
            Очистить всё
          </button>
          <button className="ghost tiny" onClick={dedupe}>
            Удалить дубликаты
          </button>
          <button className="ghost tiny" onClick={exportJson}>
            Скачать JSON
          </button>
          <label className="ghost tiny file-btn">
            Загрузить JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) importJson(file);
              }}
            />
          </label>
        </div>
      </div>
      <div className="editor-body">
        <nav className="editor-nav">
          {SECTIONS.map((s) => (
            <div key={s.key} className="nav-item">
              <button className={s.key === section ? "on" : "ghost"} onClick={() => setSection(s.key)}>
                {s.title}
                <small>{countCards(pack.sections[s.key], s.key)}</small>
              </button>
            </div>
          ))}
        </nav>
        <section className="editor-main">
          <div className="section-head">
            <h2>{meta.title}</h2>
            {SECTION_INFO[section] ? (
              <button type="button" className="info-i" title="Информация" onClick={() => setInfoKey(section)}>
                i
              </button>
            ) : null}
          </div>
          {meta.kind === "stage" || meta.kind === "health" ? (
            <TypeRadios
              value={sec.type}
              onChange={(type) => patchSection({ type })}
              labels={
                meta.kind === "health"
                  ? [
                      { value: "base", label: "Базовые степени" },
                      { value: "custom", label: "Свои степени" },
                      { value: "universal", label: "Универсальные степени" },
                    ]
                  : [
                      { value: "base", label: "Базовые" },
                      { value: "custom", label: "Свои стадии" },
                      { value: "universal", label: "Универсальные стадии" },
                    ]
              }
            />
          ) : null}
          {meta.kind === "body" ? (
            <TypeRadios
              value={sec.type}
              onChange={(type) => patchSection({ type })}
              labels={[
                { value: "base", label: "Базовый рост" },
                { value: "custom", label: "Свой рост" },
                { value: "universal", label: "Универсальный рост" },
              ]}
            />
          ) : null}
          {meta.kind === "sex" ? (
            <>
              <TypeRadios
                value={sec.type}
                onChange={(type) => patchSection({ type })}
                labels={[
                  { value: "base", label: "Базовый возраст" },
                  { value: "custom", label: "Свой возраст" },
                  { value: "universal", label: "Универсальный возраст" },
                ]}
              />
              <TypeRadios
                value={sec.sexType}
                onChange={(sexType) => patchSection({ sexType })}
                labels={[
                  { value: "base", label: "Базовый пол" },
                  { value: "custom", label: "Свои значения пола" },
                ]}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(sec.childFree)}
                  onChange={(e) => patchSection({ childFree: e.target.checked })}
                />
                Добавить «Чайлдфри»
              </label>
            </>
          ) : null}

          {section === "sex" && sec.type === "custom" ? (
            <div className="row">
              <label>
                Возраст от
                <input value={sec.age1} maxLength={10} onChange={(e) => patchSection({ age1: e.target.value.replace(/\D/g, "") })} />
              </label>
              <label>
                Возраст до
                <input value={sec.age2} maxLength={10} onChange={(e) => patchSection({ age2: e.target.value.replace(/\D/g, "") })} />
              </label>
            </div>
          ) : null}
          {section === "body" && sec.type === "custom" ? (
            <div className="row">
              <label>
                Рост от, см
                <input value={sec.height1} maxLength={10} onChange={(e) => patchSection({ height1: e.target.value.replace(/\D/g, "") })} />
              </label>
              <label>
                Рост до, см
                <input value={sec.height2} maxLength={10} onChange={(e) => patchSection({ height2: e.target.value.replace(/\D/g, "") })} />
              </label>
            </div>
          ) : null}
          {(meta.kind === "stage" || meta.kind === "health") && sec.type === "custom" ? (
            <div className="stage-grid">
              {STAGE_LABEL.map((n, i) => (
                <label key={n}>
                  Стадия {n}
                  <input
                    maxLength={240}
                    value={sec.stage?.[i] || ""}
                    placeholder={meta.kind === "health" ? "Степень" : "Стаж"}
                    onChange={(e) => {
                      const stage = [...(sec.stage || ["", "", "", "", "", ""])];
                      stage[i] = e.target.value;
                      patchSection({ stage });
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {hideCards ? <p className="muted">При базовом поле список своих значений скрыт.</p> : null}
          {!hideCards ? (
            <>
              <div className="row">
                <button onClick={addCard}>Добавить</button>
                <span className="muted">до {titleLimit(section)} символов</span>
              </div>
              <div className="card-list">
                {cards.map((card, index) => (
                  <article key={card.id} className="char-card">
                    <div className="row">
                      <b>#{index + 1}</b>
                      <button className="tiny danger" onClick={() => removeCard(card.id)}>
                        Удалить
                      </button>
                    </div>
                    <textarea
                      rows={section === "catastrophe" || section === "spec" ? 4 : 2}
                      maxLength={titleLimit(section)}
                      value={card.title}
                      placeholder="Ваша характеристика"
                      onChange={(e) => patchCard(card.id, { title: e.target.value })}
                    />
                    {section === "profession" ? (
                      <textarea
                        rows={2}
                        maxLength={700}
                        value={card.description}
                        placeholder="Описание профессии"
                        onChange={(e) => patchCard(card.id, { description: e.target.value })}
                      />
                    ) : null}
                    {section === "catastrophe" ? (
                      <label>
                        Таймер, минуты
                        <input
                          maxLength={10}
                          value={card.timer}
                          placeholder="Таймер катаклизма"
                          onChange={(e) => patchCard(card.id, { timer: e.target.value.replace(/\D/g, "") })}
                        />
                      </label>
                    ) : null}
                    {(meta.kind === "stage" || meta.kind === "health") && sec.type === "universal" ? (
                      <input
                        maxLength={240}
                        value={card.stage}
                        placeholder={meta.kind === "health" ? "Степень" : "Стаж"}
                        onChange={(e) => patchCard(card.id, { stage: e.target.value })}
                      />
                    ) : null}
                    {section === "sex" && sec.type === "universal" ? (
                      <div className="row">
                        <input
                          value={card.age1}
                          placeholder="Возраст от"
                          onChange={(e) => patchCard(card.id, { age1: e.target.value.replace(/\D/g, "") })}
                        />
                        <input
                          value={card.age2}
                          placeholder="Возраст до"
                          onChange={(e) => patchCard(card.id, { age2: e.target.value.replace(/\D/g, "") })}
                        />
                      </div>
                    ) : null}
                    {section === "body" && sec.type === "universal" ? (
                      <div className="row">
                        <input
                          value={card.height1}
                          placeholder="Рост от"
                          onChange={(e) => patchCard(card.id, { height1: e.target.value.replace(/\D/g, "") })}
                        />
                        <input
                          value={card.height2}
                          placeholder="Рост до"
                          onChange={(e) => patchCard(card.id, { height2: e.target.value.replace(/\D/g, "") })}
                        />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
      {infoHtml ? (
        <div className="popup" onMouseDown={() => setInfoKey(null)}>
          <div className="popup__block" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="popup__closeBtn" aria-label="Закрыть" onClick={() => setInfoKey(null)}>
              ×
            </button>
            <div className="popup__body">
              <div dangerouslySetInnerHTML={{ __html: infoHtml }} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
