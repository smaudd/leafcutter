import { bridge } from "../../services/bridge";
import { useState, useEffect, useRef } from "react";
import Player from "../Player/Player";
import styles from "./SearchBar.module.css";
import Button from "../Button/Button";
import Loader from "../Loader/Loader";
import useDebouncedState from "../../hooks/useDebounce";

export default function SearchBar({ basePaths = [], onClickElement }) {
  const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState(
    "",
    300 // Debounce delay in milliseconds
  );
  const [showResults, setShowResults] = useState(false);
  const limit = 2;
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const lastResultRef = useRef(null);
  const searchRef = useRef(null);
  const debounceTimeoutRef = useRef(null); // Reference to store the debounce timeout ID

  // Initial data loading
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);

      try {
        // Process all base paths concurrently
        const results = await Promise.all(
          basePaths.map(async (basePath) => {
            const index = await bridge.data.searchIndex(basePath, 1);

            if (index.next) {
              // Create an array of pages to fetch
              const pageNumbers = Array.from(
                { length: index.totalPages - page + 1 },
                (_, i) => i + page
              );

              // Fetch all pages concurrently for the current basePath
              const pageResults = await Promise.all(
                pageNumbers.map((pageNum) =>
                  bridge.data.searchIndex(basePath, pageNum)
                )
              );

              // Combine all content into a single array
              return pageResults
                .flatMap((pageResult) => pageResult.content)
                .map((content) => ({ ...content, basePath }));
            }

            return []; // If no `next`, return an empty array
          })
        );
        // Combine results from all base paths and filter for "file" type
        const filteredResults = results
          .flat()
          .filter((result) => result.type === "file")
          .map((result) => ({
            ...result,
            file: `${result.basePath}/${result.file}`,
          }));
        setResults(filteredResults);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Function to handle user input and debounce the search
  function handleInputChange(e) {
    const query = e.target.value;
    setSearchTerm(query);
    setShowResults(true);
  }

  useEffect(() => {
    // Define searchbar height CSS variable
    if (searchRef.current) {
      document.body.style.setProperty(
        "--searchbar-height",
        `${searchRef.current.getBoundingClientRect().height}px`
      );
    }
  }, []);

  // Setup IntersectionObserver to detect when the last result is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setPage((prev) => {
            return prev + 1;
          }); // Trigger loading more results
        }
      },
      {
        root: observerRef.current, // Observe within the search container
        rootMargin: "100px", // Trigger load 100px before reaching the bottom
        threshold: 1.0, // Trigger when 100% of the last result is visible
      }
    );

    // Ensure the observer only observes the new last result element
    if (lastResultRef.current) {
      observer.observe(lastResultRef.current);
    }

    // Cleanup observer on component unmount or when the last result changes
    return () => {
      if (lastResultRef.current) {
        observer.unobserve(lastResultRef.current);
      }
    };
  }, [results]); // Re-run when results change
  // Filter results based on search term
  function filterResults(result) {
    if (!debouncedSearchTerm) {
      return false;
    }
    return result.name
      .toLowerCase()
      .includes(debouncedSearchTerm.toLowerCase());
  }

  // Slice the results for the current page
  const shownResults = results.filter(filterResults);
  const resultsFrame = shownResults.slice(0, page * limit + limit);
  return (
    <>
      <div
        className={styles["overlay"]}
        data-show={Boolean(showResults && searchTerm)}
      ></div>
      <nav className={styles["search-bar"]}>
        <div className={styles["search-bar-container"]}>
          <input
            type="text"
            placeholder="Search..."
            onChange={handleInputChange}
            onFocus={() => {
              setShowResults(true);
            }}
            value={searchTerm}
            className={styles["input"]}
            ref={searchRef}
          />
          {showResults && searchTerm ? (
            <Button
              onClick={async () => {
                setShowResults(false);
                setSearchTerm("");
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10ZM8.97 8.97a.75.75 0 0 1 1.06 0L12 10.94l1.97-1.97a.75.75 0 0 1 1.06 1.06L13.06 12l1.97 1.97a.75.75 0 0 1-1.06 1.06L12 13.06l-1.97 1.97a.75.75 0 0 1-1.06-1.06L10.94 12l-1.97-1.97a.75.75 0 0 1 0-1.06Z"
                  fill="#1C274C"
                />
              </svg>
            </Button>
          ) : (
            <Button>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.796 15.811 21 21m-3-10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                  stroke="#1C274C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          )}
        </div>
        <div
          ref={observerRef}
          className={styles["container"]}
          data-results={showResults && searchTerm ? 1 : 0}
        >
          {loading && <Loader />}
          {resultsFrame.length === 0 && searchTerm && (
            <div className={styles["notfound"]}>There's nothing here :(</div>
          )}
          {resultsFrame.map((result, index) => (
            <div key={result.file}>
              <Button
                onClick={() => {
                  setShowResults(false);
                  onClickElement(result);
                }}
              >
                Open on index origin
              </Button>
              <Player key={result.name} path={result.file} id={index}>
                {result.name}
              </Player>
            </div>
          ))}
          {/* The last item in the list to trigger the IntersectionObserver */}
          <div
            ref={lastResultRef}
            style={{
              height: "50px", // Give it enough height to make sure it's observed
            }}
          ></div>
        </div>
      </nav>
    </>
  );
}
