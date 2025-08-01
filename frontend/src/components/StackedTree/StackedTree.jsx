import React, { useEffect, useMemo, useState } from "react";
import styles from "./StackedTree.module.css";
import Player from "../Player/Player";
import color from "../../services/color";
import Button from "../Button/Button";
import useDirectoryState from "./hooks/useDirectoryState";
import useBreadcrumbs from "./hooks/useBreadcrumbs";
import Loader from "../Loader/Loader";

const StackedTree = ({
  tree,
  fetchDirectory,
  setTree,
  root,
  loading,
  rootDir,
}) => {
  const {
    limit,
    setLimit,
    opacity,
    handleDirectoryClick,
    handlePop,
    handleClose,
  } = useDirectoryState({ tree, fetchDirectory, setTree, limit: 10, rootDir });
  const segments = useBreadcrumbs(tree, rootDir);
  const [expand, setExpand] = useState(true);

  useEffect(() => {
    if (root) {
      setExpand(true);
    }
  }, [root]);

  const keys = useMemo(() => {
    let sortedKeys = Object.keys(tree?.content || {});
    if (tree?.highlight) {
      sortedKeys = sortedKeys.sort((a, b) => {
        const name = tree?.highlight?.split("/")?.at(-1);
        if (name === a) return -1;
        if (name === b) return 1;
        return 0;
      });
    }
    return sortedKeys;
  }, [tree]);

  function handleExpand() {
    setExpand((prev) => !prev);
  }

  if (!tree.directory) return null;

  return (
    <div className={styles["stacked-tree"]}>
      {!root && (
        <>
          {rootDir && (
            <button className={styles["tree-title"]} onClick={handleClose}>
              {rootDir}
            </button>
          )}
          <nav className={styles["breadcrumb-container"]}>
            <div>
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
                      disabled={idx === segments.length - 1}
                      onClick={() => handleDirectoryClick(segment.path)}
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
            </div>
            <Button onClick={handleExpand}>
              {
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  data-expand={expand}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm3.53-12.03a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L12 12.44l2.47-2.47a.75.75 0 0 1 1.06 0Z"
                    fill="#1C274C"
                  />
                </svg>
              }
            </Button>
          </nav>
        </>
      )}
      {loading && <Loader />}
      <div className={styles["directory-tree-container"]}>
        {expand && (
          <ul
            className={`${styles["directory-tree"]} ${
              styles[`opacity-${opacity}`]
            }`}
          >
            {keys.slice(0, limit).map((key) => {
              const node = tree.content[key];
              if (!node) return null;

              if (node.type === "directory") {
                return (
                  <li
                    data-testid="dirnode"
                    key={key}
                    className={styles["directory"]}
                  >
                    <button
                      onClick={() =>
                        handleDirectoryClick(
                          root ? key : `${tree.directory}/${key}`
                        )
                      }
                    >
                      {key}
                    </button>
                  </li>
                );
              }

              if (node.type === "file") {
                return (
                  <li key={key} data-testid="dirnode">
                    <Player
                      key={key}
                      path={`${tree.directory}/${node.name}`}
                      id={key}
                    >
                      {key}
                    </Player>
                  </li>
                );
              }

              return null;
            })}
            {keys.length > limit && (
              <Button
                onClick={() => setLimit((prev) => prev + limit)}
                testid="show-more"
              >
                +
              </Button>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StackedTree;
