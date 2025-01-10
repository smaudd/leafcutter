import { get } from "http";

export const bridge = {
  // Versions API
  getVersions: () => ({
    node: window.versions.node(),
    chrome: window.versions.chrome(),
    electron: window.versions.electron(),
  }),

  // Electron API
  ui: {
    startDrag: (file, mode) => window.electron.startDrag(file, mode),
    endDrag: (file) => window.electron.endDrag(file),
  },

  user: {
    getDirectory: (dir) => window.electron.getUserDirectory(dir),
    removeDirectory: (dir) => window.electron.deleteUserDirectory(dir),
    getLibraryConfig: () => window.electron.getUserLibraryConfig(),
  },

  data: {
    getIndex: async (dir, mode = "cloud") => {
      try {
        const result = await window.electron.getIndex(dir, mode);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error getting folder content:", error);
        throw error;
      }
    },
    getFile: async (file, mode = "cloud") => {
      try {
        const result = await window.electron.getFile(file, mode);
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
    searchIndex: async (pathname, page) => {
      try {
        const result = await window.electron.searchIndex(pathname, page);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error searching index:", error);
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
