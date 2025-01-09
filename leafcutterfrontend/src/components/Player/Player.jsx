import { useState, useRef, useEffect } from "react";
import { useAudio } from "../../context/AudioProvider";
import { bridge } from "../../services/bridge";
import styles from "./Player.module.css";
import Button from "../Button/Button";

export default function Player({ path, id, mode }) {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const playheadPositionRef = useRef(null); // Playhead position
  const animationRef = useRef(null); // Ref for animation frame
  const startTimeRef = useRef(null); // Ref for playback start time
  const canvasRef = useRef(null);
  const { play, stop, isPlaying, activePlayer, audioContext } = useAudio();

  useEffect(() => {
    handleDownload();
  }, []);

  useEffect(() => {
    if (isPlaying && activePlayer === id) {
      startPlayheadAnimation();
    } else {
      stopPlayheadAnimation();
    }
  }, [isPlaying, activePlayer]);

  async function handleDownload() {
    try {
      const buffer = await bridge.data.getFile(path, mode);
      const decodedBuffer = await audioContext.decodeAudioData(buffer);
      setAudioBuffer(decodedBuffer);
      renderWaveform(decodedBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  function renderWaveform(buffer) {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth * dpr;
    const height = canvas.offsetHeight * dpr;

    canvas.width = width;
    canvas.height = height;
    ctx.scale(dpr, dpr);

    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / canvas.offsetWidth);

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1C274C"; // Waveform color
    ctx.moveTo(0, canvas.offsetHeight / 2);

    for (let i = 0; i < canvas.offsetWidth; i += 1) {
      const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
      const max = Math.max(...channelData.slice(i * step, (i + 1) * step));

      const yMin = ((1 + min) * canvas.offsetHeight) / 2;
      const yMax = ((1 + max) * canvas.offsetHeight) / 2;

      ctx.lineTo(i, yMin);
      ctx.lineTo(i, yMax);
    }

    ctx.stroke();
  }

  function startPlayheadAnimation(offset = 0) {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const duration = audioBuffer.duration;
    const width = canvas.offsetWidth;

    const updatePlayhead = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp; // Convert to milliseconds

      const elapsed = (timestamp - startTimeRef.current) / 1000 + offset; // Convert to seconds
      const position = Math.min((elapsed / duration) * width, width); // Map to canvas width

      playheadPositionRef.current = position;
      drawPlayhead();

      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(updatePlayhead);
      }
    };

    animationRef.current = requestAnimationFrame(updatePlayhead);
  }

  function stopPlayheadAnimation() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    startTimeRef.current = null;
    playheadPositionRef.current = 0;
    renderWaveform(audioBuffer);
  }

  function drawPlayhead() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Redraw the waveform
    renderWaveform(audioBuffer);

    // Draw the playhead
    ctx.beginPath();
    ctx.strokeStyle = "#FF0000"; // Playhead color
    ctx.lineWidth = 2;
    ctx.moveTo(playheadPositionRef.current, 0);
    ctx.lineTo(playheadPositionRef.current, height);
    ctx.stroke();
  }

  async function handleDragStart(e) {
    e.preventDefault();
    await bridge.ui.startDrag(path, mode);
  }

  const isThisPlayerActive = activePlayer === id;

  function handleCanvasClick(event) {
    play(audioBuffer, id);
    // if (!audioBuffer || !audioContext) return;

    // const canvas = canvasRef.current;
    // const rect = canvas.getBoundingClientRect(); // Get canvas bounds
    // const x = event.clientX - rect.left; // Get click X coordinate relative to canvas

    // // Map the X coordinate to the audio buffer time
    // const duration = audioBuffer.duration; // Total duration of the audio
    // const clickedTime = (x / canvas.offsetWidth) * duration;

    // // Play the audio from the clicked time
    // if (audioContext.state === "suspended") {
    //   audioContext.resume(); // Ensure the context is running
    // }

    // const source = audioContext.createBufferSource();
    // source.buffer = audioBuffer;
    // source.connect(audioContext.destination);
    // source.start(0, clickedTime); // Start playback at the calculated time
    // startPlayheadAnimation(clickedTime);
    // source.onended = () => {
    //   stopPlayheadAnimation();
    // };
  }

  return (
    <div
      className={styles["container"]}
      draggable
      onDragStart={handleDragStart}
    >
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
        <canvas
          ref={canvasRef}
          className={styles["canvas"]}
          onClick={handleCanvasClick}
        ></canvas>
      </div>
    </div>
  );
}
