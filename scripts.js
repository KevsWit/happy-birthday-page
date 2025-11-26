const PI2 = Math.PI * 2
const random = (min, max) => Math.trunc(Math.random() * (max - min + 1) + min)
const timestamp = _ => Date.now()

class Birthday {
  constructor() {
    this.resize()
    this.fireworks = []
    this.counter = 0
  }
  
  resize() {
    this.width = canvas.width = window.innerWidth
    let center = Math.trunc(this.width / 2)
    this.spawnA = Math.trunc(center - center / 4)
    this.spawnB = Math.trunc(center + center / 4)
    
    this.height = canvas.height = window.innerHeight
    this.spawnC = this.height * .1
    this.spawnD = this.height * .5
    
  }
  
  onClick(evt) {
     let x = evt.clientX || evt.touches?.[0]?.pageX
     let y = evt.clientY || evt.touches?.[0]?.pageY
     
     let count = random(3,5)
     for(let i = 0; i < count; i++) this.fireworks.push(new Firework(
        random(this.spawnA, this.spawnB),
        this.height,
        x,
        y,
        random(0, 260),
        random(30, 110)))
          
     this.counter = -1
     
  }
  
  update(delta) {
    this.fadeBackground(delta)
    this.drawFireworks(delta)
    this.maybeSpawn(delta)
    this.trimFireworks()
  }

  fadeBackground(delta) {
    ctx.globalCompositeOperation = 'hard-light'
    ctx.fillStyle = `rgba(20,20,20,${ 7 * delta })`
    ctx.fillRect(0, 0, this.width, this.height)
  }

  drawFireworks(delta) {
    ctx.globalCompositeOperation = 'lighter'
    for (let firework of this.fireworks) {
      firework.update(delta)
    }
  }

  maybeSpawn(delta) {
    this.counter += delta * 3
    if (this.counter < 1) return

    this.fireworks.push(new Firework(
      random(this.spawnA, this.spawnB),
      this.height,
      random(0, this.width),
      random(this.spawnC, this.spawnD),
      random(0, 360),
      random(30, 110)))
    this.counter = 0
  }

  trimFireworks() {
    if (this.fireworks.length > 1000) {
      this.fireworks = this.fireworks.filter(firework => !firework.dead)
    }
  }
}

class Firework {
  dead = false
  madeChilds = false
  history = []

  constructor(x, y, targetX, targetY, shade, offsprings) {
    this.offsprings = offsprings

    this.x = x
    this.y = y
    this.targetX = targetX
    this.targetY = targetY

    this.shade = shade
  }
  update(delta) {
    if (this.dead) return

    let xDiff = this.targetX - this.x
    let yDiff = this.targetY - this.y
    if (Math.abs(xDiff) > 3 || Math.abs(yDiff) > 3) {
      this.x += xDiff * 2 * delta
      this.y += yDiff * 2 * delta

      this.history.push({
        x: this.x,
        y: this.y
      })

      if (this.history.length > 20) this.history.shift()

    } else {
      if (this.offsprings && !this.madeChilds) {
        
        let babies = this.offsprings / 2
        for (let i = 0; i < babies; i++) {
          let targetX = Math.trunc(this.x + this.offsprings * Math.cos(PI2 * i / babies))
          let targetY = Math.trunc(this.y + this.offsprings * Math.sin(PI2 * i / babies))

          birthday.fireworks.push(new Firework(this.x, this.y, targetX, targetY, this.shade, 0))

        }

      }
      this.madeChilds = true
      this.history.shift()
    }
    
    if (this.history.length === 0) this.dead = true
    else if (this.offsprings) { 
        for (let i = 0; this.history.length > i; i++) {
          let point = this.history[i]
          ctx.beginPath()
          ctx.fillStyle = 'hsl(' + this.shade + ',100%,' + i + '%)'
          ctx.arc(point.x, point.y, 1, 0, PI2, false)
          ctx.fill()
        } 
      } else {
      ctx.beginPath()
      ctx.fillStyle = 'hsl(' + this.shade + ',100%,50%)'
      ctx.arc(this.x, this.y, 1, 0, PI2, false)
      ctx.fill()
    }

  }
}

let canvas = document.getElementById('birthday')
let ctx = canvas.getContext('2d')

let then = timestamp()

let birthday = new Birthday()
window.onresize = () => birthday.resize()
document.onclick = evt => birthday.onClick(evt)
document.ontouchstart = evt => birthday.onClick(evt)

;(function loop(){
  requestAnimationFrame(loop)

  let now = timestamp()
  let delta = now - then

  then = now
  birthday.update(delta / 1000)

})()

