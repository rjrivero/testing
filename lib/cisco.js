var http = require('http')
  , url = require('url')
  , qs = require('querystring')
  , events = require('events')
  , util = require('util')
  , _ = require('lodash')
  , mockUA = 'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))'
  , version = '1.0'
  , login = 'login.cs'
  , streaming = 'streaming.cs'
  , media = 'StreamingSetting'
  ;

/**
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
 *   - userAgent: user agent a emplear.
 *   - channelName: nombre del canal.
 *   - rtspPort: numero de puerto RTSP
 *   - mediaPort: puerto de video
 *   - width: ancho de la imagen
 *   - height: alto de la imagen
 *   - frames: framerate.
 *   - quality: calidad de la imagen, 0..100
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
  this.userAgent = options.userAgent || mockUA
  this.hostname = options.hostname;
  this.protocol = options.protocol || 'http';
  this.channelName = options.channelName || 'h264';
  this.rtspPort = options.rtspPort || 554;
  this.mediaPort = options.mediaPort || 32768;
  this.width = options.width || 1280;
  this.height = options.height || 720;
  this.frames = options.frames || 15;
  this.quality = options.quality || 43;
  this.nonSense();

  // Datos para gestionar la sesión con la cámara.
  this.sessionID = null;
  this.timer = null;
  this.timeout = (options.timeout || 15) * 60 * 1000;

  // Utilidades
  /* Ya no uso esto, me he cargado el modulo request
   * (la explicacion, en la funcion 'request' 
  this.req = request.defaults({
    strictSSL: false,
    followRedirect: false,
    encoding: 'utf8'
  });
  */

  // Comienza el bucle de refresco
  var self = this;
  process.nextTick(function() {
    self.login();
  });
}

util.inherits(CameraSpinner, events.EventEmitter);

/**
 *  Calcula el ancho de banda maximo y minimo.
 * 
 * Los caps se calculan en funcion de la calidad, siguiendo
 * el mismo algoritmo que la pagina web de la camara.
 */

