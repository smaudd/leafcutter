export const bridge = {
  // Versions API
  getVersions: () => ({
    node: window.versions.node(),
    chrome: window.versions.chrome(),
    electron: window.versions.electron(),
  }),

  // Electron API
  ui: {
    startDrag: (fileName) => window.electron.startDrag(fileName),
    endDrag: (fileName) => window.electron.endDrag(fileName),
  },

  data: {
    getIndex: async (folderPath) => {
      try {
        const result = await window.electron.getIndex(folderPath);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error getting folder content:", error);
        throw error;
      }
    },
    getFile: async (filePath) => {
      try {
        const result = await window.electron.getFile(filePath);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error getting file:", error);
        throw error;
      }
    },
    getDirectoryState: async () => {
      try {
        const result = await window.electron.getDirectoryState();
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error getting directory state:", error);
        throw error;
      }
    },
    sync: async (dirStructure) => {
      console.log("[bridge] sync", dirStructure);
      try {
        const result = await window.electron.syncDir(dirStructure);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error syncing directory:", error);
        throw error;
      }
    },
    clear: async () => {
      try {
        const result = await window.electron.clearDir();
        console.log("[bridge] clear", result);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error clearing directory:", error);
        throw error;
      }
    },
  },

  //   // Asset Management
  //   downloadAsset: async (url) => {
  //     try {
  //       const result = await window.electron.downloadAsset(url);
  //       return result; // Process the response as needed
  //     } catch (error) {
  //       console.error("Error downloading asset:", error);
  //       throw error;
  //     }
  //   },

  //   saveFile: async (fileBuffer, fileName) => {
  //     try {
  //       const result = await window.electron.saveFile(fileBuffer, fileName);
  //       return result; // Process the response as needed
  //     } catch (error) {
  //       console.error("Error saving file:", error);
  //       throw error;
  //     }
  //   },

  //   // Event Listeners
  //   onEvent: (channel, callback) => window.electron.on(channel, callback),
  //   offEvent: (channel, callback) => window.electron.off(channel, callback),
};
