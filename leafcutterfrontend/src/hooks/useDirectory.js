import { useEffect, useState } from "react";
import { bridge } from "../services/bridge";

export default function useDirectory() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchDirectoryState = async () => {
    setLoading(true);
    try {
      const data = await bridge.data.getDirectoryState();
      // if data is empty, ask for the root directory
      if (Object.keys(data).length === 0) {
        console.log("No directory state found, fetching root directory");
        await fetchDirectory("samples/index.json", { root: true });
        return;
      }
      setTree(data);
    } catch (error) {
      console.error("Error fetching directory:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchDirectory = async (path, { root, status = "expanded" }) => {
    // setLoading(true);
    try {
      const index = await bridge.data.getIndex(path);
      if (index.error) {
        throw new Error(index.error);
      }
      return index;
    } catch (error) {
      alert(error);
      console.error("Error fetching directory:", error);
    } finally {
      //   setLoading(false);
    }
  };
  return { tree, setTree, loading, fetchDirectory, fetchDirectoryState };
}
