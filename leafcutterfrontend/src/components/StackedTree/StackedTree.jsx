import React, { useState, useMemo, useRef } from "react";
import styles from "./StackedTree.module.css";
import Player from "../Player/Player";

const StackedTree = ({ initialTree, fetchDirectory, setTree, root }) => {
  let keys = Object.keys(initialTree?.content || {});

  // sort keys by highlight if exists
  if (initialTree?.highlight) {
    keys = keys.sort((a, b) => {
      const name = initialTree?.highlight?.split("/")?.at(-1);
      if (name === a) return -1;
      if (name === b) return 1;
      return 0;
    });
  }

  const [limit, setLimit] = useState(10);
  const [opacity, setOpacity] = useState(1); // Track animation direction
  const listRef = useRef(null);

  // Track the root directory for consistent path slicing
  const rootDirectory = useRef(initialTree.directory);

  // Build breadcrumb segments with full paths
  const segments = useMemo(() => {
    const fullPath = initialTree?.directory?.split("/") || [];
    const indexOfRoot = fullPath.indexOf(
      rootDirectory.current?.split("/")?.at(-1) || []
    );
    const validSegments = fullPath.slice(indexOfRoot);
    return validSegments.map((segment, index) => {
      return {
        title: segment,
        path:
          index === 0
            ? rootDirectory.current
            : `${rootDirectory.current}/${validSegments
                .slice(1, index + 1) // Take all segments up to and including the current one
                .join("/")}`,
      };
    });
  }, [initialTree.directory]);

  if (!initialTree.directory) {
    return null;
  }

  const handleBreadcrumbClick = async (segment, idx) => {
    const index = await fetchDirectory(`${segment.path}/index.json`);
    setOpacity(0);

    listRef.current.ontransitionend = () => {
      setTree(initialTree, {
        ...index,
        directory: segment.path,
        root: false,
      });
      setOpacity(1);
    };
  };

  const handleDirectoryClick = async (key) => {
    setOpacity(0);
    const path = root ? key : `${initialTree.directory}/${key}`;
    const index = await fetchDirectory(`${path}/index.json`);
    listRef.current.ontransitionend = () => {
      setTree(initialTree, {
        ...index,
        directory: path,
        root: false,
      });
      setOpacity(1);
    };
  };

  const handleClose = async () => {
    setOpacity(0);
    const root = initialTree.directory === rootDirectory.current;
    const path = root
      ? rootDirectory.current
      : initialTree.directory.split("/").slice(0, -1).join("/");
    const index = await fetchDirectory(`${path}/index.json`);

    listRef.current.ontransitionend = async () => {
      // close should go back to the previous directory
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
        directory: root ? initialTree.directory : path,
        root,
      });
      setOpacity(1);
    };
  };

  // Function to assign random colors
  const getRandomColor = (idx) => color.palette[idx % color.palette.length];

  return (
    <div class={styles["stacked-tree"]}>
      {!root && (
        <nav className={styles["breadcrumb-container"]}>
          <button onClick={handleClose} className={styles["breadcrumb-close"]}>
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
            <>
              <span key={segment.path} className={styles.breadcrumb}>
                <button
                  onClick={() => handleBreadcrumbClick(segment, idx)}
                  className={styles["breadcrumb"]}
                  style={{
                    color: getRandomColor(idx),
                  }}
                >
                  {segment.title}
                </button>
              </span>
              {idx < segments.length - 1 && <span>/</span>}
            </>
          ))}
        </nav>
      )}
      {/* Apply animation classes */}
      <div class={styles["directory-tree-container"]}>
        <ul
          className={`${styles["directory-tree"]} ${
            styles[`opacity-${opacity}`]
          }`}
          ref={listRef}
        >
          {keys.slice(0, limit).map((key) => {
            const node = initialTree.content[key];
            if (!node) return null;

            if (node.type === "directory") {
              return (
                <li
                  key={key}
                  className={styles["directory"]}
                  onClick={() => handleDirectoryClick(key)}
                  data-closed={root}
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
            <button onClick={() => setLimit((prev) => prev + 10)}>
              Show More
            </button>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StackedTree;