function initHeartsOverlay() {
  const container = document.querySelector('.image-container');
  const heartCanvas = document.getElementById('hearts');
  if (!container || !heartCanvas) return;

  const heartCtx = heartCanvas.getContext('2d');
  let hearts = [];
  let last = Date.now();
  let spawnBudget = 0;
  let dpr = globalThis.devicePixelRatio || 1;

  const resizeHeartCanvas = () => {
    const rect = container.getBoundingClientRect();
    dpr = globalThis.devicePixelRatio || 1;
    heartCanvas.width = rect.width * dpr;
    heartCanvas.height = rect.height * dpr;
    heartCanvas.style.width = `${rect.width}px`;
    heartCanvas.style.height = `${rect.height}px`;
    heartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawHeart = (heart) => {
    heartCtx.save();
    heartCtx.translate(heart.x, heart.y);
    heartCtx.scale(heart.size, heart.size);
    heartCtx.rotate(heart.angle);
    heartCtx.beginPath();
    heartCtx.moveTo(0, -0.5);
    heartCtx.bezierCurveTo(0, -0.5, -0.5, -0.9, -1, -0.3);
    heartCtx.bezierCurveTo(-1, 0.4, 0, 0.9, 0, 1.2);
    heartCtx.bezierCurveTo(0, 0.9, 1, 0.4, 1, -0.3);
    heartCtx.bezierCurveTo(0.5, -0.9, 0, -0.5, 0, -0.5);
    heartCtx.fillStyle = `rgba(255, 105, 180, ${heart.alpha})`;
    heartCtx.fill();
    heartCtx.restore();
  };

  const spawnHeart = () => {
    hearts.push({
      x: Math.random() * (heartCanvas.width / dpr),
      y: (heartCanvas.height / dpr) + 18,
      size: Math.random() * 8 + 8, // 8px - 16px aprox
      speed: Math.random() * 40 + 50,
      drift: Math.random() * 40 - 20,
      alpha: 1,
      angle: Math.random() * Math.PI,
      spin: Math.random() * 1.2 - 0.6
    });
  };

  const loopHearts = () => {
    const now = Date.now();
    const delta = (now - last) / 1000;
    last = now;

    spawnBudget += delta * 14;
    while (spawnBudget >= 1) {
      spawnHeart();
      spawnBudget -= 1;
    }

    heartCtx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);

    hearts = hearts.filter((heart) => heart.alpha > 0 && heart.y + heart.size > -10);
    for (const heart of hearts) {
      heart.y -= heart.speed * delta;
      heart.x += heart.drift * delta;
      heart.alpha -= delta * 0.25;
      heart.angle += heart.spin * delta;
      drawHeart(heart);
    }

    globalThis.requestAnimationFrame(loopHearts);
  };

  const img = container.querySelector('img');
  if (img && !img.complete) {
    img.addEventListener('load', resizeHeartCanvas);
  } else {
    resizeHeartCanvas();
  }
  globalThis.addEventListener('resize', resizeHeartCanvas);
  new ResizeObserver(resizeHeartCanvas).observe(container);
  resizeHeartCanvas();
  globalThis.requestAnimationFrame(() => resizeHeartCanvas());
  for (let i = 0; i < 10; i++) spawnHeart();
  loopHearts();
}

