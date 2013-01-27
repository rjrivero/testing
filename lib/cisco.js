var _ = require('lodash')
    , request = require('request')
    ;

function CameraBrowser(options) {

    this.username = 'admin';
    this.password = options.password;
    this.settings_uri = 'https://' + options.host + '/settings.cs';
    this.login_uri = 'https://' + options.host + '/login.cs';
    this.jar = request.jar();
    this.req = request.defaults({
        strictSSL: false,
        followRedirect: false,
        jar: this.jar,
        encoding: 'utf8',
    });

}

/* Inicia sesión en la cámara */
CameraBrowser.prototype.login = function(cb) {
    var self = this;
    self.req.get(self.login_uri, function(err, res, body) {
        if(err) {
            cb(err, null);
        }
        else {
            cb(null, {
                method: 'login',
                options: self,
                headers: res.headers,
                body: body,
                cookies: self.jar
            });
        }
    });
}

/* Comprueba si tenemos la sesion iniciada */
CameraBrowser.prototype.check = function(cb) {
    var self = this;
    self.req.get(self.settings_uri, function(err, res, body) {
        if(err) {
            cb(err, null);
        }
        var redirect = /<meta http-equiv="Refresh" content="1;url=login.cs">/;
        if (redirect.test(body)) {
            self.login(cb);
        }
        else {
            cb(null, {
                method: 'check',
                options: self,
                headers: res.headers,
                body: body,
                cookies: self.jar
            });
        }
    });
}

/*
 * Obtiene un valor de SessionID válido para iniciar una
 * conexión rtsp contra una cámara Cisco 4500 HD.
 *
 * __Options__: parámetros de la función.
 *
 * - host: nombre de host o IP de la cámara.
 * - username: nombre de usuario.
 * - password: contraseña.
 *
 * __Cb__: function(err, sessionID)
 *
 * Callback al que se invoca tras obtener el sessionID, con un
 * posible objeto error si no se puede contactar con la cámara
 * o iniciar sesión.
 */
exports.getSID = function (options, cb) {
    browser = new CameraBrowser(options);
    browser.check(cb);
}
