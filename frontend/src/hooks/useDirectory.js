import { useEffect, useState } from "react";
import { bridge } from "../services/bridge";

export default function useDirectory(urls) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const fetchedTrees = await Promise.all(
        urls.map((base) => fetchDirectory(`${base}/index.json`, { root: true }))
      );
      const formattedTrees = fetchedTrees.map((tree, index) => ({
        content: {
          [urls[index]]: {
            ...tree.content,
            type: "directory",
            root: true,
            directory: urls[index],
          },
        },
        root: true,
        directory: urls[index],
        rootDir: urls[index],
      }));

      setTrees(formattedTrees);
    })();
  }, []);

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
