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

    // read the directory recursively and return the structure
    try {
      this.generateIndexDirectory(path);
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

  generateIndexDirectory(dir) {
    // Supported file formats (extensions) for audio and image files
    const supportedFormats = ["mp3", "wav", "flac", "ogg", "tiff", "midi"];

    const excludedFiles = [".DS_Store"];

    // Function to calculate the MD5 checksum of a file
    const calculateChecksum = (filePath) => {
      const hash = this.crypto.createHash("md5");
      const fileBuffer = this.fs.readFileSync(filePath);
      hash.update(fileBuffer);
      return hash.digest("hex");
    };

    // Function to check if the file is an audio or image file
    const isSupportedFile = (file) => {
      const ext = this.path.extname(file).slice(1).toLowerCase();
      return supportedFormats.includes(ext) && !excludedFiles.includes(file);
    };

    // Function to process a single directory and generate its index
    const generateDirectoryIndex = (dirPath) => {
      const index = {};

      // Read the contents of the directory
      const files = this.fs.readdirSync(dirPath);

      files.forEach((file) => {
        const fullPath = this.path.join(dirPath, file);
        const stat = this.fs.statSync(fullPath);

        // If it's a file and it's an audio or image file, add details to the index
        if (stat.isFile() && isSupportedFile(file)) {
          const fileFormat = this.path.extname(file).slice(1) || "unknown";
          const fileSize = stat.size;
          const checksum = calculateChecksum(fullPath);

          index[file] = {
            type: "file",
            format: fileFormat,
            size: fileSize,
            checksum: checksum,
          };
        }
        // If it's a directory, mark it as a directory in the index
        else if (stat.isDirectory()) {
          index[file] = {
            type: "directory",
          };
        }
      });

      // Save the index for this directory in a JSON file named 'index.json'
      const indexPath = this.path.join(dirPath, "index.json");
      this.fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
      console.log(`Index saved for directory: ${dirPath}`);
    };

    // Function to recursively process subdirectories
    const processDirectoryRecursively = (rootDir) => {
      const files = this.fs.readdirSync(rootDir);

      files.forEach((file) => {
        const fullPath = this.path.join(rootDir, file);
        const stat = this.fs.statSync(fullPath);

        // If it's a directory, generate an index for it
        if (stat.isDirectory()) {
          generateDirectoryIndex(fullPath); // Generate index for the directory
          processDirectoryRecursively(fullPath); // Recursively process subdirectories
        }
      });
    };

    // Main function to execute the script
    processDirectoryRecursively(dir);

    // Generate directory index for first level
    generateDirectoryIndex(dir);
  }
};
