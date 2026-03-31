const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx;
let analyser;
let source;

let freqData;

const BARS = 96;

let smooth = new Array(BARS).fill(0);

/* NEW: band normalization */
let bandMemory = new Array(BARS).fill(1);

let bassHistory=[];
let kick=0;

function setup(){

audioCtx=new AudioContext();

source=
audioCtx.createMediaElementSource(audio);

analyser=
audioCtx.createAnalyser();

analyser.fftSize=2048;
analyser.smoothingTimeConstant=.25;

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

bass=Math.max(0,bass-40);

bassHistory.push(bass);

if(bassHistory.length>40){

bassHistory.shift();

}

let avg=
bassHistory.reduce((a,b)=>a+b,0)
/bassHistory.length;

if(bass>avg*1.3 && bass>35){

kick=1;

}

kick*=0.90;

}

function getBand(i){

let index=
Math.floor(
Math.pow(i/BARS,1.3)
*freqData.length
);

let value=freqData[index];

/* remove noise */
value=Math.max(0,value-15);

/* NEW: adaptive normalization */
bandMemory[i]=
bandMemory[i]*0.995+
value*0.005;

/* divide by learned average */
value=value/(bandMemory[i]+1);

/* boost dynamics */
value*=140;

/* compression */
value=Math.pow(value/255,1.15)*255;

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

/* drum influence */
value*=1+(kick*.5*Math.max(0,1-i/28));

/* fast physics */
if(value>smooth[i]){

smooth[i]+=(value-smooth[i])*0.9;

}else{

smooth[i]*=0.6;

}

let height=
Math.max(0,smooth[i]-2)
*1.8;

/* rainbow */
let hue=
(i/BARS)*360+
performance.now()*0.035;

ctx.fillStyle=
`hsl(${hue%360},100%,60%)`;

ctx.fillRect(

i*barWidth,

canvas.height-height,

barWidth-1,

height

);

}

/* kick flash */
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
