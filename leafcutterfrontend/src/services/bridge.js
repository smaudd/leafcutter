import { get } from "http";

export const _ = {
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
    getIndex: async (dir) => {
      try {
        const result = await window.electron.getIndex(dir);
        return result; // Process the response as needed
      } catch (error) {
        console.error("Error getting folder content:", error);
        throw error;
      }
    },
    getFile: async (file) => {
      try {
        const result = await window.electron.getFile(file);
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

export const bridge = {
  // Versions API
  getVersions: () => ({
    node: "unknown", // Replace with actual API if available
    chrome: "unknown",
    electron: "unknown",
  }),

  // UI API (No fetch equivalent, leaving as placeholders)
  ui: {
    startDrag: (file, mode) => {
      console.warn("startDrag is not supported in fetchBridge");
    },
    endDrag: (file) => {
      console.warn("endDrag is not supported in fetchBridge");
    },
  },

  user: {
    getDirectory: async (dir) => {
      try {
        const response = await fetch(
          `/api/user/directory?dir=${encodeURIComponent(dir)}`
        );
        if (!response.ok) throw new Error("Failed to fetch directory");
        return await response.json();
      } catch (error) {
        console.error("Error getting user directory:", error);
        throw error;
      }
    },
    removeDirectory: async (dir) => {
      try {
        const response = await fetch(
          `/api/user/directory?dir=${encodeURIComponent(dir)}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) throw new Error("Failed to delete directory");
        return await response.json();
      } catch (error) {
        console.error("Error removing directory:", error);
        throw error;
      }
    },
    getLibraryConfig: async () => {
      try {
        const response = await fetch(`/api/user/library-config`);
        if (!response.ok) throw new Error("Failed to fetch library config");
        return await response.json();
      } catch (error) {
        console.error("Error getting library config:", error);
        throw error;
      }
    },
  },

  data: {
    getIndex: async (dir) => {
      try {
        const response = await fetch(dir);
        if (!response.ok) throw new Error("Failed to fetch index");
        return await response.json();
      } catch (error) {
        console.error("Error getting folder content:", error);
        throw error;
      }
    },
    getFile: async (file) => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/smaudd/demos/refs/heads/master" +
            "/" +
            file
        );
        if (!response.ok) throw new Error("Failed to fetch file");
        console.log("Downloaded file from:", file);
        return response.arrayBuffer(); // Assuming a file download
      } catch (error) {
        console.error("Error getting file:", error);
        throw error;
      }
    },
    getDirectoryState: async () => {
      try {
        const response = await fetch(`/api/data/directory-state`);
        if (!response.ok) throw new Error("Failed to fetch directory state");
        return await response.json();
      } catch (error) {
        console.error("Error getting directory state:", error);
        throw error;
      }
    },
    searchIndex: async (pathname, page) => {
      try {
        const response = await fetch(pathname + `/_search/${page}.json`);
        if (!response.ok) throw new Error("Failed to search index");
        return await response.json();
      } catch (error) {
        console.error("Error searching index:", error);
        throw error;
      }
    },
  },
};
