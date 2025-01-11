import { renderHook } from "@testing-library/react";
import useBreadcrumbs from "./useBreadcrumbs";

describe("useBreadcrumbs", () => {
  it("should return correct breadcrumb structure for a standard directory path", () => {
    const initialTree = { directory: "/root/parent/child" };
    const rootDirectory = { current: "/root" };

    const { result } = renderHook(() =>
      useBreadcrumbs(initialTree, rootDirectory)
    );

    expect(result.current).toEqual([
      { title: "root", path: "/root" },
      { title: "parent", path: "/root/parent" },
      { title: "child", path: "/root/parent/child" },
    ]);
  });
  it("should return empty breadcrumbs when directory is empty", () => {
    const initialTree = { directory: "" };
    const rootDirectory = { current: "/root" };

    const { result } = renderHook(() =>
      useBreadcrumbs(initialTree, rootDirectory)
    );

    expect(result.current).toEqual([]);
  });
  it("should return a single breadcrumb when root directory is the only segment", () => {
    const initialTree = { directory: "/root" };
    const rootDirectory = { current: "/root" };

    const { result } = renderHook(() =>
      useBreadcrumbs(initialTree, rootDirectory)
    );

    expect(result.current).toEqual([{ title: "root", path: "/root" }]);
  });
});
