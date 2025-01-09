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
  startDrag: (file, mode = "cloud") =>
    ipcRenderer.send("ondragstart", file, mode),
  endDrag: (file) => ipcRenderer.send("ondragend", file),
  getDirectoryIndex: (dir) => ipcRenderer.invoke("get-directory-index", dir),
  getFile: (file, mode = "cloud") => ipcRenderer.invoke("get-file", file, mode),
  getIndex: (
    file,
    mode = "cloud" // mode can be "cloud" or "local"
  ) => ipcRenderer.invoke("get-index", file, mode),
  getUserDirectory: (dir) => ipcRenderer.invoke("get-user-directory", dir),
  getUserLibraryConfig: () => ipcRenderer.invoke("get-user-library-config"),
  deleteUserDirectory: (dir) =>
    ipcRenderer.invoke("remove-user-directory", dir),
});
