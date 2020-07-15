// The face detection does not work on all browsers and operating systems.
// If you are getting a `Face detection service unavailable` error or similar,
// it's possible that it won't work for you at the moment.

// Obtiene los elementos de face.html
// Elemento video
const video = document.querySelector(`.webcam`);
// Elementos del canvas
const canvas = document.querySelector(`.video`);
const ctx = canvas.getContext(`2d`);
// Elementos  del canvas especial para la deteccion del video
const faceCanvas = document.querySelector(`.face`);
const faceCtx = faceCanvas.getContext(`2d`);
// Utilizamos libreria FaceDetector
const faceDetector = new window.FaceDetector({ fastMode: true });
// Constantes para hacer dinamica la aplicacion
const optionsInputs = document.querySelectorAll(
  `.controls input[type="range"]`
);

const options = {
  SIZE: 10,
  SCALE: 1.35,
};

function handleOption(event) {
  const { value, name } = event.currentTarget;
  options[name] = parseFloat(value);
}
optionsInputs.forEach(input => input.addEventListener(`input`, handleOption));

// Escribir una funcion que "poblara" al objeto video con el stream del navegador
async function populateVideo() {
  // obtiene el canal de video del navegador del usuario
  // genera una promesa que permite esperar un "flujo"
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
  });
  video.srcObject = stream;
  await video.play();
  // Poner el tamaño de los canvas al mismo tamaño de la ventana del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  faceCanvas.width = video.videoWidth;
  faceCanvas.height = video.videoHeight;
}
// Funcion que censura la cara del usuario
// notar la forma de destructurar el parametro entrarte y asignale un nuevo nombre
// Forma de censurar:: hacer un zoom  en la cara de la persona, para modifcar la calidad de los pixeles y retornar esa imagen

function censurar({ boundingBox: face }) {
  faceCtx.imageSmoothingEnabled = false;
  faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  // dibujar la cara pequena
  faceCtx.drawImage(
    // 5 argumentos de parametros
    video, // de donde viene la fuente?
    face.x, // de dónde comenzamos a extraer la fuente?
    face.y,
    face.width,
    face.height,
    // 4 argumentos de dibujo
    face.x, // donde comenzamos a realizar el dibujo (punto inicial, punto final)
    face.y,
    options.SIZE, // El tamano de la imagen en pixeles que vamos a distor
    options.SIZE
  );
  // Crea un par de variables para acomodar la escalaoptions.
  const width = face.width * options.SCALE;
  const height = face.height * options.SCALE;
  // Tomar la cara pequena devuelta y dibujarla devuelta al tamano normal
  faceCtx.drawImage(
    faceCanvas, // de donde viene la fuente?
    face.x, // de dónde comenzamos a extraer la fuente?
    face.y,
    options.SIZE,
    options.SIZE,
    // Dibujando los argumentos
    face.x - (width - face.width) / 2,
    face.y - (height - face.height) / 2,
    width,
    height
  );
}

// Dibuja el rectangulo que se forma alrededor de la cara y pixela todo su contenido
function drawFace(face) {
  const { width, height, top, left } = face.boundingBox;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `#ffc600`;
  ctx.linewidth = 2;
  ctx.strokeRect(left, top, width, height);
}

// Detecta la cara de la persona para censurarla
async function detect() {
  const faces = await faceDetector.detect(video);
  // Preguntarle al navegador en que intervalo de tiempo es buena idea crear el frame, y correrlo
  // Notar el uso de recursion here jaja
  faces.forEach(drawFace);
  faces.forEach(censurar);
  requestAnimationFrame(detect);
}

// Usamos el then porque son asincronos y necesitamos que la funcion corra justo
// despues de que sa haya iniciado el video
populateVideo().then(detect);
