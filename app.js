
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , routes = require('./routes')
  , cisco = require('./lib/cisco')
  ;

var options = {
  cisco: {
    hostname: '10.197.108.61',
    username: 'admin',
    password: process.env['CISCO_CAMERA_PASSWORD'],
    protocol: 'http',
    channel_name: 'h264',
    rtsp_port: 554,
    media_port: 32768,
    width: 1280,
    height: 720,
    frames: 15
  }
}

var ciscoCamera = new cisco.Camera(options.cisco)
  , app = express()
  ;

routes.set({ cisco: ciscoCamera });

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

app.get('/', routes.index);
app.get('/quit', routes.quit);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
