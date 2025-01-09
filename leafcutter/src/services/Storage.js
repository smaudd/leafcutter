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
  }

  calculateHash(data) {
    return this.crypto.createHash("sha256").update(data).digest("hex");
  }

  async getFile(event, pathname = "") {
    try {
      const filePath = this.path.join(this.userDataPath, pathname);
      const hashPath = `${filePath}.hash`;

      if (this.fs.existsSync(filePath) && this.fs.existsSync(hashPath)) {
        const fileBuffer = await this.fs.promises.readFile(filePath);
        const storedHash = await this.fs.promises.readFile(hashPath, "utf-8");
        const currentHash = this.calculateHash(fileBuffer);
        console.log(storedHash, currentHash);
        if (storedHash !== currentHash) {
          console.log("File integrity problem!");
          const buffer = await this.downloadFile(
            { file: filePath, hash: hashPath },
            pathname
          );
          if (buffer) {
            return buffer;
          }
          throw new Error("File integrity check failed");
        }
        console.log("Got file from cache:", filePath);
        return fileBuffer.buffer; // Return ArrayBuffer
      }
      const buffer = await this.downloadFile(
        { file: filePath, hash: hashPath },
        pathname
      );

      return buffer; // Return ArrayBuffer
    } catch (error) {
      console.error("Error in get-file:", error);
      return { error: error.message }; // Ensure error propagates back to the renderer process
    }
  }

  async downloadFile({ file, hash }, pathname) {
    const response = await fetch(
      `https://couponsb.fra1.digitaloceanspaces.com/${pathname}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const data = await response.arrayBuffer();
    const dir = this.path.dirname(file);
    await this.fs.promises.mkdir(dir, { recursive: true });
    const buffer = Buffer.from(data);
    await this.fs.promises.writeFile(file, buffer);
    await this.fs.promises.writeFile(hash, this.calculateHash(buffer));
    return data;
  }

  async getIndex(event, pathname = "") {
    try {
      const localFilePath = this.path.join(this.userDataPath, pathname);
      const hashPath = `${localFilePath}.hash`;

      if (this.fs.existsSync(localFilePath) && this.fs.existsSync(hashPath)) {
        const fileBuffer = await this.fs.promises.readFile(localFilePath);
        const storedHash = await this.fs.promises.readFile(hashPath, "utf-8");
        const currentHash = this.calculateHash(fileBuffer);

        if (storedHash !== currentHash) {
          const data = await this.downloadIndex(
            { file: localFilePath, hash: hashPath },
            pathname
          );
          if (data) {
            return data;
          }
          throw new Error("Index integrity check failed");
        }
        return JSON.parse(fileBuffer.toString());
      }

      console.log("Index and hash saved to disk:", localFilePath, hashPath);
      const data = await this.downloadIndex(
        { file: localFilePath, hash: hashPath },
        pathname
      );
      return data;
    } catch (error) {
      console.error("Error in get-index:", error);
      return { error: error.message }; // Ensure error propagates back to the renderer process
    }
  }

  async downloadIndex({ file, hash }, pathname) {
    const response = await fetch(
      `https://couponsb.fra1.digitaloceanspaces.com/${pathname}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const data = await response.json();
    const dir = this.path.dirname(file);
    await this.fs.promises.mkdir(dir, { recursive: true });
    const indexContent = { content: data };
    const indexString = JSON.stringify(indexContent);
    await this.fs.promises.writeFile(file, indexString);
    await this.fs.promises.writeFile(hash, this.calculateHash(indexString));
    return indexContent;
  }
};