CameraSpinner.prototype.nonSense = function () {
  return;
  
  /*
   * Esto es toda la basura que hace la web de la cámara para
   * calcular los valores de tasa de bits en función de parámetros
   * como ancho, alto, frame-rate, etc.
   * 
   * La cosa es que luego tiene pinta de que algo comprueba en el
   * servidor, porque si hay algún parámetro que no sea válido,
   * el POST se rechaza.
   * 
   * Así que, si queremos que de verdad el script soporte ajustar la
   * resolución y framerate de la cámara, hay que meter estos
   * cálculos.
   */
  
/*
document.getElementById("C1ChannelID").value = document.getElementById("channelID").value;
document.getElementById("C1Enabled").value = document.getElementById("enabled").value;
document.getElementById("C1ChannelName").value = document.getElementById("channelName").value;
document.getElementById("C1SecurityEnabled").value = document.getElementById("securityEnabled").value;
document.getElementById("C1RTSPPortNo").value = document.getElementById("rtspPortNo").value;
document.getElementById("C1VideoSourcePortNo").value = document.getElementById("videoSourcePortNo").value;
document.getElementById("C1AudioSourcePortNo").value = document.getElementById("audioSourcePortNo").value;
document.getElementById("C1MaxPacketSize").value = document.getElementById("maxPacketSize").value;
document.getElementById("C1MulticastEnabled").value = document.getElementById("multicastEnabled").value;
document.getElementById("C1MulticastDestIPAddress").value = document.getElementById("multicastDestIPAddress").value;
document.getElementById("C1MulticastVideoDestPortNo").value = document.getElementById("multicastVideoDestPortNo").value;
document.getElementById("C1MulticastAudioDestPortNo").value = document.getElementById("multicastAudioDestPortNo").value;
document.getElementById("C1Ttl").value = document.getElementById("ttl").value;
document.getElementById("C1VideoEnabled").value = document.getElementById("videoEnabled").value;
document.getElementById("C1VideoStandardType").value = document.getElementById("videoStandardType").value;
document.getElementById("C1VideoCodecType").value = document.getElementById("videoCodecType").value;
document.getElementById("C1VideoResolutionWidth").value = document.getElementById("videoResolutionWidth").value;
document.getElementById("C1VideoResolutionHeight").value = document.getElementById("videoResolutionHeight").value;
document.getElementById("C1MaxFrameRate").value = document.getElementById("maxFrameRate").value;

  this.c2frames = {
    '60': 30,
    '30': 30,
    '25': 25,
    '15': 15,
    '10': 10,
    '8': 8,
    '6': 6
  }[this.frames];
  if (!this.c2frames) {
    this.frames = 15;
    this.c2frames = 15;
  }

  if (quality >=75 &&quality <= 100) {
    if((((this.frames == 30) ||(this.frames == 25))&&
((this.width == 1920 && this.height == 1080) ||
(this.width == 1280 && this.height == 720))) ||
((this.frames == 60) && (this.width == 1280 && this.height ==720)))
{
this.upperCap = 15000;
this.lowerCap = 400;
}
else if(this.frames == 20 && (this.width ==1920 && this.height ==1080) || (this.width ==1280 && this.height ==720)))
{
  this.upperCap = 12000;
  this.lowerCap = 400;
}
else if(this.frames == 15 && (this.width  ==1920 && this.height ==1080) || (this.width ==1280 && this.height ==720)))
{
  this.upperCap = 10000;
  this.lowerCap = 400;
}
}
else if (quality >= 50 && quality <75)
{
if((((document.getElementById("C1MaxFrameRate").value == 30) ||(document.getElementById("C1MaxFrameRate").value == 25))&&
((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) ||
(document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720))) ||
((document.getElementById("C1MaxFrameRate").value == 60) && (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 15000;
document.getElementById("C1VbrLowerCap").value = 300;
}
else if(document.getElementById("C1MaxFrameRate").value == 20 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 12000;
document.getElementById("C1VbrLowerCap").value = 300;
}
else if(document.getElementById("C1MaxFrameRate").value == 15 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 10000;
document.getElementById("C1VbrLowerCap").value = 300;
}
else if(document.getElementById("C1MaxFrameRate").value == 10 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 8000;
document.getElementById("C1VbrLowerCap").value = 300;
}
}
else if (quality >= 25 && quality <50)
{
if((((document.getElementById("C1MaxFrameRate").value == 30) ||(document.getElementById("C1MaxFrameRate").value == 25))&&
((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) ||
(document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720))) ||
((document.getElementById("C1MaxFrameRate").value == 60) && (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 15000;
document.getElementById("C1VbrLowerCap").value = 200;
}
else if(document.getElementById("C1MaxFrameRate").value == 20 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 12000;
document.getElementById("C1VbrLowerCap").value = 200;
}
else if(document.getElementById("C1MaxFrameRate").value == 15 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 10000;
document.getElementById("C1VbrLowerCap").value = 200;
}
else if(document.getElementById("C1MaxFrameRate").value == 10 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 8000;
document.getElementById("C1VbrLowerCap").value = 200;
}
else if(document.getElementById("C1MaxFrameRate").value < 10 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 6000;
document.getElementById("C1VbrLowerCap").value = 200;
}
}
else if (quality >= 0 && quality < 25)
{
if((((document.getElementById("C1MaxFrameRate").value == 30) ||(document.getElementById("C1MaxFrameRate").value == 25))&&
((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) ||
(document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720))) ||
((document.getElementById("C1MaxFrameRate").value == 60) && (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 15000;
document.getElementById("C1VbrLowerCap").value = 100;
}
else if(document.getElementById("C1MaxFrameRate").value == 20 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 12000;
document.getElementById("C1VbrLowerCap").value = 100;
}
else if(document.getElementById("C1MaxFrameRate").value == 15 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 10000;
document.getElementById("C1VbrLowerCap").value = 100;
}
else if(document.getElementById("C1MaxFrameRate").value == 10 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 8000;
document.getElementById("C1VbrLowerCap").value = 100;
}
else if(document.getElementById("C1MaxFrameRate").value < 10 && ((document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) || (document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 6000;
document.getElementById("C1VbrLowerCap").value = 100;
}
else if(document.getElementById("C1MaxFrameRate").value && (!(document.getElementById("C1VideoResolutionWidth").value ==1920 && document.getElementById("C1VideoResolutionHeight").value ==1080) && !(document.getElementById("C1VideoResolutionWidth").value ==1280 && document.getElementById("C1VideoResolutionHeight").value ==720)))
{
document.getElementById("C1VbrUpperCap").value = 4000;
document.getElementById("C1VbrLowerCap").value = 100;
}
}
}
document.getElementById("C1AudioEnabled").value = document.getElementById("audioEnabled").value;
document.getElementById("C1AudioCompressionType").value = document.getElementById("audioCompressionType").value;
document.getElementById("C1AudioSamplingRate").value = document.getElementById("audioSamplingRate").value;
document.getElementById("C1AudioResolution").value = document.getElementById("audioResolution").value;
document.getElementById("C2AudioCompressionType").value = document.getElementById("audioCompressionType").value;
document.getElementById("C2AudioSamplingRate").value = document.getElementById("audioSamplingRate").value;
document.getElementById("C2AudioResolution").value = document.getElementById("audioResolution").value;
document.getElementById("C2VideoStandardType").value = document.getElementById("videoStandardType").value;
if (document.getElementById("C2VideoStandardType").value == 1)
{
if (document.getElementById("C2VideoResolutionWidth").value == 720 || document.getElementById("C2VideoResolutionWidth").value == 704)
document.getElementById("C2VideoResolutionHeight").value = 480;
else if (document.getElementById("C2VideoResolutionWidth").value == 352)
document.getElementById("C2VideoResolutionHeight").value = 240;
}
else if (document.getElementById("C2VideoStandardType").value == 2)
{
if (document.getElementById("C2VideoResolutionWidth").value == 720 || document.getElementById("C2VideoResolutionWidth").value == 704)
document.getElementById("C2VideoResolutionHeight").value = 576;
else if (document.getElementById("C2VideoResolutionWidth").value == 352)
document.getElementById("C2VideoResolutionHeight").value = 288;
}
}
else if (document.getElementById("channelID_list").selectedIndex == 1)
{
document.getElementById("C2ChannelID").value = document.getElementById("channelID").value;
document.getElementById("C2Enabled").value = document.getElementById("enabled").value;
document.getElementById("C2ChannelName").value = document.getElementById("channelName").value;
document.getElementById("C2SecurityEnabled").value = document.getElementById("securityEnabled").value;
document.getElementById("C2RTSPPortNo").value = document.getElementById("rtspPortNo").value;
document.getElementById("C2VideoSourcePortNo").value = document.getElementById("videoSourcePortNo").value;
document.getElementById("C2AudioSourcePortNo").value = document.getElementById("audioSourcePortNo").value;
document.getElementById("C2MaxPacketSize").value = document.getElementById("maxPacketSize").value;
document.getElementById("C2MulticastEnabled").value = document.getElementById("multicastEnabled").value;
document.getElementById("C2MulticastDestIPAddress").value = document.getElementById("multicastDestIPAddress").value;
document.getElementById("C2MulticastVideoDestPortNo").value = document.getElementById("multicastVideoDestPortNo").value;
document.getElementById("C2MulticastAudioDestPortNo").value = document.getElementById("multicastAudioDestPortNo").value;
document.getElementById("C2Ttl").value = document.getElementById("ttl").value;
document.getElementById("C2VideoEnabled").value = document.getElementById("videoEnabled").value;
document.getElementById("C2VideoStandardType").value = document.getElementById("videoStandardType").value;
document.getElementById("C2VideoCodecType").value = document.getElementById("videoCodecType").value;
document.getElementById("C2VideoResolutionWidth").value = document.getElementById("videoResolutionWidth").value;
document.getElementById("C2VideoResolutionHeight").value = document.getElementById("videoResolutionHeight").value;
document.getElementById("C2MaxFrameRate").value = document.getElementById("maxFrameRate").value;
if (document.getElementById("videoQualityControlType_1").checked)
document.getElementById("C2VideoQualityControlType").value = 1;
else if (document.getElementById("videoQualityControlType_2").checked)
document.getElementById("C2VideoQualityControlType").value = 2;
document.getElementById("C2FixedQuality").value = document.getElementById("fixedQuality").value;
if (document.getElementById("C2FixedQuality").value == 100)
{
document.getElementById("C2VbrUpperCap").value = 10000;
document.getElementById("C2VbrLowerCap").value = 8000;
}
else if (document.getElementById("C2FixedQuality").value == 71)
{
document.getElementById("C2VbrUpperCap").value = 8000;
document.getElementById("C2VbrLowerCap").value = 6000;
}
else if (document.getElementById("C2FixedQuality").value == 43)
{
document.getElementById("C2VbrUpperCap").value = 6000;
document.getElementById("C2VbrLowerCap").value = 2000;
}
else if (document.getElementById("C2FixedQuality").value == 14)
{
document.getElementById("C2VbrUpperCap").value = 2000;
document.getElementById("C2VbrLowerCap").value = 500;
}
document.getElementById("C2AudioEnabled").value = document.getElementById("audioEnabled").value;
document.getElementById("C2AudioCompressionType").value = document.getElementById("audioCompressionType").value;
document.getElementById("C2AudioSamplingRate").value = document.getElementById("audioSamplingRate").value;
document.getElementById("C2AudioResolution").value = document.getElementById("audioResolution").value;
document.getElementById("C1AudioCompressionType").value = document.getElementById("audioCompressionType").value;
document.getElementById("C1AudioSamplingRate").value = document.getElementById("audioSamplingRate").value;
document.getElementById("C1AudioResolution").value = document.getElementById("audioResolution").value;
document.getElementById("C1VideoStandardType").value = document.getElementById("videoStandardType").value;
if (document.getElementById("C1VideoStandardType").value == 1)
{
if (document.getElementById("C1VideoResolutionWidth").value == 720 || document.getElementById("C1VideoResolutionWidth").value == 704)
document.getElementById("C1VideoResolutionHeight").value = 480;
else if (document.getElementById("C1VideoResolutionWidth").value == 352)
document.getElementById("C1VideoResolutionHeight").value = 240;
}
else if (document.getElementById("C1VideoStandardType").value == 2)
{
if (document.getElementById("C1VideoResolutionWidth").value == 720 || document.getElementById("C1VideoResolutionWidth").value == 704)
document.getElementById("C1VideoResolutionHeight").value = 576;
else if (document.getElementById("C1VideoResolutionWidth").value == 352)
document.getElementById("C1VideoResolutionHeight").value = 288;
}
}
}
*/
}

