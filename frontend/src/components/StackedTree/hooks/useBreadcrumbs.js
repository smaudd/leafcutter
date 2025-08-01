import { useMemo } from "react";

const useBreadcrumbs = (tree, rootDir) => {
  return useMemo(() => {
    // If directory is empty, return an empty array
    if (!tree?.directory) {
      return [];
    }

    const fullPath = tree?.directory.split("/") || [];
    const rootDirPath = rootDir?.split("/")?.at(-1) || [];

    // If the root directory path is not found, return an empty array
    const indexOfRoot = fullPath.indexOf(rootDirPath);
    if (indexOfRoot === -1) {
      return [];
    }

    const validSegments = fullPath.slice(indexOfRoot);

    return validSegments.map((segment, index) => {
      let path = rootDir;
      const pathSegments = validSegments.slice(1, index + 1);

      if (index !== 0) {
        path = `${rootDir}/${pathSegments.join("/")}`;
      }

      return {
        title: segment,
        path,
      };
    });
  }, [tree.directory, rootDir]);
};

export default useBreadcrumbs;
