import React, { useState } from "react";

const IndexManager = ({ urls = [], onUrlsChange = () => {} }) => {
  const [inputUrl, setInputUrl] = useState("");

  // Add a new URL to the list
  const handleAddUrl = () => {
    if (inputUrl.trim() && !urls.includes(inputUrl.trim())) {
      const updatedUrls = [...urls, inputUrl.trim()];
      onUrlsChange(updatedUrls);
      setInputUrl(""); // Clear input field
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddUrl();
    }
  };

  return (
    <div>
      <div>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a repository URL"
        />
        <button onClick={handleAddUrl}>Add Repo</button>
      </div>
    </div>
  );
};

export default IndexManager;
