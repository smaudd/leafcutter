const {
  app,
  BrowserWindow,
  ipcMain,
  autoUpdater,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const directory = require("./services/directory")();
// const started = require("electron-squirrel-startup");

// import { updateElectronApp, UpdateSourceType } from "update-electron-app";

// const UPDATE_URL = `https://couponsb.fra1.digitaloceanspaces.com/releases/${process.platform}/${process.arch}`;
// updateElectronApp({
//   updateSource: {
//     type: UpdateSourceType.StaticStorage,
//     baseUrl: UPDATE_URL,
//   },
// });

// autoUpdater.setFeedURL({ url: UPDATE_URL });

// // Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (started) {
//   app.quit();
// }

const https = require("https");

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
};

ipcMain.on("ondragstart", async (event, fileUrl) => {
  // download and save to tmp folder
  const fileName = fileUrl.split("/").pop();
  const filePath = path.join(app.getPath("temp"), fileName);
  await downloadFile(fileUrl, filePath);
  event.preventDefault();
  event.sender.startDrag({
    file: filePath,
    icon: path.join(__dirname, "assets", "icon.png"),
  });
});

ipcMain.on("ondragend", async (event, fileUrl) => {});

ipcMain.handle(
  "get-directory-index",
  async (event, path = "", kind = "sample") => {
    // const savedData = directory.read(path);
    // if (savedData) {
    //   return savedData;
    // }
    // Perform some action, e.g., fetching data from an API
    console.log("Getting directory index:", path);
    const response = await fetch(
      `https://couponsb.fra1.digitaloceanspaces.com/${path}`
    );
    const data = await response.json();
    console.log("Requested directory index:", path, data);
    // directory.savePath(path, data);
    return { content: data }; // This will be sent back to the renderer process
  }
);

ipcMain.handle("get-file", async (event, pathname = "") => {
  try {
    const filePath = path.join(app.getPath("userData"), pathname);

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
      const fileBuffer = await fs.promises.readFile(filePath);
      return fileBuffer.buffer; // Return ArrayBuffer
    }

    // Fetch data from the API
    const response = await fetch(
      `https://couponsb.fra1.digitaloceanspaces.com/${pathname}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const data = await response.arrayBuffer();
    console.log("Data fetched from API, size:", data.byteLength);

    // Save file on disk
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, Buffer.from(data));
    console.log("File saved to disk:", filePath);

    return data; // Return ArrayBuffer
  } catch (error) {
    console.error("Error in get-file:", error);
    throw error; // Ensure error propagates back to the renderer process
  }
});

ipcMain.handle("clear-directory-state", async (event, path = "") => {
  directory.del();
});

ipcMain.handle("get-directory-state", async (event, path = "") => {
  return {};
});

ipcMain.on("sync-directory-state", async (event, data) => {
  directory.save(data);
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("./src/index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
