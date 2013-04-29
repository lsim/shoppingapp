
/**
 * Module dependencies.
 */

var express = require('express')
  , indexRoutes = require('./routes/index')
  , loginRoutes = require('./routes/auth')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , flash = require('connect-flash')
  , ShoppingGroupModel = require('./models/ShoppingGroup');

//Database setup
mongoose.connect('localhost','shoppingdb');
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
  //app.use(flash());

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var auth = express.basicAuth(authenticateUser);

function checkAuth(req, res, next) {
    if(!req.session.user_id) {
        res.redirect('/login');
        return;
    }
    ShoppingGroupModel.findOne({users: { $elemMatch: { _id: req.session.user_id }}},
        function(err, group) {
            if(err) {
                res.redirect('/login');
                return;
            }
            req.group = group;
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            next();
        }
    );
}

function authenticateUser(username, password, done) {
    ShoppingGroupModel.findOne({ users: { $elemMatch: { userName: username }}},
        function(err, group) {
            function validLogin(group, username, password) {
                var user = null;
                group.users.forEach(function(u) { if(u && u.userName == username) user = u; });
                if(!user)
                    return done('No such user');
                if(user.passwordHash != require('crypto').createHash('md5').update(password).digest('hex'))
                    return done('Incorrect password');
                return user;
            }
            if(err)
                return done(err);
            if(!group)
                return done('Incorrect username. Please try again');

            var user = validLogin(group, username, password);
            if(!user)
                return done('Incorrect password. Please try again');
            return done(null, user);
        }
    );
}

//Register indexRoutes with verbs
app.get('/', checkAuth, indexRoutes.indexGet);
app.get('/list', checkAuth, indexRoutes.listGetJson);
app.post('/list', checkAuth, indexRoutes.listSynchJson);
app.get('/fulljson', checkAuth, indexRoutes.listGetFullJson);

app.get('/group', loginRoutes.groupGet);
app.post('/group', loginRoutes.groupPost);
app.get('/register', loginRoutes.registerGet);
app.post('/register', loginRoutes.registerPost);
app.get('/login', loginRoutes.loginGet);
app.post('/login', function(req, res, done) {
    var post = req.body;
    authenticateUser(post.userName, post.password, function(err, user) {
        if(err) {
            return done();
        }
        req.session.user_id = user._id;
        res.redirect('/');
    });
});

//Connect to db and start listening for connections
db.once('open', function() {
  console.log('db connection open');
  
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
});
