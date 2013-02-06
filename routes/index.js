
var async = require('async')
  , util = require('util')
  , config = null
  ;

/*
 * Opciones de configuración:
 * {
 *   cisco: Objeto "cisco.Camera"
 * }
 */
exports.set = function(options) {
  config = options;
};

/* GET /quit */
exports.quit = function() {
  process.exit(0);
}

/* GET home page. */
exports.index = function(req, res) {

  async.parallel({
    cisco: function(cb) { config.cisco.get_url(cb); }
  },
  function(err, results) {
    res.render('index', {
      title: 'Express',
      cisco: results.cisco,
    });
  });

};
