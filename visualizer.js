const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let analyser;
let source;

let freqData;
let timeData;

const BARS = 40;

let envelope = 0;
let smoothed = new Array(BARS).fill(0);

let energyHistory = [];

let kickEnergy = 0;

function setup(){

audioCtx = new AudioContext();

source =
audioCtx.createMediaElementSource(audio);

analyser =
audioCtx.createAnalyser();

analyser.fftSize = 2048;

source.connect(analyser);

analyser.connect(audioCtx.destination);

freqData =
new Uint8Array(analyser.frequencyBinCount);

timeData =
new Uint8Array(analyser.fftSize);

}

/* isolate kick energy */
function getKickEnergy(){

analyser.getByteFrequencyData(freqData);

let sum=0;

/* kick zone */
for(let i=2;i<18;i++){

sum+=freqData[i];

}

let energy=sum/16;

/* remove constant bass */
energy=Math.max(0,energy-45);

/* compression */
energy=Math.pow(energy/255,1.7)*255;

energyHistory.push(energy);

if(energyHistory.length>40){

energyHistory.shift();

}

let avg=
energyHistory.reduce((a,b)=>a+b,0)
/energyHistory.length;

/* transient detection */
if(energy>avg*1.6 && energy>50){

kickEnergy=1;

}

/* decay */
kickEnergy*=0.87;

return energy;

}

function draw(){

requestAnimationFrame(draw);

let energy=getKickEnergy();

/* envelope follower */
if(energy>envelope){

envelope+=
(energy-envelope)*0.6;

}else{

envelope+=
(energy-envelope)*0.12;

}

ctx.fillStyle="#050510";

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
);

let barWidth=
canvas.width/BARS;

/* impact multiplier */
let impact=
1+kickEnergy*2.5;

for(let i=0;i<BARS;i++){

let value=envelope*impact;

/* small variation across bars */
value*=
0.85+
Math.sin(i*0.4)*0.15;

/* smoothing */
smoothed[i]=
Math.max(
value,
smoothed[i]*0.82
);

let height=
Math.max(
0,
smoothed[i]-8
)*1.6;

/* rainbow */
let hue=
(i/BARS)*360+
performance.now()*0.06;

ctx.fillStyle=
`hsl(${hue%360},100%,60%)`;

ctx.fillRect(

i*barWidth,

canvas.height-height,

barWidth-3,

height

);

}

/* screen pulse on kick */
if(kickEnergy>0.05){

ctx.fillStyle=
`rgba(255,255,255,${
kickEnergy*0.12
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
