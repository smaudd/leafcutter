import { bridge } from "../../services/bridge";
import { useState, useEffect, useRef } from "react";
import Player from "../Player/Player";
import styles from "./SearchBar.module.css";

export default function SearchBar({ basePath, onClickElement }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const limit = 2;
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const lastResultRef = useRef(null);
  const debounceTimeoutRef = useRef(null); // Reference to store the debounce timeout ID

  // Initial data loading
  useEffect(() => {
    (async () => {
      setLoading(true);
      const index = await bridge.data.searchIndex(basePath, 1);
      if (index.next) {
        const iterable = new Array(index.total)
          .fill(null)
          .map((_, i) => i)
          .slice(page);
        const results = [];
        for await (const i of iterable) {
          const index = await bridge.data.searchIndex(basePath, i);
          results.push(...index.content);
        }
        setResults(results);
        setLoading(false);
        setShowResults(true);
      }
    })();
    // document.addEventListener("click", (e) => {
    //   if (e.target.classList.contains("search-bar")) {
    //     setShowResults(true);
    //   } else {
    //     setShowResults(false);
    //   }
    // });
  }, []);

  // Function to handle user input and debounce the search
  function handleInputChange(e) {
    const query = e.target.value;
    setSearchTerm(query);
    setShowResults(true);
  }

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
    if (!searchTerm) {
      return false;
    }
    return result.name.toLowerCase().includes(searchTerm.toLowerCase());
  }

  useEffect(() => {
    observerRef.current.scrollIntoView({ behavior: "smooth" });
  }, [showResults]);

  // Slice the results for the current page
  const shownResults = results.filter(filterResults);
  const resultsFrame = shownResults.slice(0, page * limit + limit);
  return (
    <nav class={styles["search-bar"]}>
      <input
        type="text"
        placeholder="Search..."
        onChange={handleInputChange}
        value={searchTerm}
        className={styles["input"]}
      />
      <div
        ref={observerRef}
        className={styles["container"]}
        data-results={showResults ? shownResults.length : 0}
      >
        {resultsFrame.map((result, index) => (
          <div>
            <button
              onClick={() => {
                setShowResults(false);
                onClickElement(result);
              }}
            >
              Open on tree
            </button>
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
  );
}
