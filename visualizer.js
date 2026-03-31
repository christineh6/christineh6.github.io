const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let analyser;
let source;

let dataArray;

const BARS = 48;

let smooth = new Array(BARS).fill(0);

let bassHistory=[];

let kick=0;

function setup(){

audioCtx=new AudioContext();

source=
audioCtx.createMediaElementSource(audio);

analyser=
audioCtx.createAnalyser();

analyser.fftSize=2048;

source.connect(analyser);

analyser.connect(audioCtx.destination);

dataArray=
new Uint8Array(
analyser.frequencyBinCount
);

}

/* kick detection */
function detectKick(){

let bass=0;

for(let i=2;i<22;i++){

bass+=dataArray[i];

}

bass/=20;

/* remove baseline */
bass=Math.max(0,bass-45);

bassHistory.push(bass);

if(bassHistory.length>40){

bassHistory.shift();

}

let avg=
bassHistory.reduce((a,b)=>a+b,0)
/bassHistory.length;

if(bass>avg*1.5 && bass>55){

kick=1;

}

kick*=0.88;

}

/* frequency band */
function getBand(i){

let start=
Math.floor(
Math.pow(i/BARS,2)
*dataArray.length
);

let end=
Math.floor(
Math.pow((i+1)/BARS,2)
*dataArray.length
);

let sum=0;
let count=0;

for(let j=start;j<end;j++){

sum+=dataArray[j];

count++;

}

let value=sum/count;

/* remove constant noise */
value=Math.max(0,value-30);

/* compress */
value=Math.pow(value/255,1.4)*255;

return value;

}

function draw(){

requestAnimationFrame(draw);

analyser.getByteFrequencyData(dataArray);

detectKick();

ctx.fillStyle="#050510";

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
);

let barWidth=
canvas.width/BARS;

for(let i=0;i<BARS;i++){

let value=getBand(i);

/* drum impact */
let drumBoost=
1+kick*2.2*
Math.max(0,1-i/18);

value*=drumBoost;

/* smoothing */
smooth[i]=
Math.max(
value,
smooth[i]*0.82
);

let height=
Math.max(0,smooth[i]-5)
*1.5;

/* rainbow */
let hue=
(i/BARS)*360+
performance.now()*0.05;

ctx.fillStyle=
`hsl(${hue%360},100%,58%)`;

ctx.fillRect(

i*barWidth,

canvas.height-height,

barWidth-3,

height

);

}

/* kick flash */
if(kick>0.05){

ctx.fillStyle=
`rgba(255,255,255,${
kick*0.08
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
