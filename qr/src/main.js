/*global QRErrorCorrectLevel, QRCode */
(function() {
  window.onload = function() {
    const elemText = document.getElementById('input-text');
    elemText.addEventListener('input', update, false);
    update();

    function update() {
      const inputText = document.getElementById('input-text').value;
      updateQrcode({
        text: inputText,
        width: 300,
        height: 300,
      });

      const cvs = document.getElementById('canvas');
      const png = cvs.toDataURL();
      const elemNewImg = document.getElementById('newImg');
      elemNewImg.setAttribute('src', png);
      elemNewImg.style.border = '1px solid #000088';
      document.getElementById('canvas').parentNode.textContent = '';
    }
  };

  function updateQrcode(options) {
    // if options is string,
    if (typeof options === 'string') {
      options = { text: options };
    }

    // set default values
    // typeNumber < 1 for automatic calculation
    Object.assign(options, {
      width: 256,
      height: 256,
      typeNumber: -1,
      correctLevel: QRErrorCorrectLevel.L,
      background: '#ffffff',
      foreground: '#000000'
    });

    function isAscii(text) {
      for (const c of text) {
        if (c.charCodeAt(0) > 0x7f) return false;
      }
      return true;
    }

    function createCanvas() {
      const canvasElem = document.createElement('canvas');
      canvasElem.setAttribute('id', 'canvas');
      canvasElem.style.border = '1px solid #000088';
      const width = options.width;
      const height = options.height;
      canvasElem.width = width;
      canvasElem.height = height;
      const ctx = canvasElem.getContext('2d');

      if (!isAscii(options.text)) {
        ctx.fillStyle = options.background;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = options.foreground;
        ctx.fillRect(0.15 * width, 0.15 * height, 0.7 * width, 0.7 * height);
        return canvasElem;
      }

      const qrcode = new QRCode(options.typeNumber, options.correctLevel);
      qrcode.addData(options.text);
      qrcode.make();

      const margin = 4;
      const tileW = width / (qrcode.getModuleCount() + 2 * margin);
      const tileH = height / (qrcode.getModuleCount() + 2 * margin);
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, width, height);

      for (let row = 0; row < qrcode.getModuleCount(); row++) {
        for (let col = 0; col < qrcode.getModuleCount(); col++) {
          ctx.fillStyle = qrcode.isDark(row, col) ? options.foreground : options.background;
          const w = Math.ceil((col + 1) * tileW) - Math.floor(col * tileW);
          const h = Math.ceil((row + 1) * tileH) - Math.floor(row * tileH);
          ctx.fillRect(
            Math.round((col + margin) * tileW),
            Math.round((row + margin) * tileH),
            w, h);
        }
      }
      // return just built canvas
      return canvasElem;
    }

    const elemQrcode = document.getElementById('qrcode');
    elemQrcode.textContent = '';
    elemQrcode.appendChild(createCanvas());
  }
})();
