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


//ajax send
const xhr = new XMLHttpRequest();
const ac = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = ac[ac.createGain?'createGain':'createGainNode']();
gainNode.connect(ac.destination);

const analyser = ac.createAnalyser();
const size = 128;
analyser.fftSize = size * 2;
analyser.connect(gainNode);

let source = null ;

let count = 0;

const box = $('#box')[0];
let height,width;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
box.appendChild(canvas);

function resize() {
  height = box.clientHeight * 0.99;
  width = box.clientWidth* 0.99;
  canvas.height = height ;
  canvas.width = width ;
  let line = ctx.createLinearGradient(0, 0, 0, height);
  line.addColorStop(0, 'red');
  line.addColorStop(0.5, 'yellow');
  line.addColorStop(1, 'green');
  ctx.fillStyle = line;
}
resize();

window.onresize = resize;

function draw (arr) {
  ctx.clearRect(0, 0, width, height);
  let w = width / size;
  for(var i = 0; i< size; i++) {
    let h = arr[i] / 256 * height;
    // console.log(i);
    ctx.fillRect(w * i, height - h, w * 0.6, h);
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
    console.log(xhr.response);
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
    // console.log(arr);
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
