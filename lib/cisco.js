var request = require('request')
  , url = require('url')
  , qs = require('querystring')
  , events = require('events')
  , util = require('util')
  , mockUA = 'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))'
  , version = '1.0'
  , login = 'login.cs'
  , streaming = 'streaming.cs'
  , media = 'StreamingSetting'
  ;

/*
 * Spinner para cámara web Cisco HD 4300.
 * 
 * Inicia la sesión y la va refrescando, en un bucle, cada N
 * minutos, para que el SID no caduque.
 * 
 * Opciones:
 *   - username: nombre de usuario.
 *   - password: contraseña.
 *   - protocol: 'http' o 'https'.
 *   - hostname: nombre o IP de la camara.
 *   - timeout: intervalo entre refrescos de la sesion (minutos).
 *   - user_agent: user agent a emplear.
 *   - channel_name: nombre del canal.
 *   - rtsp_port: numero de puerto RTSP
 *   - media_port: puerto de video
 *   - width: ancho de la imagen
 *   - height: alto de la imagen
 *   - frames: framerate.
 * 
 * Eventos que emite:
 *   - 'abort' (Cuando se produce un error).
 *   - 'sessionID' (Cuando encuentra o cambia el sessionID).
 */
function CameraSpinner(options) {

  if(!(this instanceof CameraSpinner)) {
    return new CameraSpinner(options);
  }
  events.EventEmitter.call(this);

  // Datos de la cámara.
  this.username = options.username;
  this.password = options.password;
  this.user_agent = options.user_agent || mockUA
  this.hostname = options.hostname;
  this.protocol = options.protocol || 'http';
  this.channel_name = options.channel_name || 'h264';
  this.rtsp_port = options.rtsp_port || 554;
  this.media_port = options.media_port || 32768;
  this.width = options.width || 1280;
  this.height = options.height || 720;
  this.frames = options.frames || 15;

  // Datos para gestionar la sesión con la cámara.
  this.sessionID = null;
  this.timer = null;
  this.timeout = (options.timeout || 15) * 60 * 1000;

  // Utilidades
  this.req = request.defaults({
    strictSSL: false,
    followRedirect: false,
    encoding: 'utf8',
    headers: {
      'referer': url.format({
        protocol: this.protocol,
        hostname: this.hostname,
        pathname: login
      }),
      'user-agent': this.user_agent,
    }
  });

  // Comienza el bucle de refresco
  var self = this;
  process.nextTick(function() {
    self.login();
  });
}

util.inherits(CameraSpinner, events.EventEmitter);

/* Helper que manda a la camara una peticion GET */
CameraSpinner.prototype.get = function (path, options, cb) {
  
  var self = this
    , uri = url.format({
      protocol: self.protocol,
      hostname: self.hostname,
      pathname: path,
      query: options
    })
    ;

  self.req.get(uri, function(err, res, body) {
    if(err) {
      self.emit('abort', err);
    }
    else {
      cb(res, body);
    }
  });
}

/* Helper que manda a la camara una peticion POST */
CameraSpinner.prototype.post = function (path, options, cb) {
  
  var self = this
    , uri = url.format({
      protocol: self.protocol,
      hostname: self.hostname,
      pathname: path
    })
    ;
  
  self.req.post({ uri: uri, form: options }, function(err, res, body) {
    if(err) {
      self.emit('abort', err);
    }
    else {
      cb(res, body)
    }
  });

}

/* Programa el proximo refresco de sesion */
CameraSpinner.prototype.nextRefresh = function() {
  
  var self = this;
  
  if(!self.timer) {
    self.timer = setTimeout(function() {
      self.timer = null;
      self.refresh();
    }, self.timeout);
  }

}

