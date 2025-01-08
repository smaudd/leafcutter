import { useEffect, useState } from "react";
import { bridge } from "../services/bridge";

export default function useDirectory() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchDirectoryState = async () => {
    setLoading(true);
    try {
      const data = await bridge.data.getDirectoryState();
      console.log("DATA IS", data);
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
      const index = await bridge.data.getDirectoryIndex(path);
      //   setTree(index);
      return index;
      //   if (Object.keys(index).length === 0) {
      //     console.log("No directory found at path", path);
      //     return;
      //   }
      //   const newTree = { ...tree };
      //   let current = newTree;

      //   if (root) {
      //     const rootDef = { content: index };
      //     setTree(rootDef);
      //     await bridge.data.sync(rootDef);
      //     return;
      //   }

      //   const segments = path
      //     .replace("index.json", "")
      //     .split("/")
      //     .filter((segment) => segment)
      //     .slice(1);

      //   for (const segment of segments) {
      //     if (!current.content) {
      //       current.content = {}; // Ensure the content object exists
      //     }

      //     if (!current.content[segment]) {
      //       current.content[segment] = {
      //         type: "directory",
      //         content: {},
      //       };
      //     }

      //     current = current.content[segment];
      //     current.status = status;
      //   }

      //   current.content = index; // Inject the fetched index into the correct node
      //   console.log("Syn with new tree", newTree);
      //   await bridge.data.sync(newTree); // Sync the new directory structure with the backend
      //   setTree(newTree);
    } catch (error) {
      console.error("Error fetching directory:", error);
    } finally {
      //   setLoading(false);
    }
  };
  return { tree, setTree, loading, fetchDirectory, fetchDirectoryState };
}
