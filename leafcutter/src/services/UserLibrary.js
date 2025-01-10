module.exports = class UserLibrary {
  constructor({ dependencies: { fs, path, crypto, electron } }) {
    console.log("[USERLIBRARY] Starting...");
    this.fs = fs;
    this.path = path;
    this.crypto = crypto;
    this.userDataPath = electron.app.getPath("userData");
    this.dialog = electron.dialog;
    this.ipcMain = electron.ipcMain;
    this.attachIpcHandlers();
  }

  attachIpcHandlers() {
    this.ipcMain.handle("get-user-directory", this.getDirectory.bind(this));
    this.ipcMain.handle(
      "get-user-library-config",
      this.getLibraryConfig.bind(this)
    );
    this.ipcMain.handle(
      "remove-user-directory",
      this.removeIndexedDirectory.bind(this)
    );
  }

  async removeIndexedDirectory(_, dir) {
    // Pop the directory from the user's library config file
    const libraryConfigPath = this.path.join(
      this.userDataPath,
      "library-config.json"
    );
    let libraryConfig;
    // check if the library config file exists
    if (!this.fs.existsSync(libraryConfigPath)) {
      return;
    }
    libraryConfig = JSON.parse(
      await this.fs.promises.readFile(libraryConfigPath, "utf-8")
    );
    // check if the directory is already in the library config
    if (!libraryConfig.directories.includes(dir)) {
      return;
    }
    libraryConfig.directories = libraryConfig.directories.filter(
      (d) => d !== dir
    );
    await this.fs.promises.writeFile(
      libraryConfigPath,
      JSON.stringify(libraryConfig)
    );
    await this.deleteSearchFolderAndIndexes(dir);

    // TODO: Delete the index.json file for the directory recursively
  }

  async saveIndexedDirectory(dir) {
    // Save the added library to the user's library config file
    const libraryConfigPath = this.path.join(
      this.userDataPath,
      "library-config.json"
    );
    let libraryConfig;
    // check if the library config file exists
    if (!this.fs.existsSync(libraryConfigPath)) {
      libraryConfig = {
        directories: [dir],
      };
      await this.fs.promises.writeFile(
        libraryConfigPath,
        JSON.stringify(libraryConfig)
      );
    }
    libraryConfig = JSON.parse(
      await this.fs.promises.readFile(libraryConfigPath, "utf-8")
    );
    // check if the directory is already in the library config
    if (libraryConfig.directories.includes(dir)) {
      return;
    }
    libraryConfig.directories.push(dir);
    await this.fs.promises.writeFile(
      libraryConfigPath,
      JSON.stringify(libraryConfig)
    );
  }

  async getLibraryConfig() {
    const libraryConfigPath = this.path.join(
      this.userDataPath,
      "library-config.json"
    );
    if (!this.fs.existsSync(libraryConfigPath)) {
      return { directories: [] };
    }
    return JSON.parse(
      await this.fs.promises.readFile(libraryConfigPath, "utf-8")
    );
  }

  async getDirectory(event, dir) {
    let path = null;
    if (!dir) {
      const dialogResult = await this.dialog.showOpenDialog({
        properties: ["openDirectory"], // Open a folder selection dialog
      });
      if (dialogResult.canceled) {
        return { error: "No folder selected" };
      }
      console.log(dialogResult.filePaths);
      path = dialogResult.filePaths[0]; // Return the selected folder path
    } else {
      path = dir;
    }
    function wait(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }

    // read the directory recursively and return the structure
    try {
      await this.generateIndexDirectory(path);
      console.log("Saving", path);
      await this.saveIndexedDirectory(path);
      // await this.removeIndexedDirectory(path);
      // Read initial index.json file
      const index = await this.fs.promises.readFile(
        this.path.join(path, "index.json"),
        "utf-8"
      );
      return { ...JSON.parse(index), directory: path };
    } catch (error) {
      console.error("Error in get-user-directory:", error);
      return { error: error.message };
    }
  }

  async generateIndexDirectory(dir) {
    const supportedFormats = ["mp3", "wav", "flac", "ogg", "tiff", "midi"];
    const excludedFiles = [".DS_Store"];

    const calculateChecksum = (data) => {
      const hash = this.crypto.createHash("md5");
      hash.update(data);
      return hash.digest("hex");
    };

    const isSupportedFile = (file) => {
      const ext = this.path.extname(file).slice(1).toLowerCase();
      return supportedFormats.includes(ext) && !excludedFiles.includes(file);
    };

    const generateIndex = async (dirPath) => {
      const index = {};
      const files = await this.fs.promises.readdir(dirPath);

      for (const file of files) {
        const fullPath = this.path.join(dirPath, file);
        const stat = await this.fs.promises.stat(fullPath);

        if (stat.isFile() && isSupportedFile(file)) {
          const fileFormat = this.path.extname(file).slice(1) || "unknown";
          const fileSize = stat.size;
          const fileBuffer = await this.fs.promises.readFile(fullPath);
          const checksum = calculateChecksum(fileBuffer);

          index[file] = {
            name: file,
            file: fullPath,
            type: "file",
            format: fileFormat,
            size: fileSize,
            checksum,
          };
        } else if (stat.isDirectory()) {
          index[file] = { type: "directory", name: file, dir: fullPath };
        }
      }

      const indexPath = this.path.join(dirPath, "index.json");
      await this.fs.promises.writeFile(
        indexPath,
        JSON.stringify({ content: index }, null, 2)
      );
      console.log(`Index saved for directory: ${dirPath}`);
      return index; // Return the generated index
    };

    let globalIndex = [];
    const processDirectoryRecursively = async (rootDir) => {
      if (rootDir.includes("_search")) {
        return;
      }
      const files = await this.fs.promises.readdir(rootDir);

      for (const file of files) {
        const fullPath = this.path.join(rootDir, file);
        const stat = await this.fs.promises.stat(fullPath);

        if (stat.isDirectory()) {
          const subDirIndex = await generateIndex(fullPath);
          globalIndex.push(...Object.values(subDirIndex));
          await processDirectoryRecursively(fullPath);
        }
      }
    };

    await generateIndex(dir);

    const calculateTopLevelChecksum = async (dirPath) => {
      const files = await this.fs.promises.readdir(dirPath, {
        recursive: true,
      });
      const contentNames = files.sort().join(",");
      return calculateChecksum(contentNames);
    };
    const topLevelChecksumPath = this.path.join(dir, "top_level_checksum.txt");
    let previousChecksum = null;
    try {
      previousChecksum = await this.fs.promises.readFile(
        topLevelChecksumPath,
        "utf8"
      );
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
    console.log(previousChecksum);
    const currentChecksum = await calculateTopLevelChecksum(dir);

    if (currentChecksum === previousChecksum) {
      console.log("No changes detected. Skipping reindexing.");
      return;
    }

    console.log("Changes detected. Reindexing...");
    await this.fs.promises.writeFile(topLevelChecksumPath, currentChecksum);

    await processDirectoryRecursively(dir);

    globalIndex = globalIndex.filter((i) => {
      return i.type === "file";
    });

    // Paginate the global index
    const pageSize = 10;
    const pages = Math.ceil(globalIndex.length / pageSize);
    // check if seach directory exists
    const searchDir = this.path.join(dir, "_search");
    if (!this.fs.existsSync(searchDir)) {
      await this.fs.promises.mkdir(searchDir);
    }
    for (let i = 0; i < pages; i++) {
      const paginatedIndex = globalIndex.slice(
        i * pageSize,
        (i + 1) * pageSize
      );
      const paginatedIndexPath = this.path.join(searchDir, `${i + 1}.json`);
      await this.fs.promises.writeFile(
        paginatedIndexPath,
        JSON.stringify(
          { content: paginatedIndex, next: i < pages - 1, total: pages },
          null,
          2
        )
      );
      console.log(`Paginated index saved for page ${i + 1}`);
    }

    console.log("Global index pagination complete.");
  }

  deleteSearchFolderAndIndexes = async (dir) => {
    const searchDir = this.path.join(dir, "_search");

    // Delete all index.json files recursively in the directory
    const deleteIndexFiles = async (dirPath) => {
      const files = await this.fs.promises.readdir(dirPath);

      for (const file of files) {
        const fullPath = this.path.join(dirPath, file);
        const stat = await this.fs.promises.stat(fullPath);

        // If it's a file named index.json, delete it
        if (stat.isFile() && file === "index.json") {
          await this.fs.promises.unlink(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        }
        // If it's a directory, recursively delete index.json inside it
        else if (stat.isDirectory()) {
          await deleteIndexFiles(fullPath);
        }
      }
    };

    // Delete the _search directory and all files within it
    const deleteSearchDirectory = async (dirPath) => {
      const files = await this.fs.promises.readdir(dirPath);

      for (const file of files) {
        const fullPath = this.path.join(dirPath, file);
        const stat = await this.fs.promises.stat(fullPath);

        // If it's a file, delete it
        if (stat.isFile()) {
          await this.fs.promises.unlink(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        }
        // If it's a directory, recursively delete its contents
        else if (stat.isDirectory()) {
          await deleteSearchDirectory(fullPath);
        }
      }

      // Finally, remove the _search directory itself
      await this.fs.promises.rmdir(dirPath);
      console.log(`Deleted _search directory: ${dirPath}`);
    };

    // First, delete all index.json files in the entire directory
    await deleteIndexFiles(dir);

    // Then, delete the _search directory
    if (this.fs.existsSync(searchDir)) {
      await deleteSearchDirectory(searchDir);
    } else {
      console.log("No _search directory found to delete.");
    }
  };
};
