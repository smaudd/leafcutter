import React, { useState, useEffect } from "react";

const IndexManager = ({ onUrlsChange = () => {} }) => {
  const [url, setUrl] = useState("");
  const [savedUrls, setSavedUrls] = useState([]);

  // Load URLs from localStorage when component mounts
  useEffect(() => {
    const storedUrls = [];
    setSavedUrls(storedUrls);
  }, []);

  // Save URLs to localStorage and notify parent
  const saveUrlsToLocalStorage = (urls) => {
    localStorage.setItem("urls", JSON.stringify(urls));
    setSavedUrls(urls);
    if (onUrlsChange) onUrlsChange(urls); // Callback to parent
  };

  // Add a new URL to the list
  const handleAddUrl = () => {
    if (url.trim() && !savedUrls.includes(url)) {
      const updatedUrls = [...savedUrls, url];
      saveUrlsToLocalStorage(updatedUrls);
      setUrl(""); // Clear input field
    }
  };

  // Delete a URL from the list
  const handleDeleteUrl = (urlToDelete) => {
    const updatedUrls = savedUrls.filter(
      (savedUrl) => savedUrl !== urlToDelete
    );
    saveUrlsToLocalStorage(updatedUrls);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL"
        />
        <button onClick={handleAddUrl}>Add repo</button>
      </div>
      <div>
        <h3>Repositories</h3>
        <ul>
          {savedUrls.map((savedUrl, index) => (
            <li key={index}>
              {savedUrl}{" "}
              <button onClick={() => handleDeleteUrl(savedUrl)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IndexManager;
