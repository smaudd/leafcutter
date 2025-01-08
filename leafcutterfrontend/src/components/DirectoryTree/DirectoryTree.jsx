import React, { useState, useCallback, useMemo, useRef } from "react";
import styles from "./DirectoryTree.module.css";
import Player from "../Player/Player";

const DirectoryTree = React.memo(
  ({ initialTree, fetchDirectory, parent = "" }) => {
    const keys = Object.keys(initialTree?.content || {});
    const [limit, setLimit] = useState(10);
    return (
      <ul className={styles["directory-tree"]}>
        {keys.slice(0, limit).map((key) => {
          const node = initialTree.content[key];
          if (!node) return null;
          const path = `${parent}/${key}`;
          if (node.type === "directory") {
            return (
              <Directory
                key={key}
                path={path}
                name={key}
                fetchDirectory={fetchDirectory}
              ></Directory>
            );
          }

          if (node.type === "file") {
            return (
              <Player key={key} path={path}>
                {key}
              </Player>
            );
          }
        })}
        {keys.length > limit && (
          <button onClick={() => setLimit((prev) => prev + 10)}>
            Show More
          </button>
        )}
      </ul>
    );
  }
);

const Directory = ({ name, path, fetchDirectory }) => {
  const [directoryIndex, setDirectoryIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const memoized = useMemo(() => {
    console.log("rerun...");
    return (
      <DirectoryTree
        initialTree={directoryIndex}
        fetchDirectory={fetchDirectory}
        parent={path}
      />
    );
  }, [directoryIndex]);
  return (
    <li className={styles["directory"]} ref={ref}>
      <div
        className={styles["directory-name"]}
        onClick={async () => {
          const index = await fetchDirectory(`${path.trim()}/index.json`, {
            root: false,
          });
          if (!directoryIndex) {
            setDirectoryIndex(index);
          }
          setExpanded((prev) => !prev);
        }} // Use the passed toggle function
      >
        {name}
      </div>
      <div
        className={styles["content"]}
      >
        {expanded && memoized}
      </div>
    </li>
  );
};

export default DirectoryTree;
