const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let source;
let analyser;
let dataArray;

const BARS = 48;

let smooth = new Array(BARS).fill(0);

let volumeHistory = [];
let pulse = 0;

function setup(){

audioCtx = new AudioContext();

source = audioCtx.createMediaElementSource(audio);

analyser = audioCtx.createAnalyser();

analyser.fftSize = 1024;

source.connect(analyser);

analyser.connect(audioCtx.destination);

dataArray = new Uint8Array(analyser.frequencyBinCount);

}

function getVolume(){

let sum = 0;

for(let i=0;i<dataArray.length;i++){

sum += dataArray[i];

}

let avg = sum/dataArray.length;

volumeHistory.push(avg);

if(volumeHistory.length>40){

volumeHistory.shift();

}

let historyAvg =
volumeHistory.reduce((a,b)=>a+b,0)
/volumeHistory.length;

if(avg > historyAvg*1.3){

pulse = 1;

}else{

pulse *= .88;

}

return avg;

}

function draw(){

requestAnimationFrame(draw);

analyser.getByteFrequencyData(dataArray);

let volume = getVolume();

ctx.fillStyle="#050510";

ctx.fillRect(0,0,canvas.width,canvas.height);

let barWidth = canvas.width/BARS;

for(let i=0;i<BARS;i++){

let index = Math.floor(i*dataArray.length/BARS);

let value = dataArray[index];

/* remove baseline noise */
value = Math.max(0, value - 40);

/* compress bass so it doesn't dominate */
value = Math.pow(value/255,1.5) * 255;

/* volume drives jump */
value *= 1 + pulse*2;

/* smoothing */
smooth[i] =
Math.max(value,smooth[i]*0.82);

let height = smooth[i]*0.7;

/* extra volume lift */
height += volume*0.3*pulse;

let x=i*barWidth;

let hue =
(i/BARS)*360 +
performance.now()*0.04;

ctx.fillStyle=
`hsl(${hue%360},100%,55%)`;

ctx.fillRect(

x,

canvas.height-height,

barWidth-3,

height

);

}

}

audio.onplay=()=>{

if(!audioCtx){

setup();

}

audioCtx.resume();

draw();

}
