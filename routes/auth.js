var ShoppingGroupModel = require('../models/ShoppingGroup');

var AuthExports = {

  /* Security middleware for endpoints that require authentication*/
  checkAuth: function(errOnFail) {
    return function(req, res, next) {
      if(!req.session.user_id) {
        if(errOnFail) {
          res.send(401, 'Authentication required');
        } else {
          res.redirect('/login');
        }
        return;
      }
      ShoppingGroupModel.findOne({users: { $elemMatch: { _id: req.session.user_id }}},
        function(err, group) {
          if(err) {
            res.send(401, 'Authentication required');
            return;
          }
          req.group = group;
          res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
          next();
        }
      );
    }
  },

  registerEndpoints: function(app) {

//        var ShoppingGroupModel = require('../models/ShoppingGroup');

    //var getFlashMsg = function(req) {
    //    var flash = req.flash();
    //    return flash.error && flash.error.length ? flash.error[0] : '';
    //};

    var getHashedPassword = function(password) {
      return require('crypto').createHash('md5').update(password).digest('hex');
    };

    var comparePassword = function(hash, password) {
      return hash == getHashedPassword(password);
    };

    app.get('/login', function(req, res) {
      res.render('login', {
        title: 'Please log in'//,
        //flash: getFlashMsg(req)
      });
    });

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

    //TODO: deprecated. Remove when auth api is working
    app.post('/login', function(req, res) {
      var post = req.body;
      authenticateUser(post.userName, post.password, function(err, user) {
        if(err) {
          res.render('login', { title: err});
          return;
        }
        req.session.user_id = user._id;
        res.redirect('/');
      });
    });

    app.post('/login2', function(req, res) {
      var post = req.body;
      authenticateUser(post.username, post.password, function(err, user) {
        if(err) {
          res.send(500, err);
          return;
        }
        req.session.user_id = user._id;
        res.json({status: 'ok'});
      });
    });

    app.get('/register', function(req, res) {
      ShoppingGroupModel.find({}, 'name', function(err, results) {

        var model = results || [];
        res.render('register', {
          title: 'Please register',
          groups: model//,
          //flash: getFlashMsg(req)
        });
      });
    });

    app.post('/register', function(req, res) {
      ShoppingGroupModel.findOne({_id: req.body.selectedGroup }, function(err, result) {
        if(err) {
          //req.flash('error', 'Error accessing data: ' + err);
          res.redirect('/register');
          return;
        }

        if(!result) {
          //req.flash('error', 'No such group exists. Please try again.');
          res.redirect('/register');
          return;
        }

        if(result.users.some(function(user) { return user.userName == req.body.userName})) {
          //req.flash('error', 'Account already exists. Please choose another user name');
          res.redirect('/register');
          return;
        }

        if(!comparePassword(result.passwordHash, req.body.groupPassword)) {
          //req.flash('error', 'Group password was incorrect. Please try again.');
          res.redirect('/register');
          return;
        }

        result.users.push({userName: req.body.userName, passwordHash: getHashedPassword(req.body.password)});
        result.save(function(err) {
          if(err) {
            //req.flash('error', 'Error saving data ' + err);
            res.redirect('register');
            return;
          }
          res.redirect('/login');
        });
      });
    });

    app.get('/groups', function(req, res, next) {
      ShoppingGroupModel.find({}, { name: 1}, function(err, results) {
        if(err)
          return next(err);
        res.json(results);
      })
    });

    app.post('/groups', function(req, res) {
      var name = req.body.groupName;
      var pass = req.body.groupPassword;
      ShoppingGroupModel.count({name: name}, function(err, count) {
        if(err)
          return next(err);
        if(count) {
          return next({reason : 'collision'});
        }

        var newGroup = new ShoppingGroupModel({name: name, passwordHash: getHashedPassword(pass)});
        newGroup.save(function(err) {
          if(err)
            return next(err);
          res.json({status: 'ok'});
        })
      });
    });

    //TODO: deprecated: should be removed as we move to authentication API
    app.get('/group', function(req, res) {
      res.render('group', {
        title: 'Create a group'
        //flash: getFlashMsg(req)
      });
    });

    //TODO: deprecated: should be removed as we move to authentication API
    app.post('/group', function(req, res) {
      ShoppingGroupModel.findOne({name: req.body.name}, function(err, results) {
        if(err) {
          //req.flash('error', 'Error accessing data: ' + err);
          res.redirect('/group');
          return;
        }

        if(results) {
          //req.flash('error', 'Error: Group "' + req.body.name + '" already exists!');
          res.redirect('/group');
          return;
        }

        var model = new ShoppingGroupModel({name: req.body.name, passwordHash: getHashedPassword(req.body.password)});
        model.save(function(err) {
          if(err) {
            //req.flash('error', 'Error saving data: ' + err);
            res.redirect('/group');
          }
          res.redirect('/register');
        });
      });
    });
  }
};

module.exports = AuthExports;