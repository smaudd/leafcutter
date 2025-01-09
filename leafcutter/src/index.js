const electron = require("electron");
const Storage = require("./services/Storage");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

class Main {
  constructor({ dependencies: { electron, storage } }) {
    console.log("[MAIN] Starting...");
    this.app = electron.app;
    this.BrowserWindow = electron.BrowserWindow;
    this.ipcMain = electron.ipcMain;
    this.autoUpdater = electron.autoUpdater;
    this.dialog = electron.dialog;
    this.storage = storage;
    this.init();
  }

  init() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    this.app.on("ready", this.createWindow.bind(this));

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    this.app.on("window-all-closed", this.quitWindow.bind(this));

    this.app.on("activate", () => {
      if (this.BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  createWindow() {
    // Create the browser window.
    this.mainWindow = new this.BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });

    this.mainWindow.loadFile("./src/index.html");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  }

  quitWindow() {
    if (process.platform !== "darwin") {
      this.app.quit();
    }
  }
}

new Main({
  dependencies: {
    electron,
    storage: new Storage({
      dependencies: {
        fs,
        path,
        electron,
        crypto,
      },
    }),
  },
});

// ipcMain.on("ondragstart", async (event, fileUrl) => {
//   // download and save to tmp folder
//   const fileName = fileUrl.split("/").pop();
//   const filePath = path.join(app.getPath("temp"), fileName);
//   await downloadFile(fileUrl, filePath);
//   event.preventDefault();
//   event.sender.startDrag({
//     file: filePath,
//     icon: path.join(__dirname, "assets", "icon.png"),
//   });
// });

// ipcMain.on("ondragend", async (event, fileUrl) => {});
