import { useState, useRef, useEffect } from "react";
import { useAudio } from "../../context/AudioProvider";
import { bridge } from "../../services/bridge";
import styles from "./Player.module.css";
import Button from "../Button/Button";

export default function Player({ path, id }) {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const canvasRef = useRef(null);
  const { play, stop, isPlaying, activePlayer, audioContext } = useAudio();

  useEffect(() => {
    // Check if file is already downloaded
    (async () => {
      handleDownload();
    })();
  }, []);

  async function handleDownload() {
    try {
      const buffer = await bridge.data.getFile(path); // Fetch audio file
      const decodedBuffer = await audioContext.decodeAudioData(buffer); // Decode audio
      setAudioBuffer(decodedBuffer);
      renderWaveform(decodedBuffer); // Draw waveform
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  function renderWaveform(buffer) {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < width; i++) {
      const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
      const max = Math.max(...channelData.slice(i * step, (i + 1) * step));

      const yMin = ((1 + min) * height) / 2;
      const yMax = ((1 + max) * height) / 2;

      ctx.lineTo(i, yMin);
      ctx.lineTo(i, yMax);
    }

    ctx.stroke();
  }
  async function handleDragStart(e) {
    e.preventDefault();
    await bridge.ui.startDrag(path);
  }
  const isThisPlayerActive = activePlayer === id;

  return (
    <div
      className={styles["container"]}
      draggable
      onDragStart={handleDragStart}
    >
      <span>Player {path}</span>
      <button onClick={handleDownload}>Download Audio</button>
      {isThisPlayerActive && isPlaying && <span>Playing...</span>}
      <div>
        <Button onClick={() => play(audioBuffer, id)}>Play</Button>
        <Button
          onClick={() => stop(id)}
          disabled={isThisPlayerActive && !isPlaying && !audioBuffer}
        >
          Stop
        </Button>
      </div>
      <canvas ref={canvasRef} className={styles["canvas"]}></canvas>
    </div>
  );
}
