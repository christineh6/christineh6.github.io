const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let analyser;
let source;

let freqData;

const BARS = 64;

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
analyser.smoothingTimeConstant=.75;

source.connect(analyser);
analyser.connect(audioCtx.destination);

freqData=
new Uint8Array(analyser.frequencyBinCount);

}

function detectKick(){

let bass=0;

for(let i=2;i<18;i++){

bass+=freqData[i];

}

bass/=16;

/* remove constant bass */
bass=Math.max(0,bass-50);

bassHistory.push(bass);

if(bassHistory.length>45){

bassHistory.shift();

}

let avg=
bassHistory.reduce((a,b)=>a+b,0)
/bassHistory.length;

/* kick trigger */
if(bass>avg*1.35 && bass>45){

kick=1;

}

/* smooth decay */
kick*=0.90;

}

function getBand(i){

/* logarithmic bands */
let start=
Math.floor(
Math.pow(i/BARS,1.7)
*freqData.length
);

let end=
Math.floor(
Math.pow((i+1)/BARS,1.7)
*freqData.length
);

let sum=0;
let count=0;

for(let j=start;j<end;j++){

sum+=freqData[j];
count++;

}

let value=sum/count;

/* remove noise floor */
value=Math.max(0,value-25);

/* normalize */
value=value*1.3;

/* compression */
value=Math.pow(value/255,1.2)*255;

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

/* DRUM BLEND (not override) */
let drumBoost=
1+(kick*.9*Math.max(0,1-i/20));

value=value*drumBoost;

/* smoothing physics */
if(value>smooth[i]){

smooth[i]+=
(value-smooth[i])*0.55;

}else{

smooth[i]+=
(value-smooth[i])*0.08;

}

/* baseline removal */
let height=
Math.max(0,smooth[i]-4)
*1.6;

/* rainbow */
let hue=
(i/BARS)*360+
performance.now()*0.04;

ctx.fillStyle=
`hsl(${hue%360},100%,60%)`;

ctx.fillRect(

i*barWidth,

canvas.height-height,

barWidth-2,

height

);

}

/* subtle kick pulse */
if(kick>0.1){

ctx.fillStyle=
`rgba(255,255,255,${
kick*.05
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
