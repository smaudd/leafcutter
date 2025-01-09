import React, { useEffect } from "react";
import DirectoryTree from "./DirectoryTree/DirectoryTree";
import useDirectory from "../hooks/useDirectory";
import { bridge } from "../services/bridge";
import { AudioProvider } from "../context/AudioProvider";
import Button from "./Button/Button";

const App = () => {
  const {
    tree: cloudTree,
    setTree: setCloudTree,
    loading,
    fetchDirectory: fetchCloudDirectory,
    // fetchDirectoryState,
  } = useDirectory("cloud");

  const {
    tree: userTree,
    setTree: setUserTree,
    // loading,
    fetchDirectory: fetchUserDirectory,
    removeDirectory,
    // fetchDirectoryState,
  } = useDirectory("local");

  useEffect(() => {
    (async () => {
      setCloudTree(
        await fetchCloudDirectory("samples/index.json", { root: true })
      );
      const userLibraryConfig = await bridge.user.getLibraryConfig();
      const directories = userLibraryConfig.directories.map((dir) =>
        bridge.user.getDirectory(dir)
      );
      const trees = await Promise.all(directories);
      setUserTree(
        trees.map((tree, index) => {
          const dirName = userLibraryConfig.directories[index];
          return {
            content: {
              [dirName]: {
                ...tree,
                type: "directory",
              },
            },
            directory: dirName,
          };
        })
      );
      // setTree(await fetchUserDirectory("samples/index.json", { root: true }));
    })();
  }, []);

  async function handleClear() {
    // await bridge.data.clear();
    // fetchDirectoryState();
  }

  // console.log("Initial tree", tree);
  console.log(userTree);
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
              directory: index.directory,
            },
          ]);
        }}
      >
        Get directory
      </Button>

      <DirectoryTree
        initialTree={cloudTree}
        fetchDirectory={fetchCloudDirectory}
        removeDirectory={removeDirectory}
        parent="samples"
        mode="cloud"
      />
      <h2>Local</h2>
      {userTree &&
        userTree.length > 0 &&
        userTree.map((tree) => (
          <>
            {/* <h4>
              {tree.directory} (
              {Object.keys(tree[tree.directory].content).length} items)
            </h4> */}
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
            <DirectoryTree
              initialTree={tree}
              fetchDirectory={fetchUserDirectory}
              parent=""
              mode="local"
            />
          </>
        ))}
    </AudioProvider>
  );
};

export default App;
