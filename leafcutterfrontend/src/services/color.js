const palette = [
  "#E63946", // Crimson red
  "#1D3557", // Deep navy blue
  "#2A9D8F", // Teal green
  "#F4A261", // Warm orange
  "#264653", // Dark cyan
  "#E76F51", // Coral orange
  "#457B9D", // Cool blue
  "#8D99AE", // Muted purple-gray
];

export default color = {
  // Function to assign random colors
  getRandomColor: (idx) => {
    if (typeof idx === "number") {
      return palette[idx % palette.length];
    }
    // Generate random number to return random color
    return palette[Math.floor(Math.random() * palette.length)];
  },
  palette,
};
