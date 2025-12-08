let revealRadius = 180;
let blockSize = 60;
let baseImg, revealImg, staticSound;
let isAudioStarted = false;
let sketchInstance = null;

const sketch = (p) => {
  p.preload = function () {
    baseImg = p.loadImage(
      "/assets/images/cta-base.jpg",
      () => console.log("✓ Base loaded"),
      () => console.warn("✗ Base not found")
    );

    revealImg = p.loadImage(
      "/assets/images/cta-reveal.jpg",
      () => console.log("✓ Reveal loaded"),
      () => console.warn("✗ Reveal not found")
    );
  };

  p.setup = function () {
    const container = document.getElementById("cta-reveal-container");
    if (!container) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const cnv = p.createCanvas(width, height);
    cnv.parent("cta-reveal-container");

    // Generate fallback if images missing
    if (!baseImg || baseImg.width === 0) {
      baseImg = p.createImage(width, height);
      baseImg.loadPixels();
      for (let i = 0; i < baseImg.pixels.length; i += 4) {
        baseImg.pixels[i] = 30;
        baseImg.pixels[i + 1] = 30;
        baseImg.pixels[i + 2] = 30;
        baseImg.pixels[i + 3] = 255;
      }
      baseImg.updatePixels();
    }

    if (!revealImg || revealImg.width === 0) {
      revealImg = p.createImage(width, height);
      revealImg.loadPixels();
      for (let i = 0; i < revealImg.pixels.length; i += 4) {
        revealImg.pixels[i] = 255;
        revealImg.pixels[i + 1] = 107;
        revealImg.pixels[i + 2] = 0;
        revealImg.pixels[i + 3] = 255;
      }
      revealImg.updatePixels();
    }

    p.noStroke();

    if (typeof p5.Noise !== "undefined") {
      try {
        staticSound = new p5.Noise("pink");
        staticSound.start();
        staticSound.amp(0);
      } catch (e) {
        console.warn("Audio unavailable");
      }
    }
  };

  p.draw = function () {
    p.background(20);

    if (baseImg && baseImg.width > 0 && revealImg && revealImg.width > 0) {
      // Draw base image to fill entire canvas
      p.image(baseImg, 0, 0, p.width, p.height);

      if (
        p.mouseX > 0 &&
        p.mouseX < p.width &&
        p.mouseY > 0 &&
        p.mouseY < p.height
      ) {
        runPixelReveal(0, 0, p.width, p.height);
        manageAudio();
      } else {
        if (staticSound) {
          staticSound.amp(0, 0.2);
        }
      }
    } else {
      p.background(20);
    }
  };

  function runPixelReveal(offsetX, offsetY, drawWidth, drawHeight) {
    let startX = p.constrain(
      p.mouseX - revealRadius,
      offsetX,
      offsetX + drawWidth
    );
    let endX = p.constrain(
      p.mouseX + revealRadius,
      offsetX,
      offsetX + drawWidth
    );
    let startY = p.constrain(
      p.mouseY - revealRadius,
      offsetY,
      offsetY + drawHeight
    );
    let endY = p.constrain(
      p.mouseY + revealRadius,
      offsetY,
      offsetY + drawHeight
    );

    startX = startX - (startX % blockSize);
    startY = startY - (startY % blockSize);

    for (let x = startX; x < endX; x += blockSize) {
      for (let y = startY; y < endY; y += blockSize) {
        let distToMouse = p.dist(
          x + blockSize / 2,
          y + blockSize / 2,
          p.mouseX,
          p.mouseY
        );

        if (distToMouse < revealRadius) {
          let imgX = p.map(x, offsetX, offsetX + drawWidth, 0, revealImg.width);
          let imgY = p.map(
            y,
            offsetY,
            offsetY + drawHeight,
            0,
            revealImg.height
          );
          let imgW = p.map(blockSize, 0, drawWidth, 0, revealImg.width);
          let imgH = p.map(blockSize, 0, drawHeight, 0, revealImg.height);

          imgX = p.max(0, p.min(imgX, revealImg.width - imgW));
          imgY = p.max(0, p.min(imgY, revealImg.height - imgH));

          p.image(
            revealImg,
            x,
            y,
            blockSize,
            blockSize,
            imgX,
            imgY,
            imgW,
            imgH
          );
        }
      }
    }
  }

  function manageAudio() {
    if (!isAudioStarted || !staticSound) return;
    let mouseSpeed = p.dist(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
    let targetVol = p.map(mouseSpeed, 0, 100, 0, 0.15, true);
    staticSound.amp(targetVol, 0.1);
  }

  p.mousePressed = function () {
    if (!isAudioStarted) {
      try {
        p.userStartAudio();
        isAudioStarted = true;
      } catch (e) {
        // Audio not available
      }
    }
  };

  p.windowResized = function () {
    const container = document.getElementById("cta-reveal-container");
    if (container) {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  };
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("cta-reveal-container")) {
    sketchInstance = new p5(sketch);
  }
});

window.addEventListener("beforeunload", () => {
  if (sketchInstance) sketchInstance.remove();
  if (staticSound) staticSound.stop();
});
