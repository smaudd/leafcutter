import React, {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
} from "react";
import * as Tone from "tone";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const source = useRef(null);
  const [{ isPlaying, activePlayer }, setState] = useState({
    isPlaying: false,
    activePlayer: null,
  });

  const [sampler, setSampler] = useState(null);
  const scheduledEventId = useRef(null);
  const subscribers = useRef(new Set()); // To hold the draw loop subscribers

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: {
        C4: "",
      },
      release: 1,
    });
    sampler.toDestination();
    setSampler(sampler);

    // Start draw loop
    Tone.getTransport().scheduleRepeat(() => {
      Tone.getDraw().schedule(() => {
        // Notify all subscribers
        subscribers.current.forEach((callback) => callback(Tone.now()));
      });
    }, "+0.5"); // About 60 FPS

    return () => {
      Tone.getTransport().stop();
      subscribers.current.clear();
    };
  }, []);

  const clearScheduledEvent = () => {
    if (scheduledEventId.current !== null) {
      Tone.getTransport().clear(scheduledEventId.current);
      scheduledEventId.current = null;
    }
  };

  const play = async (audioBuffer, playerId) => {
    await Tone.start();
    Tone.getTransport().start();
    clearScheduledEvent();

    const duration = audioBuffer.duration;

    sampler.add("C4", audioBuffer);

    sampler.triggerAttack("C4", Tone.now());
    source.current = sampler;

    scheduledEventId.current = Tone.getTransport().scheduleOnce(() => {
      setState(() => ({
        isPlaying: false,
        activePlayer: null,
      }));
    }, Tone.now() + duration);

    setState({
      isPlaying: true,
      activePlayer: playerId,
    });
  };

  const stop = () => {
    clearScheduledEvent();
    if (source.current) {
      sampler.release = 0;
      sampler.triggerRelease("C4", Tone.now());
    }
    setState({
      isPlaying: false,
      activePlayer: null,
    });
  };

  // Add subscription methods
  const subscribeToDraw = (callback) => {
    subscribers.current.add(callback);
  };

  const unsubscribeFromDraw = (callback) => {
    subscribers.current.delete(callback);
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        play,
        stop,
        activePlayer,
        subscribeToDraw,
        unsubscribeFromDraw,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
