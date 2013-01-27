var _ = require('lodash')
    , request = require('request')
    ;

function CameraBrowser(options, errcb) {

    this.username = 'root';
    this.password = options.password;
    this.settings_uri = 'https://' + options.host + '/settings.cs';
    this.login_uri = 'https://' + options.host + '/login.cs';
    this.jar = request.jar();
    this.errcb = errcb;
    this.req = request.defaults({
        strictSSL: false,
        followRedirect: false,
        jar: this.jar,
        encoding: 'utf8',
    });
}

/*
 * Efectua una meticion GET.
 * Si se produce error, invoca al error-callback (this.errcb).
 * En otro caso, invoca al callback (cb)
 */
CameraBrowser.prototype.get = function (options, cb) {
    var self = this;
    self.req.get(options, function(err, res, body) {
        if(err) {
            self.errcb(err,null);
        }
        else {
            cb(res, body);
        }
    });
}

/*
 * Efectua una meticion POST.
 * Si se produce error, invoca al error-callback (this.errcb).
 * En otro caso, invoca al callback (cb)
 */
CameraBrowser.prototype.post = function (options, cb) {
    var self = this;
    self.req.post(options, function(err, res, body) {
        if(err) {
            self.errcb(err,null);
        }
        else {
            cb(res, body);
        }
    });
}

/* Inicia sesión en la cámara */
CameraBrowser.prototype.login = function(cb) {

    var self = this
        , dv = new Date()
        , dt = ((dv.getMonth()+1) + '/' + dv.getDate() + '/' + dv.getYear())
        , form = {
            version: '1.0',
            action: 'login',
            userName: self.username,
            password: self.password,
            sysDateTime: dt
        }
        , options = {
            uri: self.login_uri,
            form: form
        }
        ;

    self.post(options, function(res, body) {
        //var rejected = /UserLoginStatus = ".+"/;
        //if (rejected.test(body)) {
        //    self.errcb(new Error('Invalid username or password'), null);
        //}
        //else {
            self.cb(null, {
                method: 'login',
                options: self,
                headers: res.headers,
                body: body,
                cookies: self.jar
            });
        //}
    });


}

/* Comprueba si tenemos la sesion iniciada */
CameraBrowser.prototype.check = function(cb) {

    var self = this;

    self.get(self.settings_uri, function(res, body) {
        var redirect = /<meta http-equiv="Refresh" content="1;url=login.cs">/;
        if (redirect.test(body)) {
            self.login(cb);
        }
        else {
            self.cb(null, {
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
    browser = new CameraBrowser(options, cb);
    browser.check(cb);
}
