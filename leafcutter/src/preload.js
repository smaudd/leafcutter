// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,

  // we can also expose variables, not just functions
});

contextBridge.exposeInMainWorld("electron", {
  startDrag: (fileName) => ipcRenderer.send("ondragstart", fileName),
  endDrag: (fileName) => ipcRenderer.send("ondragend", fileName),
  getDirectoryIndex: (folderPath) =>
    ipcRenderer.invoke("get-directory-index", folderPath),
  getFile: (filePath) => ipcRenderer.invoke("get-file", filePath),
  getDirectoryState: () => ipcRenderer.invoke("get-directory-state"),
  syncDir: (dirStructure) =>
    ipcRenderer.send("sync-directory-state", dirStructure),
  clearDir: () => ipcRenderer.invoke("clear-directory-state"),
});
