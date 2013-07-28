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

    var getHashedPassword = function(password) {
      return require('crypto').createHash('md5').update(password).digest('hex');
    };

    var comparePassword = function(hash, password) {
      return hash == getHashedPassword(password);
    };

    function authenticateUser(username, password, next) {
      ShoppingGroupModel.findOne({ users: { $elemMatch: { userName: username }}},
        function(err, group) {
          function validLogin(group, username, password) {
            var user = null;
            group.users.forEach(function(u) { if(u && u.userName == username) user = u; });
            if(!user)
              return next('No such user');
            if(user.passwordHash != require('crypto').createHash('md5').update(password).digest('hex'))
              return next('Incorrect password');
            return user;
          }
          if(err)
            return next(err);
          if(!group)
            return next('Incorrect username. Please try again');

          var user = validLogin(group, username, password);
          if(!user)
            return next('Incorrect password. Please try again');
          return next(null, user);
        }
      );
    }

    app.post('/login', function(req, res) {
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

    app.post('/register', function(req, res, next) {
      ShoppingGroupModel.findOne({_id: req.body.groupId }, function(err, result) {
        if(err) return next(err);

        if(!result) return next('No such group exists. Please try again')

        if(result.users.some(function(user) { return user.userName == req.body.username})) {
          return next('Account already exists. Please choose another user name');
        }

        if(!comparePassword(result.passwordHash, req.body.groupPassword)) {
          return next('Group password was incorrect. Please try again.');
        }

        result.users.push({userName: req.body.username, passwordHash: getHashedPassword(req.body.password)});
        result.save(function(err) {
          if(err) return next('Error saving data: ' + err)
          res.send('ok');
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

    app.post('/groups', function(req, res, next) {
      var name = req.body.groupName;
      var pass = req.body.groupPassword;
      ShoppingGroupModel.count({name: name}, function(err, count) {
        if(err)
          return next(err);
        if(count) {
          return next("A group by that name already exists.");
        }

        var newGroup = new ShoppingGroupModel({name: name, passwordHash: getHashedPassword(pass)});
        newGroup.save(function(err) {
          if(err)
            return next(err);
          res.json({status: 'ok'});
        })
      });
    });
  }
};

module.exports = AuthExports;