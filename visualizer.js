const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let source;
let analyser;
let dataArray;
let animationId;

const BAR_COUNT = 48;
let smoothedBars = new Array(BAR_COUNT).fill(0);
let peaks = new Array(BAR_COUNT).fill(0);

let beatPulse = 0;
let bassHistory = [];
const BASS_HISTORY_SIZE = 43;

function setupAudio() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  source = audioCtx.createMediaElementSource(audio);
  analyser = audioCtx.createAnalyser();

  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.72;

  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function getBandValue(startBin, endBin) {
  let sum = 0;
  let count = 0;

  for (let i = startBin; i <= endBin && i < dataArray.length; i++) {
    sum += dataArray[i];
    count++;
  }

  return count ? sum / count : 0;
}

function detectKick() {
  // Low bins = bass / kick area
  const bassNow = getBandValue(1, 12);

  bassHistory.push(bassNow);
  if (bassHistory.length > BASS_HISTORY_SIZE) {
    bassHistory.shift();
  }

  const avgBass =
    bassHistory.reduce((a, b) => a + b, 0) / bassHistory.length || 0;

  const isKick =
    bassHistory.length > 12 &&
    bassNow > avgBass * 1.38 &&
    bassNow > 110;

  if (isKick) {
    beatPulse = 1;
  } else {
    beatPulse *= 0.9;
  }

  return { bassNow, avgBass };
}

function drawRoundedBar(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  animationId = requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  const { bassNow } = detectKick();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // darker background so rainbow shows clearly
  ctx.fillStyle = "rgba(5, 5, 10, 0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gap = 4;
  const totalGap = gap * (BAR_COUNT - 1);
  const barWidth = (canvas.width - totalGap) / BAR_COUNT;

  // More detail in bass, less in highs
  // These are hand-tuned ranges, not raw equal bins
  const bandRanges = [
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
    [7, 8], [8, 10], [10, 12], [12, 14], [14, 16], [16, 18],
    [18, 21], [21, 24], [24, 27], [27, 30], [30, 34], [34, 38],
    [38, 42], [42, 47], [47, 52], [52, 58], [58, 64], [64, 71],
    [71, 79], [79, 88], [88, 98], [98, 109], [109, 121], [121, 134],
    [134, 148], [148, 163], [163, 179], [179, 196], [196, 214], [214, 233],
    [233, 253], [253, 274], [274, 296], [296, 319], [319, 343], [343, 368],
    [368, 394], [394, 421], [421, 449], [449, 478], [478, 508], [508, 539]
  ];

  for (let i = 0; i < BAR_COUNT; i++) {
    const [startBin, endBin] = bandRanges[i];
    let value = getBandValue(startBin, endBin);

    // Boost lows so kick actually hits hard
    const bassWeight = 1.9 - i / 40;
    value *= Math.max(1, bassWeight);

    // Kick makes low-mid bars jump harder
    if (beatPulse > 0.05) {
      const kickInfluence = Math.max(0, 1 - i / 18);
      value *= 1 + beatPulse * 1.8 * kickInfluence;
    }

    // smoother rise/fall
    const riseSpeed = 0.5;
    const fallSpeed = 0.16;

    if (value > smoothedBars[i]) {
      smoothedBars[i] += (value - smoothedBars[i]) * riseSpeed;
    } else {
      smoothedBars[i] += (value - smoothedBars[i]) * fallSpeed;
    }

    let height = (smoothedBars[i] / 255) * canvas.height * 0.95;

    // extra kick lift for the first bars
    if (i < 10) {
      height += beatPulse * 55 * (1 - i / 10);
    }

    height = Math.max(6, Math.min(height, canvas.height - 4));

    // peak lines
    peaks[i] = Math.max(peaks[i] * 0.96, height);

    const x = i * (barWidth + gap);
    const y = canvas.height - height;

    // real rainbow
    const hue = (i / BAR_COUNT) * 360 + performance.now() * 0.03;
    ctx.fillStyle = `hsl(${hue % 360}, 100%, 58%)`;

    drawRoundedBar(x, y, barWidth, height, 8);

    // little peak indicator
    ctx.fillStyle = `hsl(${(hue + 40) % 360}, 100%, 72%)`;
    ctx.fillRect(x, canvas.height - peaks[i] - 3, barWidth, 2);
  }

  // subtle full-canvas beat flash
  if (beatPulse > 0.08) {
    ctx.fillStyle = `rgba(255,255,255,${beatPulse * 0.08})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function startVisualizer() {
  setupAudio();

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (!animationId) {
    draw();
  }
}

audio.addEventListener("play", startVisualizer);
audio.addEventListener("pause", () => {
  cancelAnimationFrame(animationId);
  animationId = null;
});
audio.addEventListener("ended", () => {
  cancelAnimationFrame(animationId);
  animationId = null;
});