/** Construye una uri relativa a la camara */
CameraSpinner.prototype.uri = function(path, query) {
  
  return url.format({
    protocol: this.protocol,
    hostname: this.hostname,
    pathname: path,
    query: query
  });

}

/**
 * Helper que manda a la camara una peticion.
 * 
 * Si se adjunta un 'form', la peticion es POST.
 * En otro caso, la peticion es GET.
 */
CameraSpinner.prototype.request = function (referer, uri, form, cb) {
  
  var self = this
    , buffer = []
    , body = null
    , options = url.parse(uri)
    , headers = {
      'Referer': referer,
      'User-Agent': self.userAgent,
      'Host': self.hostname
    }
    ;

  if(form) {
    body = qs.stringify(form);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    options['method'] = 'POST';
  }
  options.headers = headers;

  var req = http.request(options, function(res) {

    res.on('data', function(data) {
      buffer.push(data);
    });

    res.on('error', function(err) {
      self.emit('abort', err);
    });

    res.on('end', function() {
      cb(res, buffer.join(''));
    });

  });

  req.on('error', function(err) {
    self.emit('abort', err);
  });

  if(body) req.end(body, 'utf8');
  else req.end();
  
/* Antes lo hacia con este codigo, modulo request, pero 
 * funcionaba aleatoriamente.
 * 
 * Creo que es porque el modulo request manda el POST en dos
 * paquetes TCP:
 * 
 * - Un primer paquete con las cabeceras.
 * - Un segundo paquete con el contenido del form.
 * 
 * Este comportamiento no podia cambiarlo, y creo que era
 * el motivo de que la camara no precesara el POST correctamente.
 * Un software cojonudo el de la camara, si señor.
 * 
 * Aqui, mando un solo bloque con las cabeceras y el contenido,
 * con una sola llamada a req.end, de forma que (a menos que
 * la cabecera sea excesivamente larga), siempre entra en un
 * solo paquete.
 * 

  var self = this
    , body = null,
    , buffer = []
    , options = {
      method: form ? 'POST' : 'GET',
      uri: uri,
      headers: {
        'Referer': referer,
        'User-Agent': self.userAgent,
        'Host': self.hostname
      }
    }
    ;

  if(form) {
    options.form = form;
  }
  console.log('Cisco: Enviando peticion ' + util.inspect(options));
  self.req(options, function(err, res, body) {
    if(err) {
      console.log('Error: ' + err);
      self.emit('abort', err);
    }
    else {
      cb(res, body);
    }
  });
*/

}

