var ShoppingGroupModel = require('../models/ShoppingGroup');

var getFlashMsg = function(req) {
    var flash = req.flash();
    return flash.error && flash.error.length ? flash.error[0] : '';
};

var getHashedPassword = function(password) {
    return require('crypto').createHash('md5').update(password).digest('hex');
};

var comparePassword = function(hash, password) {
    return hash == getHashedPassword(password);
};

exports.loginGet = function(req, res) {
    res.render('login', {
        title: 'Please log in',
        flash: getFlashMsg(req)
    });
};

exports.registerGet = function(req, res) {
    ShoppingGroupModel.find({}, 'name', function(err, results) {

        var model = results || [];
        res.render('register', {
            title: 'Please register',
            groups: model,
            flash: getFlashMsg(req)
        });
    });
};

exports.registerPost = function(req, res) {
    ShoppingGroupModel.findOne({_id: req.body.selectedGroup }, function(err, result) {
        if(err) {
            req.flash('error', 'Error accessing data: ' + err);
            res.redirect('/register');
            return;
        }

        if(!result) {
            req.flash('error', 'No such group exists. Please try again.');
            res.redirect('/register');
            return;
        }

        if(result.users.some(function(user) { return user.userName == req.body.userName})) {
            req.flash('error', 'Account already exists. Please choose another user name');
            res.redirect('/register');
            return;
        }

        if(!comparePassword(result.passwordHash, req.body.groupPassword)) {
            req.flash('error', 'Group password was incorrect. Please try again.');
            res.redirect('/register');
            return;
        }

        result.users.push({userName: req.body.userName, passwordHash: getHashedPassword(req.body.password)});
        result.save(function(err) {
            if(err) {
                req.flash('error', 'Error saving data ' + err);
                res.redirect('register');
                return;
            }
            res.redirect('/login');
        });
    });
};

exports.groupGet = function(req, res) {
    res.render('group', {
        title: 'Create a group',
        flash: getFlashMsg(req)
    });
};

exports.groupPost = function(req, res) {
    ShoppingGroupModel.findOne({name: req.body.name}, function(err, results) {
        if(err) {
            req.flash('error', 'Error accessing data: ' + err);
            res.redirect('/group');
            return;
        }

        if(results) {
            req.flash('error', 'Error: Group "' + req.body.name + '" already exists!');
            res.redirect('/group');
            return;
        }

        var model = new ShoppingGroupModel({name: req.body.name, passwordHash: getHashedPassword(req.body.password)});
        model.save(function(err) {
            if(err) {
                req.flash('error', 'Error saving data: ' + err);
                res.redirect('/group');
            }
            res.redirect('/register');
        });
    });
};