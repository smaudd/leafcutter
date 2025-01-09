import React, { useEffect } from "react";
import DirectoryTree from "./DirectoryTree/DirectoryTree";
import useDirectory from "../hooks/useDirectory";
import { bridge } from "../services/bridge";

const App = () => {
  const { tree, setTree, loading, fetchDirectory, fetchDirectoryState } =
    useDirectory();

  useEffect(() => {
    (async () => {
      setTree(await fetchDirectory("samples/index.json", { root: true }));
    })();
  }, []);

  async function handleClear() {
    // await bridge.data.clear();
    // fetchDirectoryState();
  }

  console.log("Initial tree", tree);

  return (
    <>
      <button onClick={handleClear}>Clear</button>
      <DirectoryTree
        initialTree={tree}
        fetchDirectory={fetchDirectory}
        parent="samples"
      />
    </>
  );
};

export default App;