/** Programa el proximo refresco de sesion */
CameraSpinner.prototype.nextRefresh = function() {
  
  var self = this;
  
  if(!self.timer) {
    self.timer = setTimeout(function() {
      self.timer = null;
      self.refresh();
    }, self.timeout);
  }

}

/** Inicia sesión en la cámara */
CameraSpinner.prototype.login = function() {

  var self = this
    , loginOpt = {
      version: version,
      action: 'login',
      userName: self.username,
      password: self.password
    }
    , refererOpt = {
      version: version,
      action: 'get',
      sessionID: null
    }
    , streamingOpt = {
      version: version,
      action: 'set',
      sessionID: null,
      getCurrentChannel: 1,
      C1ChannelID: 1,
      C1Enabled: 1,
      C1ChannelName: self.channelName,
      C1SecurityEnabled: 0,
      C1RTSPPortNo: self.rtspPort,
      C1VideoSourcePortNo: self.mediaPort,
      C1AudioSourcePortNo: self.mediaPort+2,
      C1MaxPacketSize: 1400,
      C1MulticastEnabled: 0,
      C1VideoEnabled: 1,
      C1VideoStandardType: 2, // PAL
      C1VideoCodecType: 4, // H.264
      C1VideoResolutionWidth: self.width,
      C1VideoResolutionHeight: self.height,
      C1MaxFrameRate: self.frames,
      C1VideoQualityControlType: 2,
      C1FixedQuality: self.quality, // Medium quality
      C1VbrUpperCap: self.upperCap,
      C1VbrLowerCap: self.lowerCap,
      C1AudioEnabled: 0,
      C1AudioCompressionType: 1,
      C1AudioSamplingRate: 8,
      C1AudioResolution: 8,
      C2ChannelID: 2,
      C2Enabled: 0,
      C2ChannelName: 'Channel2',
      C2SecurityEnabled: 0,
      C2RTSPPortNo: 554,
      C2VideoSourcePortNo: 1028,
      C2AudioSourcePortNo: 1030,
      C2MaxPacketSize: 1400,
      C2MulticastEnabled: 0,
      C2VideoEnabled: 0,
      C2VideoStandardType: 2,
      C2VideoCodecType: 2,
      C2VideoResolutionWidth: 720,
      C2VideoResolutionHeight: 576,
      C2MaxFrameRate: self.frames,
      C2VideoQualityControlType: 2,
      C2FixedQuality: 80,
      C2VbrUpperCap: self.upperCap,
      C2VbrLowerCap: self.lowerCap,
      C2AudioEnabled: 0,
      C2AudioCompressionType:1,
      C2AudioSamplingRate: 8,
      C2AudioResolution: 8
    }
    , uri = self.uri(login)
    , referer = uri
    ;
  
  self.request(referer, uri, loginOpt, function(res, body) {

    var sessionMatch = body.match(/sessionID=([0-9a-zA-Z]+)/);

    if(sessionMatch) {
  
      self.sessionID = sessionMatch[1];
      streamingOpt.sessionID = self.sessionID;
      refererOpt.sessionID = self.sessionID;

      referer = self.uri(streaming, refererOpt);
      uri = self.uri(streaming, streamingOpt);
      self.request(referer, uri, null, function(res, body) {
        console.log('Cisco: Obtenido sessionID ' + self.sessionID);
        self.emit('sessionID', self.sessionID);
      });

    }
    else {
      // pongo un sessionID para evitar que cada llamada a
      // getSID fuerce un nuevo reintento.
      self.sessionID = 'INVALID';
      console.log('Cisco: username o password invalido');
      self.emit('abort', new Error('Invalid username or password'));
    }
    self.nextRefresh();

  });

}

