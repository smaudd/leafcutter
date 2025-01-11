import { useState, useMemo, useRef, useCallback } from "react";

// Hook to manage breadcrumb navigation
export const useBreadcrumbs = (initialTree, rootDirectory) => {
  return useMemo(() => {
    const fullPath = initialTree?.directory?.split("/") || [];
    const indexOfRoot = fullPath.indexOf(
      rootDirectory.current?.split("/")?.at(-1) || []
    );
    const validSegments = fullPath.slice(indexOfRoot);
    return validSegments.map((segment, index) => ({
      title: segment,
      path:
        index === 0
          ? rootDirectory.current
          : `${rootDirectory.current}/${validSegments
              .slice(1, index + 1)
              .join("/")}`,
    }));
  }, [initialTree.directory, rootDirectory]);
};

// Hook to manage the current directory's state
export const useDirectoryState = (initialTree, fetchDirectory, setTree) => {
  const rootDirectory = useRef(initialTree.directory);
  const [limit, setLimit] = useState(10);
  const [opacity, setOpacity] = useState(1);

  const handleDirectoryClick = useCallback(
    async (key, root) => {
      const path = root ? key : `${initialTree.directory}/${key}`;
      const index = await fetchDirectory(`${path}/index.json`);
      setTree(initialTree, {
        ...index,
        directory: path,
        root: false,
      });
    },
    [initialTree, fetchDirectory, setTree]
  );

  const handleClose = useCallback(async () => {
    const root = initialTree.directory === rootDirectory.current;
    const path = root
      ? rootDirectory.current
      : initialTree.directory.split("/").slice(0, -1).join("/");
    const index = await fetchDirectory(`${path}/index.json`);

    if (root) {
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
      root,
    });
  }, [initialTree, fetchDirectory, setTree]);

  return {
    limit,
    setLimit,
    opacity,
    setOpacity,
    handleDirectoryClick,
    handleClose,
    rootDirectory,
  };
};
