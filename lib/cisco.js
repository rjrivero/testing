var request = require('request')
	, events = require('events')
	, util = require('util')
	, mockUA = 'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))'
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
 *   - timeout: intervalo entre refrescos de la sesion (minutos)
 * 
 * Eventos que emite:
 * 	- 'abort' (Cuando se produce un error).
 *  - 'sessionID' (Cuando encuentra o cambia el sessionID).
 */
function CameraSpinner(options) {

	if(!(this instanceof CameraSpinner)) {
		return new CameraSpinner(options);
	}
    events.EventEmitter.call(this);

    // Datos de la cámara.
    this.username = options.username;
    this.password = options.password;
    this.protocol = options.protocol || 'https';
    this.settings_uri = this.protocol + '://' + options.hostname
		+ '/streaming.cs?version=1.0&action=get&sessionID=';
    this.login_uri = this.protocol + '://' + options.hostname
		+ '/login.cs';
    
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
			'referer': this.login_uri,
			'user-agent': mockUA,
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
CameraSpinner.prototype.get = function (options, cb) {
	var self = this;
    self.req.get(options, function(err, res, body) {
        if(err) {
			self.emit('abort', err);
		}
		else {
			cb(res, body);
		}
    });
}

/* Helper que manda a la camara una peticion POST */
CameraSpinner.prototype.post = function (options, cb) {
	var self = this;
    self.req.post(options, function(err, res, body) {
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

    var self = this;
    var options = {
        uri: self.login_uri,
        form: {
			version: '1.0',
			action: 'login',
			userName: self.username,
			password: self.password
		}
    };
    
    self.post(options, function(res, body) {
		var sessionMatch = body.match(/sessionID=([0-9a-zA-Z]+)/);
        if(sessionMatch) {
			self.sessionID = sessionMatch[1];
			self.emit('sessionID', self.sessionID);
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

    var self = this;

    self.get(self.settings_uri + self.sessionID, function(res, body) {
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

/*
 * Gestor para cámara web Cisco HD 4300.
 * 
 * Opciones:
 *   - username: nombre de usuario.
 *   - password: contraseña.
 *   - protocol: 'http' o 'https'.
 *   - hostname: nombre o IP de la camara.
 *   - timeout: intervalo entre refrescos de la sesion (minutos)
 */
function Camera(options) {
	
	if(!(this instanceof Camera)) {
		return new Camera(options);
	}
	this._spinner = new CameraSpinner(options);
	
}

Camera.prototype.getSID = function(cb) {

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

exports.Camera = Camera;
