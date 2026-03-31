const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let analyser;
let source;

let freqData;

const BARS = 96;

let smooth = new Array(BARS).fill(0);

let bassHistory=[];
let kick=0;

function setup(){

audioCtx=new AudioContext();

source=
audioCtx.createMediaElementSource(audio);

analyser=
audioCtx.createAnalyser();

/* less smoothing from analyser */
analyser.fftSize=2048;
analyser.smoothingTimeConstant=.35;

source.connect(analyser);
analyser.connect(audioCtx.destination);

freqData=
new Uint8Array(analyser.frequencyBinCount);

}

/* drum detection */
function detectKick(){

let bass=0;

for(let i=2;i<18;i++){

bass+=freqData[i];

}

bass/=16;

/* remove constant bass */
bass=Math.max(0,bass-45);

bassHistory.push(bass);

if(bassHistory.length>45){

bassHistory.shift();

}

let avg=
bassHistory.reduce((a,b)=>a+b,0)
/bassHistory.length;

if(bass>avg*1.35 && bass>40){

kick=1;

}

kick*=0.88;

}

/* narrow band sampling (fixes hills) */
function getBand(i){

let index=
Math.floor(
Math.pow(i/BARS,1.4)
*freqData.length
);

let value=freqData[index];

/* remove noise floor */
value=Math.max(0,value-18);

/* slight compression */
value=Math.pow(value/255,1.1)*255;

return value;

}

function draw(){

requestAnimationFrame(draw);

analyser.getByteFrequencyData(freqData);

detectKick();

ctx.fillStyle="#040408";

ctx.fillRect(0,0,canvas.width,canvas.height);

let barWidth=canvas.width/BARS;

for(let i=0;i<BARS;i++){

let value=getBand(i);

/* drum boost but not overpower */
let drumBoost=
1+(kick*.6*Math.max(0,1-i/24));

value*=drumBoost;

/* small natural variation */
value*=1+(Math.random()*0.06);

/* fast attack / fast decay */
if(value>smooth[i]){

smooth[i]+=(value-smooth[i])*0.85;

}else{

smooth[i]*=0.65;

}

/* remove baseline */
let height=
Math.max(0,smooth[i]-3)
*1.7;

/* rainbow */
let hue=
(i/BARS)*360+
performance.now()*0.04;

ctx.fillStyle=
`hsl(${hue%360},100%,60%)`;

ctx.fillRect(

i*barWidth,

canvas.height-height,

barWidth-1,

height

);

}

/* subtle kick flash */
if(kick>0.15){

ctx.fillStyle=
`rgba(255,255,255,${
kick*.04
})`;

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
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
