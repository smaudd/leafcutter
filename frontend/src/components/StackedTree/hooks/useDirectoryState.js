import { useState, useRef, useCallback } from "react";

// Hook to manage the current directory's state
const useDirectoryState = ({
  tree,
  fetchDirectory,
  setTree,
  limit: _limit,
  rootDir,
}) => {
  const [limit, setLimit] = useState(_limit);
  const [opacity, setOpacity] = useState(1);

  const handleDirectoryClick = useCallback(
    async (key) => {
      let path = key;
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
    const isRootDirectory = tree.directory === rootDir;

    if (isRootDirectory) {
      path = rootDir; // Stay at the root directory
    } else {
      path = tree.directory.split("/").slice(0, -1).join("/"); // Go up one level
    }

    const index = await fetchDirectory(`${path}/index.json`);

    if (isRootDirectory) {
      setTree(tree, {
        content: {
          [rootDir]: {
            type: "directory",
          },
        },
        directory: rootDir,
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

  const handleClose = useCallback(() => {
    // set root directory
    setTree(tree, {
      content: {
        [rootDir]: {
          type: "directory",
        },
      },
      directory: rootDir,
      root: true,
    });
  }, []);

  return {
    limit,
    setLimit,
    opacity,
    setOpacity,
    handleDirectoryClick,
    handlePop,
    handleClose,
  };
};

export default useDirectoryState;
