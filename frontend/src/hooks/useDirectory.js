import { useState } from "react";
import { bridge } from "../services/bridge";

export default function useDirectory() {
  const [trees, setTrees] = useState([]);
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

  const removeDirectory = (dir) => {
    // Remove dir from localstorage
    const filtered = trees
      .filter((tree) => tree.directory !== dir)
      .map((tree) => tree.directory);
    localStorage.setItem("repositories", JSON.stringify(filtered));
    console.log(filtered, dir);
    setTrees(filtered);
  };
  return { trees, setTrees, loading, fetchDirectory, removeDirectory };
}
