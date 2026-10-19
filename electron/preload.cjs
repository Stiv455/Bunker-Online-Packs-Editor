const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("packApi", {
  boot: () => ipcRenderer.invoke("session:boot"),
  login: (login, password, rememberMe) => ipcRenderer.invoke("auth:login", { login, password, rememberMe }),
  logout: () => ipcRenderer.invoke("auth:logout"),
  openExternal: (url) => ipcRenderer.invoke("app:openExternal", url),
  listPacks: () => ipcRenderer.invoke("packs:list"),
  getPack: (id) => ipcRenderer.invoke("packs:get", id),
  savePack: (payload) => ipcRenderer.invoke("packs:save", payload),
  saveFile: (filePath, text, suggestedName) => ipcRenderer.invoke("packs:saveFile", { filePath, text, suggestedName }),
  filePath: (file) => {
    try {
      return webUtils.getPathForFile(file) || "";
    } catch {
      return "";
    }
  },
  deletePack: (id) => ipcRenderer.invoke("packs:delete", id),
  dedupePack: (id) => ipcRenderer.invoke("packs:dedupe", id),
});
