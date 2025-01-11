import React, { useMemo } from "react";
import styles from "./StackedTree.module.css";
import Player from "../Player/Player";
import color from "../../services/color";
import Button from "../Button/Button";
import useDirectoryState from "./hooks/useDirectoryState";
import useBreadcrumbs from "./hooks/useBreadcrumbs";

const StackedTree = ({
  initialTree,
  fetchDirectory,
  setTree,
  root,
  loading,
}) => {
  const {
    limit,
    setLimit,
    opacity,
    handleDirectoryClick,
    handlePop,
    rootDirectory,
  } = useDirectoryState(initialTree, fetchDirectory, setTree);

  const segments = useBreadcrumbs(initialTree, rootDirectory);

  const keys = useMemo(() => {
    let sortedKeys = Object.keys(initialTree?.content || {});
    if (initialTree?.highlight) {
      sortedKeys = sortedKeys.sort((a, b) => {
        const name = initialTree?.highlight?.split("/")?.at(-1);
        if (name === a) return -1;
        if (name === b) return 1;
        return 0;
      });
    }
    return sortedKeys;
  }, [initialTree]);

  if (!initialTree.directory) return null;

  return (
    <div className={styles["stacked-tree"]}>
      {!root && (
        <nav className={styles["breadcrumb-container"]}>
          <button
            onClick={handlePop}
            className={styles["breadcrumb-close"]}
            data-testid="breadcrumb-pop"
          >
            <svg
              width="1.5rem"
              height="1.5rem"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 11.25a.75.75 0 0 1 0 1.5h-9.25V18a.75.75 0 0 1-1.28.53l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.28.53v5.25H20Z"
                fill="#1C274C"
              />
            </svg>
          </button>
          {segments.map((segment, idx) => (
            <React.Fragment key={segment.path}>
              <span className={styles.breadcrumb}>
                <button
                  onClick={() => handleDirectoryClick(segment.path, idx)}
                  className={styles["breadcrumb"]}
                  style={{
                    color: color.getRandomColor(idx),
                  }}
                >
                  {segment.title}
                </button>
              </span>
              {idx < segments.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </nav>
      )}
      {loading && <div>Loading...</div>}
      <div className={styles["directory-tree-container"]}>
        <ul
          className={`${styles["directory-tree"]} ${
            styles[`opacity-${opacity}`]
          }`}
        >
          {keys.slice(0, limit).map((key) => {
            const node = initialTree.content[key];
            if (!node) return null;

            if (node.type === "directory") {
              return (
                <li
                  key={key}
                  className={styles["directory"]}
                  onClick={() => handleDirectoryClick(key, root)}
                >
                  {root ? key.split("/").at(-1) : key}
                </li>
              );
            }

            if (node.type === "file") {
              return (
                <li className={`${styles["file"]}`} key={key}>
                  <Player
                    key={key}
                    path={node.file}
                    id={key}
                    highlight={initialTree.highlight === node.file}
                  >
                    {key}
                  </Player>
                </li>
              );
            }

            return null;
          })}
          {keys.length > limit && (
            <Button onClick={() => setLimit((prev) => prev + limit)}>
              Show More
            </Button>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StackedTree;
