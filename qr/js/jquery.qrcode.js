/*global QRErrorCorrectLevel, QRCode */
(function($){
  $.fn.qrcode = function(options) {
    // if options is string,
    if (typeof options === 'string'){
      options	= { text: options };
    }

    // set default values
    // typeNumber < 1 for automatic calculation
    options	= $.extend({}, {
      render: 'canvas',
      width: 256,
      height: 256,
      typeNumber: -1,
      correctLevel: QRErrorCorrectLevel.H,
      background: '#ffffff',
      foreground: '#000000'
    }, options);

    let createCanvas	= function(){
      // create the qrcode itself
      let qrcode	= new QRCode(options.typeNumber, options.correctLevel);
      qrcode.addData(options.text);
      qrcode.make();

      // create canvas element
      let canvas	= document.createElement('canvas');
      canvas.width	= options.width;
      canvas.height	= options.height;
      let ctx		= canvas.getContext('2d');

      // compute tileW/tileH based on options.width/options.height
      let tileW	= options.width / qrcode.getModuleCount();
      let tileH	= options.height / qrcode.getModuleCount();

      // draw in the canvas
      for (let row = 0; row < qrcode.getModuleCount(); row++){
        for (let col = 0; col < qrcode.getModuleCount(); col++){
          ctx.fillStyle = qrcode.isDark(row, col) ? options.foreground : options.background;
          let w = Math.ceil((col+1)*tileW) - Math.floor(col*tileW);
          let h = Math.ceil((row+1)*tileH) - Math.floor(row*tileH);
          ctx.fillRect(Math.round(col*tileW), Math.round(row*tileH), w, h);
        }
      }
      // return just built canvas
      return canvas;
    };

    // from Jon-Carlos Rivera (https://github.com/imbcmdth)
    let createTable	= function(){
      // create the qrcode itself
      let qrcode	= new QRCode(options.typeNumber, options.correctLevel);
      qrcode.addData(options.text);
      qrcode.make();

      // create table element
      let $table	= $('<table></table>')
        .css('width', options.width+'px')
        .css('height', options.height+'px')
        .css('border', '0px')
        .css('border-collapse', 'collapse')
        .css('background-color', options.background);

      // compute tileS percentage
      let tileW	= options.width / qrcode.getModuleCount();
      let tileH	= options.height / qrcode.getModuleCount();

      // draw in the table
      for (let row = 0; row < qrcode.getModuleCount(); row++){
        let $row = $('<tr></tr>').css('height', tileH+'px').appendTo($table);

        for (let col = 0; col < qrcode.getModuleCount(); col++){
          $('<td></td>')
            .css('width', tileW+'px')
            .css('background-color', qrcode.isDark(row, col) ? options.foreground : options.background)
            .appendTo($row);
        }
      }
      // return just built canvas
      return $table;
    };

    return this.each(function(){
      let element	= options.render == 'canvas' ? createCanvas() : createTable();
      $(element).appendTo(this);
    });
  };
})(jQuery);
