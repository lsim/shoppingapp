var express = require('express')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

//Database setup
mongoose.connect(require('./mongourl'));
var db = mongoose.connection;
db.on('error', function(msg) { console.log(msg); process.exit(1); });

var app = express();

//Configuration
app.configure(function(){
  app.set('port', process.env.PORT || 8888);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser());
  app.use(express.session({ secret: 'ejvin og maggie'}));

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(err, req, res, next) {
    console.log("error intercepted: ", err);
    res.send(500, err);
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Load up all endpoints
require('./routes/index').registerEndpoints(app);
require('./routes/auth').registerEndpoints(app);
require('./routes/sse').registerEndpoints(app);
require('./routes/app.cache').registerEndpoints(app);

//Connect to db and start listening for connections
db.once('open', function() {
  console.log('db connection open');
  
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
});
