
/**
 * Module dependencies.
 */

var express = require('express')
  , indexRoutes = require('./routes/index')
  , loginRoutes = require('./routes/auth')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
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
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//Set up authentication mechanism
passport.use(new LocalStrategy(
    function(username, password, done) {
        ShoppingGroupModel.findOne({ users: { $elemMatch: { userName: username }}},
            function(err, group) {
                function validLogin(group, username, password) {
                    var user;
                    group.users.forEach(function(u) { user = u.userName == username && u; });
                    if(!user)
                        return false;
                    if(user.passwordHash != require('crypto').createHash('md5').update(password).digest('hex'))
                        return false;
                    return user;
                }
                if(err)
                    return done(err);
                if(!group)
                    return done(null, false, { message: 'Incorrect username. Please try again'});

                var user = validLogin(group, username, password);
                if(!user)
                    return done(null, false, { message: 'Incorrect password. Please try again'});
                return done(null, user);
            });
    }
));
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    ShoppingGroupModel.findOne({ users: { $elemMatch: { _id: id}}}, function (err, group) {
        var user;
        group.users && group.users.forEach(function(u) { user = u._id == id && u; })
        done(err, user);
    });
});
//Register indexRoutes with verbs
app.get('/', ensureAuthenticated, indexRoutes.indexGet);
app.get('/list', ensureAuthenticated, indexRoutes.listGetJson);
app.post('/list', ensureAuthenticated, indexRoutes.listSynchJson);

app.get('/group', loginRoutes.groupGet);
app.post('/group', loginRoutes.groupPost);
app.get('/register', loginRoutes.registerGet);
app.post('/register', loginRoutes.registerPost);
app.get('/login', loginRoutes.loginGet);
app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true})
);

//Connect to db and start listening for connections
db.once('open', function() {
  console.log('db connection open');
  
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}