/* Inicia sesión en la cámara */
CameraSpinner.prototype.login = function() {

  var self = this
    , login_opt = {
      version: version,
      action: 'login',
      userName: self.username,
      password: self.password
    }
    , streaming_opt = {
      version: version,
      action: 'set',
      sessionID: null,
      getCurrentChannel: self.channel_id,
      C1ChannelID: 1,
      C1Enabled: 1,
      C1ChannelName: self.channel_name,
      C1SecurityEnabled: 0,
      C1RTSPPortNo: self.rtsp_port,
      C1VideoSourcePortNo: self.media_port,
      C1AudioSourcePortNo: self.media_port+2,
      C1MaxPacketSize: 1400,
      C1MulticastEnabled: 0,
      C1VideoEnabled: 1,
      C1VideoStandardType: 2, // PAL
      C1VideoCodecType: 4, // H.264
      C1VideoResolutionWidth: self.width,
      C1VideoResolutionHeight: self.height,
      C1MaxFrameRate: self.frames,
      C1VideoQualityControlType: 2,
      C1FixedQuality: 43, // Medium quality
      C1VbrUpperCap: 10000,
      C1VbrLowerCap: 200,
      C1AudioEnabled: 0,
      C1AudioCompressionType: 1,
      C1AudioSamplingRate: 8,
      C1AudioResolution: 8,
      C2ChannelID: 2,
      C2Enabled: 0,
      C2ChannelName: 'Channel2',
      C2SecurityEnabled: 0,
      C2RTSPPortNo: self.rtsp_port+2,
      C2VideoSourcePortNo: self.media_port+4,
      C2AudioSourcePortNo: self.media_port+6,
      C2MaxPacketSize: 1400,
      C2MulticastEnabled: 0,
      C2VideoEnabled: 0,
      C2VideoStandardType: 2,
      C2VideoCodecType: 2,
      C2VideoResolutionWidth: 720,
      C2VideoResolutionHeight: 576,
      C2MaxFrameRate: 15,
      C2VideoQualityControlType: 2,
      C2FixedQuality: 80,
      C2VbrUpperCap: 15000,
      C2VbrLowerCap: 10000,
      C2AudioEnabled: 0,
      C2AudioCompressionType:1,
      C2AudioSamplingRate: 8,
      C2AudioResolution: 8
    }
    ;
  
  self.post(login, login_opt, function(res, body) {

    var sessionMatch = body.match(/sessionID=([0-9a-zA-Z]+)/);

    if(sessionMatch) {
      self.sessionID = sessionMatch[1];
      streaming_opt.sessionID = self.sessionID;
      self.get(streaming, streaming_opt, function(res, body) {
        self.emit('sessionID', self.sessionID);
      });
    }
    else {
      // pongo un sessionID para evitar que cada llamada a
      // getSID fuerce un nuevo reintento.
      self.sessionID = 'INVALID';
      self.emit('abort', new Error('Invalid username or password'));
    }
    self.nextRefresh();

  });

}

/* Refresca la sesion */
CameraSpinner.prototype.refresh = function() {

  var self = this
    , options = {
      version: version,
      action: 'get',
      sessionID: self.sessionID
    }
    ;

  self.get(streaming, options, function(res, body) {
    var redirect = /<meta http-equiv="Refresh" content="1;url=login.cs">/;
      if (redirect.test(body)) {
        self.login();
      }
      else {
        self.nextRefresh();
      }
    });

}

/* Si estamos esperando un refresco, lo cancela y fuerza un login */
CameraSpinner.prototype.forceRefresh = function() {

  var self = this;

  if(self.timer) {
    clearTimeout(self.timer);
    self.timer = null;
    self.emit('abort', new Error('Operation cancelled'));
    process.nextTick(function() {
      self.login();
    });
  }

}

/* Devuelve la URL de RTSP */
CameraSpinner.prototype.get_rtsp_url = function() {
  return 'rtsp://' + this.hostname
    + ':' + this.rtsp_port
    + '/' + media
    + '?' + qs.stringify({
      version: version,
      sessionID: this.sessionID,
      channelID: 1,
      channelName: this.channel_name
  });
}

/*
 * Gestor para cámara web Cisco HD 4300.
 * 
 * Opciones:
 *   - username: nombre de usuario.
 *   - password: contraseña.
 *   - protocol: 'http' o 'https'.
 *   - hostname: nombre o IP de la camara.
 *   - timeout: intervalo entre refrescos de la sesion (minutos).
 *   - user_agent: user agent a emplear.
 */
function Camera(options) {
  
  if(!(this instanceof Camera)) {
    return new Camera(options);
  }
  this._spinner = new CameraSpinner(options);

}

Camera.prototype.get_sid = function(cb) {

  var spinner = this._spinner
    , sessionID = spinner.sessionID
    ;

  if(sessionID) {
    // Lo tenemos obtenido, solo hay que devolverlo.
    process.nextTick(function() {
      cb(null, sessionID);
    });
  }
  else {
    spinner.forceRefresh();
    spinner.once('abort', function(err) {
      cb(err, null);
    });
    spinner.once('sessionID', function(sessionID) {
      cb(null, sessionID);
    });
  }
}

Camera.prototype.get_url = function(cb) {
 
  var self = this;

  self.get_sid(function(err, sid) {
    if(err) cb(err, null);
    else cb(null, self._spinner.get_rtsp_url());
  });

}

exports.Camera = Camera;
