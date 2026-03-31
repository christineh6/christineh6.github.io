const audio = document.getElementById("audio")

const canvas = document.getElementById("visualizer")

const ctx = canvas.getContext("2d")

const audioCtx = new AudioContext()

const source = audioCtx.createMediaElementSource(audio)

const analyser = audioCtx.createAnalyser()

source.connect(analyser)

analyser.connect(audioCtx.destination)

analyser.fftSize = 256

const bufferLength = analyser.frequencyBinCount

const dataArray = new Uint8Array(bufferLength)

const barWidth = canvas.width / bufferLength

function draw(){

requestAnimationFrame(draw)

analyser.getByteFrequencyData(dataArray)

ctx.fillStyle = "#111"

ctx.fillRect(0,0,canvas.width,canvas.height)

let x = 0

for(let i=0;i<bufferLength;i++){

let barHeight = dataArray[i] * 0.6

ctx.fillStyle = "rgb(0,255,150)"

ctx.fillRect(
x,
canvas.height - barHeight,
barWidth - 2,
barHeight
)

x += barWidth

}

}

audio.onplay = () => {

audioCtx.resume()

draw()

}
