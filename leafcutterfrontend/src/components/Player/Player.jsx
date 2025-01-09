import { useState, useRef, useEffect } from "react";
import { useAudio } from "../../context/AudioProvider";
import { bridge } from "../../services/bridge";
import styles from "./Player.module.css";
import Button from "../Button/Button";

export default function Player({ path, id, mode }) {
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
      const buffer = await bridge.data.getFile(path, mode); // Fetch audio file
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

    // Adjust for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth * dpr;
    const height = canvas.offsetHeight * dpr;

    canvas.width = width;
    canvas.height = height;
    ctx.scale(dpr, dpr);

    // Disable smoothing
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    // Create rounded rectangle clipping path
    const radius = -10; // Adjust for larger or smaller corners
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.offsetWidth - radius, 0);
    ctx.quadraticCurveTo(canvas.offsetWidth, 0, canvas.offsetWidth, radius);
    ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight - radius);
    ctx.quadraticCurveTo(
      canvas.offsetWidth,
      canvas.offsetHeight,
      canvas.offsetWidth - radius,
      canvas.offsetHeight
    );
    ctx.lineTo(radius, canvas.offsetHeight);
    ctx.quadraticCurveTo(
      0,
      canvas.offsetHeight,
      0,
      canvas.offsetHeight - radius
    );
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip(); // Clip all subsequent drawings to this path

    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / canvas.offsetWidth);

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.lineWidth = 1.5; // Adjust line width for thicker lines
    ctx.moveTo(0, canvas.offsetHeight / 2);

    for (let i = 0; i < canvas.offsetWidth; i += 3) {
      const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
      const max = Math.max(...channelData.slice(i * step, (i + 1) * step));

      const yMin = ((1 + min) * canvas.offsetHeight) / 2;
      const yMax = ((1 + max) * canvas.offsetHeight) / 2;

      ctx.lineTo(i, yMin);
      ctx.lineTo(i, yMax);
    }

    ctx.stroke();
  }

  async function handleDragStart(e) {
    e.preventDefault();
    await bridge.ui.startDrag(path, mode);
  }
  const isThisPlayerActive = activePlayer === id;

  return (
    <div
      className={styles["container"]}
      draggable
      onDragStart={handleDragStart}
    >
      {/* {isThisPlayerActive && isPlaying && <span>Playing...</span>} */}
      <div className={styles["header"]}>
        <h4 className={styles["title"]}>{path.split("/").at(-1)}</h4>
        <Button onClick={() => play(audioBuffer, id)}>
          {isPlaying && isThisPlayerActive ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6c0-1.886 0-2.828.586-3.414C3.172 2 4.114 2 6 2c1.886 0 2.828 0 3.414.586C10 3.172 10 4.114 10 6v12c0 1.886 0 2.828-.586 3.414C8.828 22 7.886 22 6 22c-1.886 0-2.828 0-3.414-.586C2 20.828 2 19.886 2 18V6ZM14 6c0-1.886 0-2.828.586-3.414C15.172 2 16.114 2 18 2c1.886 0 2.828 0 3.414.586C22 3.172 22 4.114 22 6v12c0 1.886 0 2.828-.586 3.414C20.828 22 19.886 22 18 22c-1.886 0-2.828 0-3.414-.586C14 20.828 14 19.886 14 18V6Z"
                fill="#1C274C"
              />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.409 9.353a2.998 2.998 0 0 1 0 5.294L8.597 21.614C6.534 22.736 4 21.276 4 18.968V5.033c0-2.31 2.534-3.769 4.597-2.648l12.812 6.968Z"
                fill="#1C274C"
              />
            </svg>
          )}
        </Button>
      </div>
      <div>
        <canvas ref={canvasRef} className={styles["canvas"]}></canvas>
        {/* <Button
            onClick={() => stop(id)}
            disabled={isThisPlayerActive && !isPlaying && !audioBuffer}
            >
            Stop
            </Button> */}
      </div>
    </div>
  );
}