function initFloppyBird() {
  const gamingButton = document.getElementById('gaming-toggle');
  const gamingFrame = document.getElementById('gaming-frame');
  const closeButton = document.getElementById('gaming-close');
  const bestScoreEl = document.getElementById('bestScore');
  const currentScoreEl = document.getElementById('currentScore');
  const floppyCanvas = document.getElementById('floppy-canvas');

  if (!gamingButton || !gamingFrame || !floppyCanvas) return;

  const floppyCtx = floppyCanvas.getContext('2d');
  const sprite = new Image();
  sprite.src = './assets/flappy-bird-set.png';

  let gamePlaying = false;
  const gravity = 0.5;
  const speed = 6.2;
  const size = [51, 36];
  const jump = -11.5;
  const cTenth = floppyCanvas.width / 10;

  let index = 0;
  let bestScore = 0;
  let flight = jump;
  let flyHeight = (floppyCanvas.height / 2) - (size[1] / 2);
  let currentScore = 0;
  let pipes = [];

  const pipeWidth = 78;
  const pipeGap = 270;
  const pipeLoc = () => (Math.random() * ((floppyCanvas.height - (pipeGap + pipeWidth)) - pipeWidth)) + pipeWidth;

  const setScores = () => {
    if (bestScoreEl) bestScoreEl.textContent = `Mejor : ${bestScore}`;
    if (currentScoreEl) currentScoreEl.textContent = `Actual : ${currentScore}`;
  };

  const setupGame = () => {
    currentScore = 0;
    flight = jump;
    flyHeight = (floppyCanvas.height / 2) - (size[1] / 2);
    pipes = new Array(3).fill(null).map((_, i) => [floppyCanvas.width + (i * (pipeGap + pipeWidth)), pipeLoc()]);
    setScores();
  };

  const render = () => {
    index += 1;

    floppyCtx.drawImage(
      sprite,
      0,
      0,
      floppyCanvas.width,
      floppyCanvas.height,
      -((index * (speed / 2)) % floppyCanvas.width) + floppyCanvas.width,
      0,
      floppyCanvas.width,
      floppyCanvas.height
    );
    floppyCtx.drawImage(
      sprite,
      0,
      0,
      floppyCanvas.width,
      floppyCanvas.height,
      -((index * (speed / 2)) % floppyCanvas.width),
      0,
      floppyCanvas.width,
      floppyCanvas.height
    );

    if (gamePlaying) {
      for (const pipe of pipes) {
        pipe[0] -= speed;

        floppyCtx.drawImage(
          sprite,
          432,
          588 - pipe[1],
          pipeWidth,
          pipe[1],
          pipe[0],
          0,
          pipeWidth,
          pipe[1]
        );
        floppyCtx.drawImage(
          sprite,
          432 + pipeWidth,
          108,
          pipeWidth,
          floppyCanvas.height - pipe[1] + pipeGap,
          pipe[0],
          pipe[1] + pipeGap,
          pipeWidth,
          floppyCanvas.height - pipe[1] + pipeGap
        );

        if (pipe[0] <= -pipeWidth) {
          currentScore += 1;
          bestScore = Math.max(bestScore, currentScore);
          const lastX = pipes.at(-1)[0];
          pipes = [...pipes.slice(1), [lastX + pipeGap + pipeWidth, pipeLoc()]];
        }

        const hitPipe = [
          pipe[0] <= cTenth + size[0],
          pipe[0] + pipeWidth >= cTenth,
          pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1]
        ].every(Boolean);

        if (hitPipe) {
          gamePlaying = false;
          setupGame();
        }
      }
    }

    if (gamePlaying) {
      floppyCtx.drawImage(
        sprite,
        432,
        Math.floor((index % 9) / 3) * size[1],
        ...size,
        cTenth,
        flyHeight,
        ...size
      );
      flight += gravity;
      flyHeight = Math.min(flyHeight + flight, floppyCanvas.height - size[1]);
    } else {
      floppyCtx.drawImage(
        sprite,
        432,
        Math.floor((index % 9) / 3) * size[1],
        ...size,
        (floppyCanvas.width / 2) - size[0] / 2,
        flyHeight,
        ...size
      );
      flyHeight = (floppyCanvas.height / 2) - (size[1] / 2);
      floppyCtx.fillStyle = '#ffffff';
      floppyCtx.font = 'bold 20px "Press Start 2P", courier';
      const bestText = `Mejor puntaje : ${bestScore}`;
      const playText = 'Haz click para jugar';
      const centerX = floppyCanvas.width / 2;
      floppyCtx.fillText(bestText, centerX - floppyCtx.measureText(bestText).width / 2, 245);
      floppyCtx.fillText(playText, centerX - floppyCtx.measureText(playText).width / 2, 535);
    }

    setScores();
    globalThis.requestAnimationFrame(render);
  };

  sprite.onload = () => {
    setupGame();
    render();
  };

  const toggleGameFrame = (open) => {
    gamingFrame.classList.toggle('open', open);
    gamingFrame.style.display = open ? 'flex' : 'none';
    if (!open) {
      gamePlaying = false;
      setupGame();
    }
  };

  gamingButton.addEventListener('click', (evt) => {
    evt.stopPropagation();
    toggleGameFrame(true);
  });
  if (closeButton) {
    closeButton.addEventListener('click', (evt) => {
      evt.stopPropagation();
      toggleGameFrame(false);
    });
  }

  floppyCanvas.addEventListener('click', () => {
    if (!gamingFrame.classList.contains('open')) return;
    gamePlaying = true;
    flight = jump;
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.code === 'Space' && gamingFrame.classList.contains('open')) {
      gamePlaying = true;
      flight = jump;
    }
  });
}

initFloppyBird();
globalThis.addEventListener('load', initHeartsOverlay);
