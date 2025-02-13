const video = document.getElementById('video')
const sampler = document.querySelector('.start-sampling');
let watchState = true;
let cooldowntime = false;
const targetElement = document.querySelector('#video');
let dominantExpression = 'starter';

const emoji = {
  'neutral': '😇 CALM',
  'happy': '😊 JOY',
  'surprised': '😮 SURPRISED',
  'sad': '😭 SAD',
  'angry': '😤 ANGRY',
}
const note = {
  'neutral': "Wow! Been a while seeing a calm face! <br> Now playing Old Hits and groovy melodies for you to vibe",
  'happy': "You look so happy! <br> Lets Elevate your mood ++",
  'surprised': "Want a surprise? <br> Now playing a catchy groovy song from our playlist",
  'sad': "Buckle up soldier! Don't be sad! <br> Life is not yet over",
  'angry': "Ooh! You look angry.. Being happy is still a choice... <br> Now playing calming classical songs and ambient sounds!",
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/static/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/static/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/static/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.querySelector('#video-container').append(canvas);
  
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  sampler.style.display = 'none';

  setInterval(async () => {
    if (watchState == true && cooldowntime == false) {
      // Detect the face with expressions
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      
      if (detections) {
        // Resize the detections to match the video dimensions
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear the canvas before drawing new detections
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // Get the face expression with the highest probability
        const expression = detections.expressions;
        setDominantEmotion(expression);
        const confidence = (expression[dominantExpression] * 100).toFixed(1); // Confidence in percentage

        // Draw a box around the face
        const box = resizedDetections.detection.box;
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';  // Green box around the face
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Display the current emotion and its confidence inside the box
        if (dominantExpression == 'disgusted'){
          dominantExpression = 'sad'
        }
        if (dominantExpression == 'fearful'){
          dominantExpression = 'sad'
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.font = '16px open sans';
        ctx.fillText(`${emoji[dominantExpression]} : ${confidence}%`, box.x + 10, box.y + 20);
      }
    }
  }, 100);
});



//Intersection Observer

// Function to handle element visibility changes
function handleIntersection(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Element is in view
      watchState = true;
      console.log('Element is in view:', watchState);
    } else {
      // Element is out of view
      watchState = false;
      console.log('Element is out of view:', watchState);
    }
  });
}

// Create an IntersectionObserver instance
const observer = new IntersectionObserver(handleIntersection, {
  root: null, // Observe the viewport
  threshold: 0.3 // Trigger when 10% of the element is visible
});

// Start observing the target element
observer.observe(targetElement);


//button click cooldown
function cooldown(){
  cooldowntime=true;
  const cool = setTimeout(function(){cooldowntime=false; if(video.paused){video.play();}},5e3);
}

//pick dominant emotion
function setDominantEmotion(expressions) {
  dominantExpression= Object.keys(expressions).reduce((maxEmotion, currentEmotion) => 
    expressions[currentEmotion] > expressions[maxEmotion] ? currentEmotion : maxEmotion
  );
}

function recommend(){
  cooldown();
  fetchSongOnEmotion(dominantExpression);
  video.pause();
  document.querySelector('#recommendation-note').innerHTML = note[dominantExpression];
}