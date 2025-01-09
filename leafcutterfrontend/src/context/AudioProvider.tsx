import React, { createContext, useState, useRef, useContext } from "react";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const audioContext = useRef(
    new (window.AudioContext || window.webkitAudioContext)()
  );
  const source = useRef(null);
  const gainNode = useRef(audioContext.current.createGain());
  const [{ isPlaying, activePlayer }, setState] = useState({
    isPlaying: false,
    activePlayer: null,
  });
  const play = (audioBuffer, playerId) => {
    let needsToChoke = false;
    // Stop current playback if another player is active
    if (source.current) {
      needsToChoke = true;
      gainNode.current.gain.setValueAtTime(1, audioContext.current.currentTime); // Start at full volume
      source.current.stop();
      source.current = null;
    }

    const sourceBuffer = audioContext.current.createBufferSource();
    sourceBuffer.buffer = audioBuffer;
    sourceBuffer.connect(audioContext.current.destination);
    sourceBuffer.start(0);

    source.current = sourceBuffer;
    setState({
      isPlaying: true,
      activePlayer: playerId,
    });

    source.current.onended = () => {
      console.log("Ended", needsToChoke);
      if (needsToChoke) {
        needsToChoke = false;
        return;
      }
      setState({
        isPlaying: false,
        activePlayer: null,
      });
      source.current = null;
    };
  };

  const stop = (id) => {
    if (id !== activePlayer) {
      return;
    }
    if (source.current) {
      source.current.stop();
      setState({
        isPlaying: false,
        activePlayer: null,
      });
      source.current = null;
    }
  };

  // const stop = (id) => {
  //   if (id !== activePlayer) {
  //     return;
  //   }

  //   if (source.current) {
  //     // Create a gain node for the fade-out
  //     gainNode.current.gain.setValueAtTime(1, audioContext.current.currentTime); // Start at full volume

  //     // Connect the source to the gain node, then to the destination
  //     source.current.disconnect(); // Disconnect previous connections
  //     source.current
  //       .connect(gainNode.current)
  //       .connect(audioContext.current.destination);

  //     // Schedule a fade-out over 1 second (adjust duration as needed)
  //     const fadeDuration = 1.0; // Duration in seconds
  //     gainNode.current.gain.exponentialRampToValueAtTime(
  //       0.001,
  //       audioContext.current.currentTime + fadeDuration
  //     );

  //     // Stop the source after the fade-out completes
  //     setTimeout(() => {
  //       source.current.stop();
  //       source.current = null;

  //       setState({
  //         isPlaying: false,
  //         activePlayer: null,
  //       });
  //     }, fadeDuration * 1000); // Convert seconds to milliseconds
  //   }
  // };

  return (
    <AudioContext.Provider
      value={{
        audioContext: audioContext.current,
        isPlaying,
        play,
        stop,
        activePlayer, // Expose activePlayer for components
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