/** Refresca la sesion */
CameraSpinner.prototype.refresh = function() {

  var self = this
    , options = {
      version: version,
      action: 'get',
      sessionID: self.sessionID
    }
    , uri = self.uri(streaming, options)
    ;

  self.request(uri, uri, null, function(res, body) {
    var redirect = /<meta http-equiv="Refresh" content="1;url=login.cs">/;
    if (redirect.test(body)) {
      self.login();
    }
    else {
      self.nextRefresh();
    }
  });

}

/** Si estamos esperando un refresco, lo cancela y fuerza un login */
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

/** Devuelve la URL de RTSP */
CameraSpinner.prototype.getRtspUrl = function(sessionID) {
  return 'rtsp://' + this.hostname
    + ':' + this.rtspPort
    + '/' + media
    + '?' + qs.stringify({
      version: version,
      sessionID: sessionID,
      ChannelID: 1,
      ChannelName: this.channelName,
      action: 'getRTSPStream'
  });
}

/**
 * Gestor para cámara web Cisco HD 4300.
 * 
 * Opciones:
 *   - name: Nombre de la camara web.
 *   - username: nombre de usuario.
 *   - password: contraseña.
 *   - protocol: 'http' o 'https'.
 *   - hostname: nombre o IP de la camara.
 *   - timeout: intervalo entre refrescos de la sesion (minutos).
 *   - userAgent: user agent a emplear.
 *   - channelName: nombre del canal.
 *   - rtspPort: numero de puerto RTSP
 *   - mediaPort: puerto de video
 *   - width: ancho de la imagen
 *   - height: alto de la imagen
 *   - frames: framerate.
 *   - quality: calidad de la imagen, 0..100
 */
function Camera(options) {
  
  if(!(this instanceof Camera)) {
    return new Camera(options);
  }
  this._spinner = new CameraSpinner(options);
  this.name = options.name || ('Camara Cisco ' + options.hostname);

}

Camera.prototype.getSid = function(cb) {

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

Camera.prototype.getUrl = function(cb) {
 
  var self = this;

  self.getSid(function(err, sid) {
    if(err) cb(err, null);
    else cb(null, self._spinner.getRtspUrl(sid));
  });

}

exports.Camera = Camera;
