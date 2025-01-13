import { useState, useRef, useCallback } from "react";

// Hook to manage the current directory's state
const useDirectoryState = ({
  tree,
  fetchDirectory,
  setTree,
  limit: _limit,
}) => {
  const rootDirectory = useRef(tree.directory);
  const [limit, setLimit] = useState(_limit);
  const [opacity, setOpacity] = useState(1);

  const handleDirectoryClick = useCallback(
    async (key, root) => {
      let path = key;

      if (!root) {
        path = `${tree.directory}/${key}`;
      }

      const index = await fetchDirectory(`${path}/index.json`);
      setTree(tree, {
        ...index,
        directory: path,
        root: false,
      });
    },
    [tree, fetchDirectory, setTree]
  );

  const handlePop = useCallback(async () => {
    let path = "";
    const isRootDirectory = tree.directory === rootDirectory.current;

    if (isRootDirectory) {
      path = rootDirectory.current; // Stay at the root directory
    } else {
      path = tree.directory.split("/").slice(0, -1).join("/"); // Go up one level
    }

    const index = await fetchDirectory(`${path}/index.json`);

    if (isRootDirectory) {
      setTree(tree, {
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

    setTree(tree, {
      content: index.content,
      directory: path,
      root: false,
    });
  }, [tree, fetchDirectory, setTree]);

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
