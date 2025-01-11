import { useState, useRef, useCallback } from "react";

// Hook to manage the current directory's state
const useDirectoryState = (initialTree, fetchDirectory, setTree) => {
  const rootDirectory = useRef(initialTree.directory);
  const [limit, setLimit] = useState(10);
  const [opacity, setOpacity] = useState(1);

  const handleDirectoryClick = useCallback(
    async (key, root) => {
      let path = key;

      if (!root) {
        path = `${initialTree.directory}/${key}`;
      }

      const index = await fetchDirectory(`${path}/index.json`);
      setTree(initialTree, {
        ...index,
        directory: path,
        root: false,
      });
    },
    [initialTree, fetchDirectory, setTree]
  );

  const handlePop = useCallback(async () => {
    let path = "";
    const isRootDirectory = initialTree.directory === rootDirectory.current;

    if (isRootDirectory) {
      path = rootDirectory.current; // Stay at the root directory
    } else {
      path = initialTree.directory.split("/").slice(0, -1).join("/"); // Go up one level
    }

    const index = await fetchDirectory(`${path}/index.json`);

    if (isRootDirectory) {
      setTree(initialTree, {
        content: {
          [rootDirectory.current]: {
            type: "directory",
          },
        },
        directory: rootDirectory.current,
        root: true,
      });
      setOpacity(1);
      return;
    }

    setTree(initialTree, {
      content: index.content,
      directory: path,
      root: false,
    });
  }, [initialTree, fetchDirectory, setTree]);

  return {
    limit,
    setLimit,
    opacity,
    setOpacity,
    handleDirectoryClick,
    handlePop,
    rootDirectory,
  };
};

export default useDirectoryState;
