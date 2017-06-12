function $ (s) {
  return document.querySelectorAll(s);
}

const lis = $('#list li');

for(let i = 0; i<lis.length; i++ ){
  lis[i].onclick = function () {
    for (let j = 0; j<lis.length; j++){
      lis[j].className = '';
    }
    this.className = 'selected';
    load('./media/' + this.title);
  }
}

const types = $('#type li');

for(let i = 0; i<types.length; i++ ){
  types[i].onclick = function () {
    for (let j = 0; j<types.length; j++){
      types[j].className = '';
    }
    this.className = 'selected';
  }
}

//ajax send
const xhr = new XMLHttpRequest();
const ac = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = ac[ac.createGain?'createGain':'createGainNode']();
gainNode.connect(ac.destination);

$('#stopbtn')[0].onclick = function() {
  if(this.className == 'selected'){
    ac.resume();
    this.className = ''
  }else{
    ac.suspend();
    this.className = 'selected'
  }
}

const analyser = ac.createAnalyser();
const size = 128;
//傅立叶变换的基数，即最大值
analyser.fftSize = size * 2;
analyser.connect(gainNode);

let source = null ;

let count = 0;

const box = $('#box')[0];
let height,width;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let arrcap = Array.from({length:size},( () => 0));
box.appendChild(canvas);



const Dots = new Array(size);
const random = (m, n) => {
  return Math.round(Math.random()*(n - m) + m);
}
function newDots() {
  for(let i = 0; i < size; i ++){
    Dots[i] = {x:random(0, width),y:random(0,height),c:'rgba('+random(0,255)+','+random(0,255)+','+random(0,255)+',0)',speed:random(0.1,2)}
  }
}

function resize() {
  height = box.clientHeight;
  width = box.clientWidth;
  canvas.height = height ;
  canvas.width = width;

  newDots();
}
resize();

window.onresize = resize;

function draw (arr) {
  ctx.clearRect(0, 0, width, height);
  const w = width / size;
  const cw = w * 0.6;
  const capH = cw;

  let line = ctx.createLinearGradient(0, 0, 0, height);
  // 255/3 = 85
  const rgbR = 255;
  line.addColorStop(0, 'rgb('+ rgbR +','+ random(0,85) +','+ random(0,85) +')');
  line.addColorStop(0.5, 'rgb('+ rgbR +','+ random(85,170) +','+ random(85,170) +')');
  line.addColorStop(1, 'rgb('+ rgbR +','+ random(170,255) +','+ random(170,255) +')');
  ctx.fillStyle = line;
  for(var i = 0; i< size; i++) {
    let h = arr[i] / (size * 2.2) * height;
    switch($('#type .selected')[0].getAttribute('data-val')){
      case 'bar':
        ctx.fillRect(w * i, height - h, w * 0.6, h);
        let msd = ctx.createRadialGradient(w * (i + 0.5), height-(arrcap[i] + capH), 0, w * i, height - (arrcap[i] + capH), h);
        msd.addColorStop(0,'#fff');
        msd.addColorStop(1,'#ccc');
        ctx.fillStyle = msd;
        ctx.fillRect(w * i, height - (arrcap[i] + capH), cw, capH );
        arrcap[i] --;
        if(arrcap[i] < 0 ){
          arrcap[i] = 0;
        }
        if(arrcap[i] >= 0 && arrcap[i] < h ){
          arrcap[i] = h ;
        }
        break;
      case 'dot':
        let dotcache = Dots[i];
        let r = arr[i] / 256 * 50;
        var radius = ctx.createRadialGradient(Dots[i].x, Dots[i].y, 0, Dots[i].x, Dots[i].y, r);
        radius.addColorStop(0, '#fff');
        radius.addColorStop(1, Dots[i].c);
        ctx.fillStyle = radius;
        ctx.beginPath();
        // ctx.arc(dotcache.x, dotcache.y, r, 0, Math.PI * 2, true);
        dotcache.x = dotcache.x + dotcache.speed;
        if(dotcache.x > width){
          dotcache.x = 0;
        }
        ctx.arc(dotcache.x, dotcache.y, r, 0, Math.PI * 2, true);
        ctx.fill()
        break;
      case 'line':

        if(i == 0) {
          ctx.beginPath();
          ctx.moveTo(0 ,height-1)
        }
        if(i > 0 && i < size - 1){
          ctx.lineTo(w * i, height - arr[i+1] / (size * 2) * height);
          ctx.strokeStyle = "#fff"
          ctx.stroke();
          // ctx.fill()
        }
        if(i == size - 1) {
          ctx.lineTo(width, height-1);
          ctx.lineTo(0,height - 1);
          ctx.fill()
          ctx.closePath();
        }
        break;
    }
  }
}

function load(url){
  let n = ++count;
  source && source[source.stop?'stop':'noteOff']();
  xhr.abort();
  xhr.open('GET', url);
  xhr.responseType = 'arraybuffer';
  xhr.onload = () => {
    if(n != count) return ;
    // console.log(xhr.response);
    ac.decodeAudioData(xhr.response, (buffer) =>{
      if(n != count) return ;
      const bufferSource = ac.createBufferSource();
      bufferSource.buffer = buffer ;
      // bufferSource.connect(ac.destination);
      // bufferSource.connect(gainNode);
      bufferSource.connect(analyser);
      bufferSource[bufferSource.start?'start':'noteOn'](0);
      source = bufferSource;
    },(err) =>{
      console.log(err);
    })
  }
  xhr.send();
}

function visualizer () {
  let arr = new Uint8Array(analyser.frequencyBinCount);
  requestAnimationFrame = window.requestAnimationFrame;

  function v(){
    analyser.getByteFrequencyData(arr);
    draw(arr);
    requestAnimationFrame(v);
  }
  requestAnimationFrame(v);
}

visualizer();


function changeVolume(percent) {
  gainNode.gain.value = percent * percent;
}

$('#volume')[0].onchange = function() {
  changeVolume(this.value / this.max)
}
$('#volume')[0].onchange();
