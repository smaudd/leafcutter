// index.d.ts
// import WaveformAudioPlayer from "./components/WaveformAudioPlayer";

// customElements.define("waveform-audio-player", WaveformAudioPlayer);

document.getElementById("drag1").ondragstart = (event) => {
  event.preventDefault();
  window.electron.startDrag(event.currentTarget.dataset.url);
};

document.getElementById("drag2").ondragstart = (event) => {
  event.preventDefault();
  window.electron.startDrag(event.currentTarget.dataset.url);
};

// https://couponsb.fra1.cdn.digitaloceanspaces.com/amen.wav

window.download = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.arrayBuffer();
    console.log(blob);
    window.electron.blob(blob);
  } catch (err) {
    console.log("ERRRO!", err);
  }
};
