
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  ;

var ciscoCamera = new cisco.Camera({
  hostname: "10.197.108.61",
  username: "admin",
  password: process.env['CISCO_CAMERA_PASSWORD'],
  protocol: 'http'
});

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/quit', function() {
  process.exit(0);
});

app.get('/', routes.index);
app.get('/cisco', routes.cisco);
app.get('/axis', routes.axis);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
