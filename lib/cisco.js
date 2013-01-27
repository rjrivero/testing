var _ = require('lodash')
    , request = require('request')
    ;

exports.getSID = getSID;

function getSID(options, cb) {
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
    var jar = request.jar()
        , settings_uri = 'https://' + options.host
        , login_uri = 'http://' + options.host
        ;

    var req = request.defaults({
        strictSSL: false,
        followRedirect: false,
        jar: jar,
        encoding: 'utf8',
    });

    req.get(settings_uri, function(err, res, body) {
        if(err) {
            cb(err, null);
        }
        cb(null, {
            options: options,
            headers: res.headers,
            body: body,
            cookies: jar
        });
    });

}
