var express = require('express')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')

if(process.env.VCAP_SERVICES){
  var env = JSON.parse(process.env.VCAP_SERVICES);
  var mongo = env['mongodb-1.8'][0]['credentials'];
} else {
  var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"",
    "db":"shoppingdb"
  }
}

var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');
  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port;
  }
}
var mongourl = generate_mongo_url(mongo);

//Database setup
mongoose.connect(mongourl);
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

require('./routes/index').registerEndpoints(app);
require('./routes/auth').registerEndpoints(app);
require('./routes/sse').registerEndpoints(app);

//Connect to db and start listening for connections
db.once('open', function() {
  console.log('db connection open');
  
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
});
