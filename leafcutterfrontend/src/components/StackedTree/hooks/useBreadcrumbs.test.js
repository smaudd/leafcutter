import { renderHook } from "@testing-library/react";
import useBreadcrumbs from "./useBreadcrumbs";

describe("useBreadcrumbs", () => {
  it("should return correct breadcrumb structure for a standard directory path", () => {
    const tree = { directory: "/root/parent/child" };
    const rootDirectory = { current: "/root" };

    const { result } = renderHook(() => useBreadcrumbs(tree, rootDirectory));

    expect(result.current).toEqual([
      { title: "root", path: "/root" },
      { title: "parent", path: "/root/parent" },
      { title: "child", path: "/root/parent/child" },
    ]);
  });
  it("should return empty breadcrumbs when directory is empty", () => {
    const tree = { directory: "" };
    const rootDirectory = { current: "/root" };

    const { result } = renderHook(() => useBreadcrumbs(tree, rootDirectory));

    expect(result.current).toEqual([]);
  });
  it("should return a single breadcrumb when root directory is the only segment", () => {
    const tree = { directory: "/root" };
    const rootDirectory = { current: "/root" };

    const { result } = renderHook(() => useBreadcrumbs(tree, rootDirectory));

    expect(result.current).toEqual([{ title: "root", path: "/root" }]);
  });
});
