(function () {
  window.onload = function () {
    const elemText = document.getElementById('input-text');
    const elemQrcode = document.getElementById('qrcode');
    elemText.addEventListener('input', update, false);
    update();

    function update() {
      const elemError = document.getElementById('error-message');
      elemError.hidden = true;
      elemError.textContent = '';
      elemText.removeAttribute('aria-invalid');

      try {
        const image = createQrcodeImage({
          text: elemText.value,
          width: 300,
          height: 300,
        });
        elemQrcode.replaceChildren(image);
      } catch (error) {
        elemQrcode.replaceChildren();
        elemText.setAttribute('aria-invalid', 'true');
        if (error.message.startsWith('code length overflow.')) {
          elemError.textContent = '入力が長すぎます。文字数を減らしてください。';
        } else {
          elemError.textContent = 'QRコードを作成できませんでした。入力内容を確認してください。';
        }
        elemError.hidden = false;
      }
    }
  };

  function createQrcodeImage(options) {
    if (typeof options === 'string') {
      options = { text: options }; // eslint-disable-line no-param-reassign
    }

    // set default values
    // typeNumber < 1 for automatic calculation
    const settings = Object.assign({
      width: 256,
      height: 256,
      typeNumber: -1,
      correctLevel: window.QRErrorCorrectLevel.L,
      background: '#ffffff',
      foreground: '#000000'
    }, options);

    function createCanvas() {
      const canvasElem = document.createElement('canvas');
      const qrcode = new window.QRCode(settings.typeNumber, settings.correctLevel);
      // qrcode.jsは文字コードの下位8ビットを書き込むため、UTF-8の各バイトを1文字ずつ渡す。
      const bytes = new TextEncoder().encode(settings.text);
      const byteString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
      qrcode.addData(byteString);
      qrcode.make();

      const margin = 4;
      const moduleCount = qrcode.getModuleCount();
      const totalModules = moduleCount + 2 * margin;
      // マスの幅を整数ピクセルにそろえ、長い入力でも1マス4px以上を確保する。
      const tileSize = Math.max(4, Math.ceil(Math.max(settings.width, settings.height) / totalModules));
      const size = totalModules * tileSize;
      canvasElem.width = size;
      canvasElem.height = size;
      const ctx = canvasElem.getContext('2d');
      ctx.fillStyle = settings.background;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = settings.foreground;

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qrcode.isDark(row, col)) {
            ctx.fillRect((col + margin) * tileSize, (row + margin) * tileSize, tileSize, tileSize);
          }
        }
      }
      // return just built canvas
      return canvasElem;
    }

    const image = document.createElement('img');
    image.alt = '入力した文字列のQRコード';
    image.src = createCanvas().toDataURL();
    return image;
  }
})();
