import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import useDirectoryState from "./useDirectoryState";

describe("useDirectoryState", () => {
  it("should initialize limit and opacity correctly", () => {
    const initialTree = { directory: "/root" };
    const fetchDirectory = vi.fn();
    const setTree = vi.fn();

    const { result } = renderHook(() =>
      useDirectoryState(initialTree, fetchDirectory, setTree)
    );

    expect(result.current.limit).toBe(10); // default limit
    expect(result.current.opacity).toBe(1); // default opacity
  });
  it("should update directory and call setTree on directory click", async () => {
    const initialTree = { directory: "/root" };
    const fetchDirectory = vi.fn().mockResolvedValue({ content: {} });
    const setTree = vi.fn();

    const { result } = renderHook(() =>
      useDirectoryState(initialTree, fetchDirectory, setTree)
    );

    await act(async () => {
      await result.current.handleDirectoryClick("folder1", false);
    });

    expect(fetchDirectory).toHaveBeenCalledWith("/root/folder1/index.json");
    expect(setTree).toHaveBeenCalledWith(
      initialTree,
      expect.objectContaining({
        directory: "/root/folder1",
        root: false,
      })
    );
  });

  it("should update the directory correctly when calling handlePop", async () => {
    const initialTree = { directory: "/root/folder1" };
    const fetchDirectory = vi.fn().mockResolvedValue({ content: {} });
    const setTree = vi.fn();

    const { result } = renderHook(() =>
      useDirectoryState(initialTree, fetchDirectory, setTree)
    );

    // Call handlePop to go one level up
    await act(async () => {
      await result.current.handlePop();
    });

    // Check if fetchDirectory is called with the correct path for the parent directory
    expect(fetchDirectory).toHaveBeenCalledWith(
      initialTree.directory + "/index.json"
    );

    // Check if setTree is called with the updated directory
    expect(setTree).toHaveBeenCalledWith(
      initialTree,
      expect.objectContaining({
        content: {
          [initialTree.directory]: {
            type: "directory",
          },
        },
      })
    );
  });

  it("should remain at root if already at root when calling handlePop", async () => {
    const initialTree = { directory: "/root" };
    const fetchDirectory = vi.fn().mockResolvedValue({ content: {} });
    const setTree = vi.fn();

    const { result } = renderHook(() =>
      useDirectoryState(initialTree, fetchDirectory, setTree)
    );

    // Call handlePop when we're already at root
    await act(async () => {
      await result.current.handlePop();
    });

    // Verify that fetchDirectory was not called with an invalid path
    expect(fetchDirectory).not.toHaveBeenCalledWith("/root/folder1/index.json");

    // Check if setTree is called with the root directory
    expect(setTree).toHaveBeenCalledWith(
      initialTree,
      expect.objectContaining({
        directory: "/root", // It should stay at root
        root: true,
      })
    );
  });
});
