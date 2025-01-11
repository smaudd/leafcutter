module.exports = class Storage {
  constructor({ dependencies: { fs, path, crypto, electron } }) {
    console.log("[STORAGE] Starting...");
    this.fs = fs;
    this.path = path;
    this.crypto = crypto;
    this.userDataPath = electron.app.getPath("userData");
    this.ipcMain = electron.ipcMain;
    this.attachIpcHandlers();
  }

  attachIpcHandlers() {
    this.ipcMain.handle("get-file", this.getFile.bind(this));
    this.ipcMain.handle("get-index", this.getIndex.bind(this));
    this.ipcMain.handle(
      "get-search-index-page",
      this.getSearchIndexPage.bind(this)
    );
  }

  calculateHash(data) {
    return this.crypto.createHash("sha256").update(data).digest("hex");
  }

  isURL(pathname) {
    try {
      new URL(pathname); // Try to construct a URL
      return true;
    } catch {
      return false; // If an error occurs, it's not a valid URL
    }
  }

  async getIndex(_, pathname = "") {
    console.log("Getting index:", pathname);

    if (this.isURL(pathname)) {
      const index = await this.downloadIndex(pathname);
      console.log("Getting index from URL----------:", index);
      return index;
    }

    try {
      if (this.fs.existsSync(pathname)) {
        const fileBuffer = await this.fs.promises.readFile(pathname);
        return JSON.parse(fileBuffer.toString());
      }
    } catch (error) {
      console.error("Error in get-index:", error);
      return { error: error.message }; // Ensure error propagates back to the renderer process
    }
  }

  async getSearchIndexPage(_, pathname, page) {
    console.log("Getting search index page:", page);
    const searchIndexPath = this.path.join(pathname, "_search", `${page}.json`);
    const index = await this.fs.promises.readFile(searchIndexPath, "utf-8");
    return JSON.parse(index);
  }

  async getFile(_, pathname) {
    console.log("Getting file:", pathname);

    try {
      if (this.isURL(pathname)) {
        return this.downloadFile(pathname);
      }

      if (this.fs.existsSync(pathname)) {
        const fileBuffer = await this.fs.promises.readFile(pathname);
        return fileBuffer.buffer; // Return ArrayBuffer
      }
    } catch (error) {
      console.error("Error in get-file:", error);
      return { error: error.message }; // Ensure error propagates back to the renderer process
    }
  }

  getPathFromURL(urlString) {
    try {
      const url = new URL(urlString); // Parse the URL
      const pathname = url.pathname; // Get the path
      return pathname; // Return the path, including subdirectories
    } catch (error) {
      console.error("Invalid URL:", error.message);
      return null;
    }
  }

  async downloadIndex(pathname) {
    const response = await fetch(pathname);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const data = await response.json();
    // Create directory inherited from the URL path
    const dir = this.getPathFromURL(pathname);
    const indexPath = this.path.join(this.userDataPath, dir);
    const basePath = this.path.dirname(indexPath);

    if (!this.fs.existsSync(basePath)) {
      await this.fs.promises.mkdir(basePath, {
        recursive: true,
      });
    }

    const indexContent = data;
    const indexString = JSON.stringify(indexContent);
    await this.fs.promises.writeFile(this.path.join(indexPath), indexString);
    return indexContent;
  }

  async downloadFile(pathname) {
    const response = await fetch(pathname);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const data = await response.arrayBuffer();

    const dir = this.getPathFromURL(pathname);
    const filePath = this.path.join(this.userDataPath, dir);
    const basePath = this.path.dirname(filePath);
    if (!this.fs.existsSync(basePath)) {
      await this.fs.promises.mkdir(basePath, { recursive: true });
    }
    const buffer = Buffer.from(data);
    await this.fs.promises.writeFile(filePath, buffer);
    return data;
  }
};
