
/**
 * Gestor para cámara web Axis 720HD.
 * 
 * Opciones:
 *   - name: Nombre de la camara web.
 *   - hostname: nombre o IP de la camara.
 *   - rtspPort: numero de puerto RTSP (por defecto, 554)
 *   - width: anchura de la imagen.
 *   - height: altura de la imagen.
 * 
 * La camara Axis tiene que estar configurara para permitir
 * streaming sin password.
 */
function Camera(options) {
  
  if(!(this instanceof Camera)) {
    return new Camera(options);
  }
  
  var port = options.port || 554;
  this.width = options.width || 640;
  this.height = options.height || 480;
  this.name = options.name || ('Camara ' + options.hostname);
  this.url = 'rtsp://' + options.hostname + ':' + port + '/mpeg4/media.amp';
}

Camera.prototype.getUrl = function(cb) {
 
  var self = this;
  process.nextTick(function() {
    cb(null, self.url);
  });

}

exports.Camera = Camera;
