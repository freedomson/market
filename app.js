var 
  // Fetch the site configuration
  siteConf = require('./config/siteConfig')
  , express = require('express')
  , mongoose = require('mongoose')
  , todo = require('./models/todo')
  , routes = require('./routes')
  , sockets = require('./sockets')
  , connect = require('express/node_modules/connect')
  , RedisStore = require('connect-redis')(express)
  , sessionStore = new RedisStore()
  , app = express.createServer()
  , sio
  , assetManager = require('connect-assetmanager')
  , assetHandler = require('connect-assetmanager-handlers');
  
  
// Setup groups for CSS / JS assets
var assetsSettings = {
    'js': {
		'route': /\/static\/javascripts\/script\.js/
		, 'path': './public/javascripts/'
		, 'dataType': 'javascript'
		, 'files': [
			//'http://code.jquery.com/jquery-latest.js'
              'vendor/jquery-1.7.2.min.js'
            , 'vendor/underscore-min.js'
            , 'vendor/backbone-min.js'
            ,  siteConf.uri+'/socket.io/socket.io.js' // special case since the socket.io module serves its own js
            , 'vendor/backbone.iobind.js' // Minified blows up
            , 'vendor/backbone.iosync.min.js'
		]
		, 'debug': true 
        , 'postManipulate': {
			'^': [
				assetHandler.yuiJsOptimize
			]
		}
		/*, 'postManipulate': {
			'^': [
				assetHandler.uglifyJsOptimize
				, function insertSocketIoPort(file, path, index, isLast, callback) {
					callback(file.replace(/.#socketIoPort#./, siteConf.port));
				}
			]
		}*/
	}
	, 'css': {
		'route': /\/static\/stylesheets\/stylesheet\.css/
		, 'path': './public/stylesheets/'
		, 'dataType': 'css'
		, 'files': [
			'todos.css'
		]
		, 'debug': true
		, 'postManipulate': {
			'^': [
				assetHandler.fixVendorPrefixes
				, assetHandler.fixGradients
				, assetHandler.replaceImageRefToBase64(__dirname+'/public')
				, assetHandler.yuiCssOptimize
			]
		}
	}
};
// Add auto reload for CSS/JS/templates when in development
/*
app.configure('development', function(){
	assetsSettings.js.files.push('jquery.frontend-development.js');
	assetsSettings.css.files.push('frontend-development.css');
	[['js', 'updatedContent'], ['css', 'updatedCss']].forEach(function(group) {
		assetsSettings[group[0]].postManipulate['^'].push(function triggerUpdate(file, path, index, isLast, callback) {
			callback(file);
			dummyHelpers[group[1]]();
		});
	});
});
*/

var assetsMiddleware = assetManager(assetsSettings);

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.cookieParser(siteConf.sessionSecret));
  app.use(assetsMiddleware);
  app.use(express.session({
    secret: siteConf.sessionSecret,
    key: 'express.sid',
    store: sessionStore
  }));
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function () {
  app.use(express.errorHandler());
});


routes.init(app);
mongoose.connect("127.0.0.1", "todomvc", 27017);

app.listen(siteConf.port);

sio = require('socket.io').listen(app);
sockets.init(sio, sessionStore);

console.log("Express server listening on port "+siteConf.port);
