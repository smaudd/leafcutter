import React, { useEffect } from "react";
import DirectoryTree from "./DirectoryTree/DirectoryTree";
import useDirectory from "../hooks/useDirectory";
import { bridge } from "../services/bridge";
import { AudioProvider } from "../context/AudioProvider";
import Button from "./Button/Button";
import StackedTree from "./StackedTree/StackedTree";

const App = () => {
  const {
    tree: cloudTree,
    setTree: setCloudTree,
    loading,
    fetchDirectory: fetchCloudDirectory,
    // fetchDirectoryState,
  } = useDirectory();

  // const {
  //   tree: userTree,
  //   setTree: setUserTree,
  //   // loading,
  //   fetchDirectory: fetchUserDirectory,
  //   removeDirectory,
  //   // fetchDirectoryState,
  // } = useDirectory();

  console.log(cloudTree);

  useEffect(() => {
    (async () => {
      const dirBase =
        "https://raw.githubusercontent.com/smaudd/demos/refs/heads/master";
      const index = await fetchCloudDirectory(`${dirBase}/index.json`, {
        root: true,
      });
      let preffixed = {
        [dirBase]: {
          content: index.content,
          directory: dirBase,
          type: "directory",
        },
      };
      setCloudTree({
        content: preffixed,
        root: true,
        directory: dirBase,
      });
      // const userLibraryConfig = await bridge.user.getLibraryConfig();
      // const directories = userLibraryConfig.directories.map((dir) =>
      //   bridge.user.getDirectory(dir)
      // );
      // const trees = await Promise.all(directories);
      // setUserTree(
      //   trees.map((tree, index) => {
      //     const dirName = userLibraryConfig.directories[index];
      //     return {
      //       content: {
      //         [dirName]: {
      //           ...tree,
      //           type: "directory",
      //         },
      //       },
      //       root: true,
      //       directory: dirName,
      //     };
      //   })
      // );
      // setUserTree(
      //   await fetchUserDirectory("samples/index.json", { root: true })
      // );
    })();
  }, []);

  async function handleClear() {
    // await bridge.data.clear();
    // fetchDirectoryState();
  }

  return (
    <AudioProvider>
      <Button
        onClick={async () => {
          const index = await bridge.user.getDirectory();
          console.log("Creating directory", index);
          setUserTree((prev) => [
            ...prev,
            {
              content: {
                [index.directory]: {
                  ...index,
                  type: "directory",
                },
              },
              root: true,
              directory: index.directory,
            },
          ]);
        }}
      >
        Get directory
      </Button>
      <div>
        {/* <DirectoryTree
          initialTree={cloudTree}
          fetchDirectory={fetchCloudDirectory}
          removeDirectory={removeDirectory}
          parent="https://couponsb.fra1.digitaloceanspaces.com/samples"
        /> */}
        {cloudTree && (
          <StackedTree
            initialTree={cloudTree}
            setTree={(prev, next) => {
              setCloudTree(next);
            }}
            loading={loading}
            // parent={tree.parent}
            root={cloudTree?.root}
            fetchDirectory={fetchCloudDirectory}
          />
        )}
      </div>
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
              initialTree={tree}
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
