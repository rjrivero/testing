
var url = require('url')
  , async = require('async')
  , spawn = require('child_process').spawn
  , _ = require('lodash')
  ;

/**
 * Gestor de instancia VLC.
 * 
 * Inicia y detinen una instancia de VLC haciendo streaming
 * desde una fuente RTSP, a un formato HTTP.
 * 
 * Opciones:
 * 
 *  - mux: mux a usar en VLC (por defecto, 'asf')
 *  - mime: tipo mime a anunciar.
 *  - privHostname: nombre o IP donde publicar el stream, en el servidor local.
 *  - pubHostname: nombre o IP público en el que acceder al stream.
 *  - privPort: puerto por el que publicar el stream, en el servidor local.
 *  - pubPort: puerto público por el que acceder al stream.
 *  - path: ruta en la que publicar el stream.
 * 
 * Source:
 * 
 *  Objeto fuente de video. Debe tener una function
 * 'getUrl(cb(err, url))' que obtenga la URL de la fuente.
 */
function Manager(options, source) {

  var mux = options.mux || 'asf'
    , mime = options.mime || 'video/x-ms-asf'
    ;

  if(!(this instanceof Manager)) {
    return new Manager(options);
  }

  this.source = source;
  this.child = null;
  this.sout = '#standard{access=http{mime=' + mime
    + '},mux=' + mux
    + ',dst=' + options.privHostname
    + ':' + options.privPort
    + '/' + options.path + '}';
  this.url = url.format({
    protocol: 'http',
    hostname: options.pubHostname,
    port: options.pubPort,
    pathname: options.path
  });

}

/**
 * Arranca el Manager.
 * 
 * Una vez arrancado, ejecuta el callback pasandole dos
 * argumentos: error y URL de acceso.
 */
Manager.prototype.start = function(cb) {
  
  var self = this;
  
  if(self.child) {
    process.nextTick(function() { cb(null, self.url); });
  }
  else {
    console.log("SELF_SOURCE: " + self.source);
    self.source.getUrl(function(err, url) {
      if(err) {
        cb(err, null);
      }
      else {
        self.child = spawn('cvlc', [ url, '--sout', self.sout ]);
        self.child.on('exit', function(code) {
          console.log('CVLC terminado con código ' + code);
          self.child = null;
        });
        self.child.stdout.on('data', function(data) {
          console.log('Starting VLC: ' + data);
        });
        self.child.stderr.on('data', function(data) {
          console.log('Error on VLC: ' + data);
        });
        cb(null, self.url);
      }
    });
  }

}

/** Cierra el Manager. */
Manager.prototype.stop = function(cb) {
  
  var self = this;
  
  if(!self.child) {
    process.nextTick(function() { cb(0); });
  }
  else {
    self.child.on('exit', function(code) {
      self.child = null;
      cb(code);
    });
    self.child.kill();
  }

}

/**
 * Conmutador de instancias VLC
 * 
 * Conmuta entre varias instancias de VLC Manager,
 * permitiendo sólo una activa en cada momento
 * 
 *  - mux: mux a usar en VLC (por defecto, 'asf')
 *  - mime: tipo mime a anunciar.
 *  - privHostname: nombre o IP donde publicar el stream, en el servidor local.
 *  - pubHostname: nombre o IP público en el que acceder al stream.
 *  - privPort: puerto por el que publicar el stream, en el servidor local.
 *  - pubPort: puerto público por el que acceder al stream.
 *  - path: ruta en la que publicar el stream.
 * 
 * Sources:
 * 
 *  Array donde cada atributo es una fuente de video. Una fuente
 *  de video es un objeto con al menos dos atributos:
 * 
 *  - name: nombre de la fuente de video.
 *  - getUrl(cb): funcion que obtiene el URL de la fuente.
 *      al obtenerlo, invoca cb(err, url).
 */
function Switch(options, sources) {

  if(!(this instanceof Switch)) {
    return new Switch(options);
  }
  
  this.managers = _.map(sources, function(source) {
    return new Manager(options, source);
  });
  
}

/**
 * Desactiva la camara en emision.
 * 
 * Recibe un callback opcional, al que se llama tras detener
 * la emision con un solo parametro "err", que deberia estar a null
 * si no ha habido error.
 */
Switch.prototype.off = function(onStop) {

  var self = this;

  async.forEach(self.managers, function(manager, ret) {
    manager.stop(ret);
  }, onStop || function(err) { });

}

/**
 * Activa la camara correspondiente al indice dado.
 * 
 * Cuando termina, llama al callback con los parametros 'err'
 * y 'url', indicando si ha habido algún error y, en caso
 * contrario, la url desde la que se puede reproducir la cámara
 * por HTTP.
 */
Switch.prototype.activate = function(index, cb) {

  var self = this;

  self.off(function (err) {
    if(err) {
      cb(err, null);
    }
    else {
      self.managers[index].start(cb);
    }
  });
  
}

exports.Switch = Switch;
