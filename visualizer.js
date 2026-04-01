const audio = document.getElementById("video");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let analyser;
let source;

let freqData;

const BANDS = [
{freq:32,gain:0},
{freq:64,gain:0},
{freq:125,gain:1},
{freq:250,gain:1},
{freq:500,gain:0},
{freq:1000,gain:2},
{freq:2000,gain:0},
{freq:4000,gain:4},
{freq:8000,gain:3},
{freq:16000,gain:3}
];

let bars = new Array(BANDS.length).fill(0);

let kick=0;
let bassHistory=[];

function setup(){

audioCtx=new AudioContext();

source=
audioCtx.createMediaElementSource(audio);

analyser=
audioCtx.createAnalyser();

analyser.fftSize=2048;
analyser.smoothingTimeConstant=.55;

source.connect(analyser);
analyser.connect(audioCtx.destination);

freqData=
new Uint8Array(analyser.frequencyBinCount);

}

/* convert freq to fft index */
function freqToIndex(freq){

let nyquist=
audioCtx.sampleRate/2;

return Math.round(
(freq/nyquist)*freqData.length
);

}

function getBand(freq){

let index=freqToIndex(freq);

let value=freqData[index]||0;

value=Math.max(0,value-20);

return value;

}

/* kick detection */
function detectKick(){

let bass=
(getBand(32)+getBand(64))/2;

bassHistory.push(bass);

if(bassHistory.length>30){

bassHistory.shift();

}

let avg=
bassHistory.reduce((a,b)=>a+b,0)
/bassHistory.length;

if(bass>avg*1.3 && bass>45){

kick=1;

}

kick*=0.9;

}

function draw(){

requestAnimationFrame(draw);

analyser.getByteFrequencyData(freqData);

detectKick();

ctx.fillStyle="#050510";

ctx.fillRect(0,0,canvas.width,canvas.height);

let barWidth=
canvas.width/BANDS.length;

for(let i=0;i<BANDS.length;i++){

let band=BANDS[i];

let value=
getBand(band.freq);

/* apply your EQ gain */
value*=1+(band.gain*.12);

/* drum boost */
value*=1+(kick*.8);

/* attack/release */
if(value>bars[i]){

bars[i]+=
(value-bars[i])*.7;

}else{

bars[i]*=.75;

}

let height=
Math.max(0,bars[i]-5)
*2;

/* rainbow */
let hue=
(i/BANDS.length)*360+
performance.now()*0.04;

ctx.fillStyle=
`hsl(${hue%360},100%,60%)`;

ctx.fillRect(

i*barWidth,

canvas.height-height,

barWidth-8,

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
