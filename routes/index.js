
var cisco = require('../lib/cisco')
  ;

/* GET home page. */
exports.index = function(req, res) {
  res.render('index', { title: 'Express' });
};

/* GET cisco page. */
exports.cisco = function(req, res) {
  ciscoCamera.getSID(function(err, sid) {
    res.send(sid || err);
  });
};
