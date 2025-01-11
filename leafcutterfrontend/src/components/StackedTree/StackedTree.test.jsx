import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StackedTree from "./StackedTree";
import { describe, vi } from "vitest";

const initialTree = {
  directory: "/root",
  content: {
    folder1: { type: "directory" },
    folder2: { type: "directory" },
  },
};

const fetchDirectory = vi.fn();
const setTree = vi.fn();
describe("StackedTree", () => {
  it("should render directory structure correctly", () => {
    render(
      <StackedTree
        initialTree={initialTree}
        fetchDirectory={fetchDirectory}
        setTree={setTree}
        root={false}
        loading={false}
      />
    );

    // Check if the directory names are rendered
    expect(screen.getByText("folder1")).toBeDefined();
    expect(screen.getByText("folder2")).toBeDefined();
  });

  it("should render loading state", () => {
    render(
      <StackedTree
        initialTree={initialTree}
        fetchDirectory={fetchDirectory}
        setTree={setTree}
        root={false}
        loading={true}
      />
    );

    // Check if the loading text is displayed
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("should navigate when clicking on a breadcrumb", () => {
    const initialTree = {
      directory: "/root/folder",
      content: {
        subFolder1: { type: "directory" },
        subFolder2: { type: "directory" },
      },
    };
    const fetchDirectory = vi.fn();
    const setTree = vi.fn();

    render(
      <StackedTree
        initialTree={initialTree}
        fetchDirectory={fetchDirectory}
        setTree={setTree}
        root={false}
        loading={false}
      />
    );

    const breadcrumbButton = screen.getByText("subFolder1");
    breadcrumbButton.click();

    // Verify if handleDirectoryClick is called with the correct arguments
    expect(fetchDirectory).toHaveBeenCalledWith(
      "/root/folder/subFolder1/index.json"
    );
  });

  it("should show more button if directory has more than <limit> elements", () => {
    const initialTree = {
      directory: "/root",
      content: {},
    };

    // Fill up contentShow more button will be displayed when there are more than <limit> directories
    for (let i = 0; i <= 20; i++) {
      initialTree.content[`folder${i}`] = { type: "directory" };
    }

    const fetchDirectory = vi.fn();
    const setTree = vi.fn();

    render(
      <StackedTree
        initialTree={initialTree}
        fetchDirectory={fetchDirectory}
        setTree={setTree}
        root={false}
        loading={false}
      />
    );

    const showMoreButton = screen.getByText("Show More");

    // Verify if the limit has been increased (from 10 to 20 or whatever your limit is)
    expect(showMoreButton).toBeDefined();
  });

  it("should add more <limit> elements to the list if show more button is clicked", async () => {
    const elementCount = 20;
    const initialTree = {
      directory: "/root",
      content: {},
    };

    // Fill up content; Show more button will be displayed when there are more than <limit> directories
    for (let i = 0; i <= elementCount; i++) {
      initialTree.content[`folder${i}`] = { type: "directory" };
    }

    const fetchDirectory = vi.fn();
    const setTree = vi.fn();

    render(
      <StackedTree
        initialTree={initialTree}
        fetchDirectory={fetchDirectory}
        setTree={setTree}
        root={false}
        loading={false}
      />
    );

    const showMoreButton = screen.getByText("Show More");
    fireEvent.click(showMoreButton); // Use fireEvent instead of .click()

    // Wait for the state update and DOM re-render
    await waitFor(() => {
      const elements = screen.getAllByRole("listitem");
      expect(elements.length).toBe(elementCount); // Assert that the number of elements is greater than the limit
    });
  });

  it("should call handlePop when the breadcrumb close button is clicked", () => {
    const initialTree = {
      directory: "/root/folder1",
      content: { folder1: { type: "directory" } },
    };
    const fetchDirectory = vi.fn();
    const setTree = vi.fn();

    render(
      <StackedTree
        initialTree={initialTree}
        fetchDirectory={fetchDirectory}
        setTree={setTree}
        root={false}
        loading={false}
      />
    );

    const popButton = screen.getByTestId("breadcrumb-pop");
    popButton.click();

    // Check if handlePop is called
    expect(fetchDirectory).toHaveBeenCalledWith("/root/folder1/index.json");
  });
});
