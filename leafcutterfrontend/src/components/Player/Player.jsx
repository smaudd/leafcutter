import { useState, useEffect, useRef } from "react";
import { bridge } from "../../services/bridge";
import styles from "./Player.module.css";

export default function Player({ path }) {
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceNode, setSourceNode] = useState(null);
  const canvasRef = useRef(null);

  // Initialize AudioContext when the component mounts
  useEffect(() => {
    setAudioContext(new (window.AudioContext || window.webkitAudioContext)());

  }, []);

  // Download and decode the audio file
  async function handleDownload() {
    try {
      const buffer = await bridge.data.getFile(path); // Assume this is the ArrayBuffer of the audio file
      console.log(buffer);

      if (audioContext) {
        // Decode audio buffer using the AudioContext
        const decodedBuffer = await audioContext.decodeAudioData(buffer);
        setAudioBuffer(decodedBuffer);

        // Call function to render waveform after decoding
        renderWaveform(decodedBuffer);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  // Function to render waveform on the canvas
  function renderWaveform(buffer) {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext("2d");

    const channelData = buffer.getChannelData(0); // We take the first channel
    const step = Math.ceil(channelData.length / width); // The step size for the waveform
    const sliceWidth = width; // Width of each slice
    let x = 0;

    ctx.clearRect(0, 0, width, height); // Clear previous waveform
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    // Loop through the audio samples and draw waveform
    for (let i = 0; i < width; i++) {
      const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
      const max = Math.max(...channelData.slice(i * step, (i + 1) * step));

      const yMin = ((1 + min) * height) / 2;
      const yMax = ((1 + max) * height) / 2;

      ctx.lineTo(x, yMin);
      ctx.lineTo(x, yMax);

      x++;
    }

    ctx.stroke();
  }

  // Play the audio
  function handlePlay() {
    if (!audioBuffer || isPlaying) return;

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    setIsPlaying(true);
    setSourceNode(source);

    // Reset playing status when the audio ends
    source.onended = () => {
      setIsPlaying(false);
    };
  }

  // Pause the audio
  function handlePause() {
    if (isPlaying && sourceNode) {
      sourceNode.stop();
      setIsPlaying(false);
    }
  }

  return (
    <div className={styles["container"]}>
      <span>Player {path}</span>
      <button onClick={handleDownload}>Download Audio</button>
      <div>
        <button onClick={handlePlay} disabled={!audioBuffer || isPlaying}>
          Play
        </button>
        <button onClick={handlePause} disabled={!isPlaying}>
          Pause
        </button>
      </div>

      <canvas ref={canvasRef} className={styles["canvas"]}></canvas>
    </div>
  );
}
