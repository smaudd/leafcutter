import color from "../../services/color";

export default function renderWaveform(
  canvas,
  buffer,
  waveformColors,
  numBars = 80,
  playheadPosition = 0 // New parameter for playback head position
) {
  if (!canvas || !buffer) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // Set canvas resolution based on DPR
  const width = canvas.getBoundingClientRect().width * dpr;
  const height = canvas.getBoundingClientRect().height * dpr;
  canvas.width = width;
  canvas.height = height;

  // Normalize the canvas display size
  ctx.scale(dpr, dpr);

  // Disable image smoothing
  ctx.imageSmoothingEnabled = true;

  // Extract channel data and set up parameters
  const channelData = buffer.getChannelData(0);
  const canvasWidth = canvas.offsetWidth; // Render width in logical pixels
  const canvasHeight = canvas.offsetHeight; // Render height in logical pixels
  const centerY = canvasHeight / 2; // Middle of the canvas
  const step = Math.floor(channelData.length / numBars); // Samples per bar

  // Clear the canvas for redrawing
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  // Draw the waveform bars
  for (let x = 0; x < numBars; x++) {
    const start = x * step;
    const end = start + step;

    // Calculate min and max values for the current step
    let min = Infinity;
    let max = -Infinity;
    for (let i = start; i < end; i++) {
      const sample = channelData[i] || 0;
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }

    // Scale waveform data to canvas height
    const yPosMax = centerY - max * centerY; // Positive peak
    const yPosMin = centerY - min * centerY; // Negative peak

    // Calculate bar properties
    const barHeight = yPosMax - yPosMin; // Full height of the bar
    const barWidth = canvasWidth / numBars; // Width of each bar
    const xPos = x * barWidth; // X position for each bar

    // Assign random color if not defined
    if (waveformColors[x] === undefined) {
      waveformColors[x] = color.getRandomColor();
    }
    ctx.fillStyle = waveformColors[x];

    // Draw bars for positive and negative peaks
    ctx.fillRect(xPos, centerY, barWidth, barHeight); // Positive
    ctx.fillRect(xPos, centerY - barHeight, barWidth, barHeight); // Negative
  }

  // Draw the playback head
  if (playheadPosition >= 0 && playheadPosition <= canvasWidth) {
    ctx.strokeStyle = "#FF0000"; // Red color for the playback head
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadPosition, 0); // Top of the canvas
    ctx.lineTo(playheadPosition, canvasHeight); // Bottom of the canvas
    ctx.stroke();
  }
}
