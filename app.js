
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , Strategy = require('passport-http').BasicStrategy
  , cisco = require('./lib/cisco')
  ;

/*
 * Estrategia "dummy" de autenticacion básica.
 *
 * Solicito el password para luego poder acceder a las cámaras.
 * No compruebo el password que el usuario proporciona, simplemente
 * lo anoto en el objeto "user".
 */
function fakeAuth(user, pass, done) {
    user = pass ? { username: user, password: pass } : false;
    process.nextTick(function() {
        done(null, user);
    });
}
passport.use(new Strategy({}, fakeAuth));

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.authenticate('basic', { session: false }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/quit', function() {
    process.exit(0);
});

app.get('/cisco', function(req, res) {
    var options = {
        host: "10.197.108.61",
        username: "fake",
        password: req.user.password
    };
    cisco.getSID(options, function(err, sid) {
        res.send(sid || err);
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
