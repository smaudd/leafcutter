import { useMemo } from "react";

const useBreadcrumbs = (initialTree, rootDirectory) => {
  return useMemo(() => {
    // If directory is empty, return an empty array
    if (!initialTree?.directory) {
      return [];
    }

    const fullPath = initialTree?.directory.split("/") || [];
    const rootDirectoryPath = rootDirectory.current?.split("/")?.at(-1) || [];

    // If the root directory path is not found, return an empty array
    const indexOfRoot = fullPath.indexOf(rootDirectoryPath);
    if (indexOfRoot === -1) {
      return [];
    }

    const validSegments = fullPath.slice(indexOfRoot);

    return validSegments.map((segment, index) => {
      let path = rootDirectory.current;

      if (index !== 0) {
        const pathSegments = validSegments.slice(1, index + 1).join("/");
        path = `${rootDirectory.current}/${pathSegments}`;
      }

      return {
        title: segment,
        path,
      };
    });
  }, [initialTree.directory, rootDirectory]);
};

export default useBreadcrumbs;
