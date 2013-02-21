
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , routes = require('./routes')
  , cisco = require('./lib/cisco')
  , vlc = require('./lib/vlc')
  ;

var options = {

    ciscoCamera: {
      name: 'Camara Cisco HD',
      hostname: '10.197.108.61',
      username: 'admin',
      password: process.env['CISCO_CAMERA_PASSWORD'],
      protocol: 'http',
      channelName: 'live',
      rtspPort: 554,
      mediaPort: 32768,
      width: 1280,
      height: 720,
      frames: 15
    },

    vlcSwitch: {
      privHostname: process.env['VLC_INTERNAL_IP' ] || '127.0.0.1',
      privPort: 8080,
      pubHostname: process.env['VLC_EXTERNAL_IP'] || '127.0.0.1',
      pubPort: 8080,
      path: 'stream.mp4',
    }

  }
  , sources = [ 
    new cisco.Camera(options.ciscoCamera)
  ]
  ;
  

var app = express()
  , vlcSwitch = new vlc.Switch(options.vlcSwitch, sources)
  ;

routes.set({
  sources: sources,
  vlc: vlcSwitch,
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
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
app.get('/stream/:id', routes.stream);
app.get('/quit', routes.quit);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
