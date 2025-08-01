import React, { useEffect, useState } from "react";
import useDirectory from "../hooks/useDirectory";
import { AudioProvider } from "../context/AudioProvider";
import StackedTree from "./StackedTree/StackedTree";
import SearchBar from "./SearchBar/SearchBar";
import IndexManager from "./IndexManager/IndexManager";
import styles from "./App.module.css";

const App = () => {
  const [urls, setUrls] = useState([
    "https://raw.githubusercontent.com/smaudd/demos/refs/heads/master/samples",
    "https://raw.githubusercontent.com/smaudd/909/refs/heads/master",
  ]);
  const { trees, setTrees, loading, fetchDirectory, removeDirectory } =
    useDirectory(urls);
  return (
    <AudioProvider>
      <IndexManager urls={urls} onUrlsChange={setUrls} />
      <div className={styles["trees-container"]}>
        {trees.map((tree) => (
          <div key={tree.directory} className={styles["tree-container"]}>
            <StackedTree
              tree={tree}
              setTree={(prev, next) => {
                // update only the tree that was changed
                const index = trees.findIndex(
                  (item) => item.directory === prev.directory
                );
                const nextTrees = [...trees];
                nextTrees[index] = { ...next, rootDir: prev.rootDir };
                setTrees(nextTrees);
              }}
              loading={loading}
              parent={tree.parent}
              root={tree?.root}
              rootDir={tree.repoLabel || tree.rootDir} // Use clean repo label
              fetchDirectory={fetchDirectory}
            />
            <button
              onClick={() => removeDirectory(tree.directory)}
              data-testid="clear"
              className="button"
              // className={styles["delete-button"]}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      {/* <SearchBar
        basePaths={trees.map((tree) => tree.directory)}
        onClickElement={async (element) => {
          const path = element.file.split("/").slice(0, -1).join("/");
          // Fetch repository indexes
          const index = await fetchDirectory(
            `https://raw.githubusercontent.com/smaudd/demos/refs/heads/master/samples/${encodeURIComponent(
              path
            )}/index.json`
          );
          setCloudTree({
            ...index,
            directory: `https://raw.githubusercontent.com/smaudd/demos/refs/heads/master/samples${path}`,
            root: cloudTree.directory === path,
            highlight: element.file,
          });
          console.log("Element clicked", element, path);
        }}
      /> */}
      {/* <h2>Local</h2>
      {userTree &&
        userTree.length > 0 &&
        userTree.map((tree) => (
          <>
            <SearchBar
              basePath={tree.directory}
              onClickElement={async (element) => {
                const path = element.file.split("/").slice(0, -1).join("/");
                const index = await fetchUserDirectory(`${path}/index.json`);
                setUserTree((prev) => {
                  return prev.map((item) => {
                    if (item.directory === tree.directory) {
                      return {
                        ...item,
                        ...index,
                        directory: path,
                        root: tree.directory === path,
                        highlight: element.file,
                      };
                    }
                    return item;
                  });
                });
                console.log("Element clicked", element, path);
              }}
            />
            {
              <Button
                onClick={() => {
                  removeDirectory(tree.directory);
                  console.log("Removing directory", tree.directory, userTree);
                  setUserTree((prev) => {
                    return prev.filter(
                      (item) => item.directory !== tree.directory
                    );
                  });
                }}
              >
                Delete directory
              </Button>
            }

            <StackedTree
              tree={tree}
              setTree={(prev, next) => {
                // update only the tree that was changed
                setUserTree((prevTree) => {
                  return prevTree.map((item) => {
                    if (item.directory === prev.directory) {
                      return next;
                    }
                    return item;
                  });
                });
              }}
              // parent={tree.parent}
              root={tree.root}
              fetchDirectory={fetchUserDirectory}
            />
          </>
        ))} */}
    </AudioProvider>
  );
};

export default App;
