import { useState } from "react";
import { bridge } from "../services/bridge";

export default function useDirectory() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDirectory = async (pathname) => {
    setLoading(true);
    try {
      const index = await bridge.data.getIndex(pathname);
      if (index.error) {
        throw new Error(index.error);
      }
      return index;
    } catch (error) {
      alert(error);
      console.error("Error fetching directory:", error);
    } finally {
      setLoading(false);
    }
  };
  const removeDirectory = async (dir) => {
    try {
      await bridge.user.removeDirectory(dir);
      // fetchDirectoryState();
    } catch (error) {
      console.error("Error deleting directory:", error);
    }
  };
  return { tree, setTree, loading, fetchDirectory, removeDirectory };
}
