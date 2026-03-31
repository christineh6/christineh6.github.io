const audio = document.getElementById("audio")

const canvas = document.getElementById("visualizer")

const ctx = canvas.getContext("2d")

const audioCtx = new AudioContext()

const source = audioCtx.createMediaElementSource(audio)

const analyser = audioCtx.createAnalyser()

source.connect(analyser)

analyser.connect(audioCtx.destination)

analyser.fftSize = 2048

const bufferLength = analyser.frequencyBinCount

const dataArray = new Uint8Array(bufferLength)

const bars = 64

const barWidth = canvas.width / bars

let smooth = new Array(bars).fill(0)

let hueOffset = 0

function draw(){

requestAnimationFrame(draw)

analyser.getByteFrequencyData(dataArray)

ctx.fillStyle = "#050505"

ctx.fillRect(0,0,canvas.width,canvas.height)

let step = Math.floor(bufferLength / bars)

for(let i=0;i<bars;i++){

let sum = 0

for(let j=0;j<step;j++){

sum += dataArray[(i*step)+j]

}

let value = sum/step

/* bass boost */
value *= 1 + (i < 10 ? 1.8 : 1)

/* smoothing */
smooth[i] = Math.max(value, smooth[i]*0.82)

let height = smooth[i]*0.75

let x = i * barWidth

/* rainbow color */
let hue = (i*6 + hueOffset) % 360

ctx.fillStyle = `hsl(${hue}, 100%, 50%)`

ctx.fillRect(
x,
canvas.height-height,
barWidth-3,
height
)

}

/* slowly rotate rainbow */
hueOffset += 0.5

}

audio.onplay = () => {

audioCtx.resume()

draw()

}
