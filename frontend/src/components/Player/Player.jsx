import { useState, useRef, useEffect } from "react";
import { useAudio } from "../../context/AudioProvider";
import { bridge } from "../../services/bridge";
import Button from "../Button/Button";
import Loader from "../Loader/Loader";
import color from "../../services/color";
import styles from "./Player.module.css";
import renderWaveform from "./renderWaverform";
import * as Tone from "tone";

export default function Player({ path, id, mode, highlight }) {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const playheadPosition = useRef(0);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContext = Tone.getContext();
  const {
    play,
    stop,
    isPlaying,
    activePlayer,
    subscribeToDraw,
    unsubscribeFromDraw,
  } = useAudio();
  const titleColor = useRef(color.getRandomColor());
  const waveformColors = useRef([]);
  const playbackScheduleId = useRef(null);
  const playbackTransportStart = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    downloadAudio();
  }, []);

  useEffect(() => {
    const onDraw = (currentTime) => {
      if (isPlaying && activePlayer === id) {
        const duration = audioBuffer?.duration || 0;
        const canvasWidth = canvasRef.current.offsetWidth;

        if (!playbackTransportStart.current) {
          playbackTransportStart.current = Tone.getTransport().seconds;
        }

        const elapsed =
          Tone.getTransport().seconds - playbackTransportStart.current;
        playheadPosition.current = Math.min(
          (elapsed / duration) * canvasWidth,
          canvasWidth
        );

        if (elapsed >= duration || !isPlaying) {
          // Tone.getTransport().clear(playbackScheduleId.current);
          // stopPlayheadAnimation();
          console.log("Finished..");
          return;
        }

        // Render waveform with updated playhead
        renderWaveform(
          canvasRef.current,
          audioBuffer,
          waveformColors.current,
          80,
          playheadPosition.current
        );
      }
      // Update UI or perform actions
    };

    subscribeToDraw(onDraw);

    return () => {
      unsubscribeFromDraw(onDraw);
    };
  }, [subscribeToDraw, unsubscribeFromDraw, isPlaying, activePlayer]);

  // useEffect(() => {
  //   if (!loading && audioBuffer) {
  //     renderWaveform(
  //       canvasRef.current,
  //       audioBuffer,
  //       waveformColors.current,
  //       80
  //     );
  //   }
  // }, [loading, audioBuffer]);

  // useEffect(() => {
  //   if (isPlaying && activePlayer === id) {
  //     startPlayheadAnimation();
  //   } else if (!isPlaying && activePlayer === id) {
  //     stopPlayheadAnimation();
  //   }
  // }, [isPlaying, activePlayer]);

  async function downloadAudio() {
    try {
      setLoading(true);
      const buffer = await bridge.data.getFile(path);
      const decodedBuffer = await audioContext.decodeAudioData(buffer);
      setAudioBuffer(decodedBuffer);
      renderWaveform(
        canvasRef.current,
        decodedBuffer,
        waveformColors.current,
        80
      );
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setLoading(false);
    }
  }

  function startPlayheadAnimation(offset = 0) {
    const duration = audioBuffer?.duration || 0;
    const canvasWidth = canvasRef.current.offsetWidth;

    if (!playbackTransportStart.current) {
      playbackTransportStart.current = Tone.getTransport().seconds;
    }

    playbackScheduleId.current = Tone.getTransport().scheduleRepeat((time) => {
      drawRef.current = Tone.getDraw().schedule(() => {
        const elapsed =
          Tone.getTransport().seconds - playbackTransportStart.current;
        playheadPosition.current = Math.min(
          (elapsed / duration) * canvasWidth,
          canvasWidth
        );

        if (elapsed >= duration || !isPlaying) {
          Tone.getTransport().clear(playbackScheduleId.current);
          stopPlayheadAnimation();
          console.log("Finished..");
          return;
        }

        // Render waveform with updated playhead
        renderWaveform(
          canvasRef.current,
          audioBuffer,
          waveformColors.current,
          80,
          playheadPosition.current
        );
      }, time);
    }, 0.016); // Update every ~16ms (60 FPS)
  }

  function stopPlayheadAnimation() {
    // Tone.getTransport().cancel(); // Cancel all scheduled events
    Tone.getTransport().clear(playbackScheduleId.current);
    if (drawRef.current) {
      console.log(drawRef.current);
      drawRef.current.cancel();
    }
    playheadPosition.current = 0;
    // Render waveform without playhead
    renderWaveform(
      canvasRef.current,
      audioBuffer,
      waveformColors.current,
      80,
      playheadPosition.current
    );
  }

  function handleCanvasClick() {
    play(audioBuffer, id);
  }

  async function handleDragStart(e) {
    e.preventDefault();
    await bridge.ui.startDrag(path, mode);
  }

  async function handleStop() {
    stop();
    stopPlayheadAnimation();
  }

  function handleStart() {
    play(audioBuffer, id);
    startPlayheadAnimation();
  }

  const isActive = activePlayer === id;

  return (
    <div
      className={`${styles.container} ${highlight ? styles.highlight : ""}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className={styles.header}>
        <h4
          className={styles.title}
          style={{ backgroundColor: titleColor.current, color: "#fff" }}
        >
          {path.split("/").at(-1)}
        </h4>
      </div>
      <div className={styles.waveformContainer}>
        {loading ? (
          <Loader />
        ) : (
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onClick={handleCanvasClick}
          ></canvas>
        )}
      </div>
      <Button onClick={() => (isActive ? handleStop() : handleStart())}>
        {isPlaying && isActive ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </div>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 6c0-1.886 0-2.828.586-3.414C3.172 2 4.114 2 6 2c1.886 0 2.828 0 3.414.586C10 3.172 10 4.114 10 6v12c0 1.886 0 2.828-.586 3.414C8.828 22 7.886 22 6 22c-1.886 0-2.828 0-3.414-.586C2 20.828 2 19.886 2 18V6ZM14 6c0-1.886 0-2.828.586-3.414C15.172 2 16.114 2 18 2c1.886 0 2.828 0 3.414.586C22 3.172 22 4.114 22 6v12c0 1.886 0 2.828-.586 3.414C20.828 22 19.886 22 18 22c-1.886 0-2.828 0-3.414-.586C14 20.828 14 19.886 14 18V6Z"
        fill="#1C274C"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.409 9.353a2.998 2.998 0 0 1 0 5.294L8.597 21.614C6.534 22.736 4 21.276 4 18.968V5.033c0-2.31 2.534-3.769 4.597-2.648l12.812 6.968Z"
        fill="#1C274C"
      />
    </svg>
  );
}
