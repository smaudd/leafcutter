const electron = require("electron");
const Storage = require("./services/Storage");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const UserLibrary = require("./services/UserLibrary");

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

  // Helper method to get cached file path using Storage service logic
  // This replicates the library structure locally for persistent storage
  getCachedFilePath(fileUrl) {
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      const cachePath = path.join(this.app.getPath("userData"), pathname);
      console.log(`[MAIN] Cache path for ${fileUrl}: ${cachePath}`);
      return cachePath;
    } catch (error) {
      console.error("Invalid URL for cache lookup:", error.message);
      return null;
    }
  }

  // Helper method to get library info from URL for better organization
  getLibraryInfo(fileUrl) {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname
        .split("/")
        .filter((part) => part.length > 0);

      return {
        host: url.hostname,
        libraryPath: pathParts.slice(0, -1).join("/"), // Path without filename
        filename: pathParts[pathParts.length - 1] || "unknown_file",
        fullPath: url.pathname,
      };
    } catch (error) {
      console.error("Error parsing library info:", error.message);
      return null;
    }
  }

  downloadFile(fileUrl, filePath) {
    return new Promise((resolve, reject) => {
      console.log(`[MAIN] Downloading ${fileUrl} to ${filePath}`);

      const file = fs.createWriteStream(filePath);
      const request = require("https").get(fileUrl, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(filePath, () => {}); // Clean up partial file
          reject(
            new Error(`Failed to get '${fileUrl}' (${response.statusCode})`)
          );
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`[MAIN] Successfully downloaded ${fileUrl}`);
          resolve();
        });
      });

      request.on("error", (err) => {
        file.close();
        fs.unlink(filePath, () => {}); // Clean up partial file
        console.error(`[MAIN] Download error:`, err);
        reject(err);
      });

      file.on("error", (err) => {
        file.close();
        fs.unlink(filePath, () => {}); // Clean up partial file
        console.error(`[MAIN] File write error:`, err);
        reject(err);
      });
    });
  }

  // Clean up old files from fallback downloads directory only (older than 7 days)
  // Note: Storage service cached files are preserved to maintain library structure
  // cleanupOldFiles() {
  //   const downloadsDir = path.join(this.app.getPath("userData"), "downloads");
  //   if (!fs.existsSync(downloadsDir)) return;

  //   const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  //   try {
  //     const files = fs.readdirSync(downloadsDir);
  //     files.forEach((file) => {
  //       const filePath = path.join(downloadsDir, file);
  //       const stats = fs.statSync(filePath);

  //       if (stats.mtime.getTime() < sevenDaysAgo) {
  //         fs.unlinkSync(filePath);
  //         console.log(`[MAIN] Cleaned up old fallback file: ${file}`);
  //       }
  //     });
  //   } catch (error) {
  //     console.error("[MAIN] Error cleaning up old files:", error);
  //   }
  // }

  // Helper method to get cache statistics for debugging/management
  getCacheStats() {
    const userDataPath = this.app.getPath("userData");
    const stats = {
      libraries: {},
      totalFiles: 0,
      totalSize: 0,
    };

    try {
      const walkDir = (dir, relativePath = "") => {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
          const fullPath = path.join(dir, file);
          const fileRelativePath = path.join(relativePath, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walkDir(fullPath, fileRelativePath);
          } else {
            // Skip system files and directories
            if (
              !file.startsWith(".") &&
              !fileRelativePath.includes("downloads")
            ) {
              const pathParts = fileRelativePath.split(path.sep);
              if (pathParts.length > 1) {
                const libraryKey = pathParts[0];
                if (!stats.libraries[libraryKey]) {
                  stats.libraries[libraryKey] = { files: 0, size: 0 };
                }
                stats.libraries[libraryKey].files++;
                stats.libraries[libraryKey].size += stat.size;
                stats.totalFiles++;
                stats.totalSize += stat.size;
              }
            }
          }
        });
      };

      walkDir(userDataPath);
    } catch (error) {
      console.error("[MAIN] Error calculating cache stats:", error);
    }

    return stats;
  }

  init() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    this.app.on("ready", () => {
      this.createWindow();
      // Clean up old cached files on startup
      // this.cleanupOldFiles();

      // Log cache statistics for debugging
      const cacheStats = this.getCacheStats();
      console.log("[MAIN] Cache statistics:", {
        totalFiles: cacheStats.totalFiles,
        totalSizeMB: (cacheStats.totalSize / (1024 * 1024)).toFixed(2),
        libraries: Object.keys(cacheStats.libraries).length,
      });

      if (Object.keys(cacheStats.libraries).length > 0) {
        console.log(
          "[MAIN] Cached libraries:",
          Object.keys(cacheStats.libraries)
        );
      }
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    this.app.on("window-all-closed", this.quitWindow.bind(this));

    this.app.on("activate", () => {
      if (this.BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    this.ipcMain.on("ondragstart", async (event, fileUrl, mode = "cloud") => {
      console.log("[MAIN] Dragging file...", fileUrl);

      let filePath;

      if (mode === "cloud") {
        const libraryInfo = this.getLibraryInfo(fileUrl);
        if (libraryInfo) {
          console.log(
            `[MAIN] Library: ${libraryInfo.host}${libraryInfo.libraryPath}, File: ${libraryInfo.filename}`
          );
        }

        // Check if file is already cached by Storage service
        const cachedPath = this.getCachedFilePath(fileUrl);

        if (cachedPath && fs.existsSync(cachedPath)) {
          console.log("[MAIN] Using Storage service cached file:", cachedPath);
          filePath = cachedPath;
        } else {
          // Use Storage service's path structure for consistency and persistence
          const storagePath = this.getCachedFilePath(fileUrl);

          if (storagePath) {
            const basePath = path.dirname(storagePath);
            // Ensure directory structure exists (replicates library structure)
            if (!fs.existsSync(basePath)) {
              fs.mkdirSync(basePath, { recursive: true });
              console.log(
                `[MAIN] Created library directory structure: ${basePath}`
              );
            }

            filePath = storagePath;

            if (!fs.existsSync(filePath)) {
              console.log("[MAIN] Downloading to library structure:", filePath);
              await this.downloadFile(fileUrl, filePath);
            } else {
              console.log("[MAIN] Using existing cached file:", filePath);
            }
          } else {
            // Fallback to downloads directory if URL parsing fails
            const fileName =
              fileUrl.split("/").pop() || `audio_${Date.now()}.mp3`;
            const userDataPath = this.app.getPath("userData");
            const downloadsDir = path.join(userDataPath, "downloads");

            if (!fs.existsSync(downloadsDir)) {
              fs.mkdirSync(downloadsDir, { recursive: true });
            }

            filePath = path.join(downloadsDir, fileName);

            if (!fs.existsSync(filePath)) {
              console.log("[MAIN] Fallback download:", filePath);
              await this.downloadFile(fileUrl, filePath);
            }
          }
        }
      } else {
        // Local file mode - use the provided path directly
        filePath = fileUrl;
      }

      console.log("[MAIN] Starting drag with file:", filePath);
      event.sender.startDrag({
        file: filePath,
        icon: path.join(__dirname, "assets", "icon.png"),
      });
    });
  }

  createWindow() {
    // Create the browser window.
    this.mainWindow = new this.BrowserWindow({
      width: 620,
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

const baseDependencies = {
  fs,
  path,
  electron,
  crypto,
};

new Main({
  dependencies: {
    electron,
    storage: new Storage({
      dependencies: baseDependencies,
    }),
    userLibrary: new UserLibrary({
      dependencies: baseDependencies,
    }),
  },
});

// ipcMain.on("ondragend", async (event, fileUrl) => {});
