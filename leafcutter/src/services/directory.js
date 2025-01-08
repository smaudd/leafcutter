const fs = require("fs");
const path = require("path");
const {
  app,
  BrowserWindow,
  ipcMain,
  autoUpdater,
  dialog,
} = require("electron");

module.exports = function directory() {
  let state = {};
  const filePath = path.join(app.getPath("userData"), "directory.json");
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Read the file
    const data = fs.readFileSync(filePath, "utf8");
    // Parse the JSON data
    state = JSON.parse(data);
  }
  function save(data) {
    console.log("SATE SAVE", data);
    // Save the data to the file
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  function read(path) {
    if (state[path]) {
      return state[path];
    }
    // path could be nested, so we need to split it and fetch each part
    const segments = path.replace("index.json", "").split("/").filter(Boolean);
    let currentPath = "";
    let currentData = state;
    for (const part of segments) {
      currentPath += part;
      if (currentData[part]) {
        currentData = currentData[part];
      } else {
        break;
      }
    }
    if (currentData) {
      if (Object.keys(currentData).length === 0) {
        return null;
      }
      return currentData;
    }
    return null;
  }

  function savePath(path, data) {
    const segments = path.replace("index.json", "").split("/").filter(Boolean);
    let currentPath = "";
    let currentData = state;
    for (const part of segments) {
      currentPath += part;
      if (!currentData[part]) {
        currentData[part] = {};
      }
      currentData = currentData[part];
    }
    currentData = data;
    save(state);
  }

  function del() {
    // Delete the file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    state = {};
  }

  return {
    state,
    save,
    read,
    savePath,
    del,
  };
};
