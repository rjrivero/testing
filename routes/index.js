
var async = require('async')
  , util = require('util')
  , config = null
  ;

/*
 * Opciones de configuración:
 * {
 *   sources: Objetos "Camera" de Cisco o Axis
 *   vlc: Objeto "vlc.switch"
 *   delay: intervalo de tiempo (ms) a esperar a que VLC se "caliente",
 *          antes de devolver la URL de streaming de un video.
 * }
 */
exports.set = function(options) {
  config = options;
};

/* GET /quit */
exports.quit = function() {
  process.exit(0);
}

/* GET /stream/:id */
exports.stream = function(req, res) {
  var id = parseInt(req.params.id);
  if(id >= 0 && id < config.sources.length) {
    config.vlc.activate(id, function(err, url) {
      if(err) {
        console.log(err);
        res.send({ err: utils.inspect(err) });
      }
      else {
	setTimeout(function() {
          var source = config.sources[id];
          res.send({ url: url, width: source.width, height: source.height });
        }, config.delay || 5000);
      }
    });
  }
}

/* GET home page. */
exports.index = function(req, res) {

  async.map(config.sources, function(source, cb) {
    source.getUrl(cb);
  },
  function(err, results) {
    if(err) {
      console.log(err);
    }
    else {
      res.render('index', {
        title: 'Demo Sanlucar Fruit',
        sources: config.sources,
        urls: results
      });
    }
  });

};
