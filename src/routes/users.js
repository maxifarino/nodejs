// External dependencies
const express = require('express');
const router = express.Router();
const URL = require('url');
const jwt    = require('jsonwebtoken'); 
const _ = require('underscore');

// Internal dependencies
// FACADES
const Users = require('../mssql/users');

// PROCESSORS
const emailsProcessor = require('../processors/emails');

// HELPERS
const utils = require('../helpers/utils');
const error_helper = require('../helpers/error_helper');
const email_helper = require('../helpers/email_helper');
const auth_helper = require('../helpers/auth_helper');

// CONFIGURATION
const config = require('../config');

// Register page
/*router.get('/register', alreadyLoggedIn, function(req, res){
  res.render('register');
});*/

// Login page
router.get('/login', alreadyLoggedIn, function(req, res){
  res.render('login');
});

// Forgot password page
router.get('/forgot', alreadyLoggedIn, function(req, res){
  res.render('forgot');
});

function alreadyLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    redirectToDashboardOrUrl(req, res, req.user);
  } else {
    return next();
  }
}

function redirectToDashboardOrUrl(req, res, user){
  // create a token to return 
  //var token = jwt.sign(user.toObject(), config.secret, {
  var token = jwt.sign(user, config.secret, {
    expiresIn: process.env.TOKEN_EXPIRATION
  });

  // if there's a redirection url use it
  if(!_.isEmpty(req.query) && !_.isEmpty(req.query.redirect)){
    var uri = decodeURIComponent(req.query.redirect);
    uri = URL.format({
      pathname: uri,
      query: {
          "token": token
        }
      });

    // add http if missing
    if (uri.indexOf("http") == -1) {
      uri = "https://"+uri;
    }

    res.writeHead(302, {Location: uri});
    res.end();
  } else {
    // no redirection, send to index/dashboard
    var uri = URL.format({
      pathname: "/",
      query: {
          "token": token
        }
      });

    return res.redirect(uri);
  }
}

// Register User
/*router.post('/register', function(req, res){
  var name = req.body.name;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var password = req.body.password;
  var password2 = req.body.password2;

  // Validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('lastname', 'Lastname is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors){
    res.render('register',{
      errors:errors
    });
  } else {
    var newUser = new Users({
      name: name,
      lastname: lastname,
      email:email,
      password: password
    });

    Users.createUser(newUser, function(err, user){
      if (err) {
        var error = error_helper.getSqlErrorData (err);
        res.render('register',{
          errors:[{msg: error.data.description}]
        });
      } else {
        //console.log(user);
        req.flash('success_msg', 'You are registered and can now login');
        res.redirect('/users/login');
      }
      
    });
    
  }
});*/

// Forgot password
router.post('/forgot', function(req, res, next) {

  var email = req.body.email;

  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();

  var errors = req.validationErrors();

  if (errors){
    res.render('forgot',{
      errors:[errors[0]]
    });
  } else {
    // TODO: change to false when hashed
    Users.getUserByEmail(email, true, function(err, user){

      if (err) {
        return res.render('forgot',{
          errors:[{msg: "Something went wrong"}]
        });
      } 

      if (!user) {
        return res.render('forgot',{
          errors:[{msg: "No user found with that email"}]
        });
      }

      if (user.IsEnabled == 0 || user.IsEnabled == "0") {
        return res.render('forgot',{
          errors:[{msg: "User is disabled"}]
        });
      }

      if (user) {
        // redirection uri
        var uri = URL.format({
          pathname: "/users/login",
          query: req.query
        });

        var newPassword = utils.getRandomPassword();
        Users.changePassword(user.Id, newPassword, true, function(err, changed) {

          // if password is successfully changed, send an email
          if (changed) {
            const options = {};
            options.emailOptions = {
              to: user.Mail,
              name: user.FirstName,
              password: newPassword
            };

            options.templateName = process.env.EMAIL_PASSWORD_RECOVERY_TEMPLATE_NAME;
            options.emailOptions.alreadyLoaded = false;

            emailsProcessor.sendEmail(options, function(err, emailSent) {
              if (err) {
                console.log(err);
                req.flash('error_msg', 'Email failed');
                return res.redirect(uri); 
              } else {
                console.log(response);
                req.flash('success_msg', 'Email sent');
                return res.redirect(uri); 
              }
            });
          } else {
            console.log(err);
            req.flash('error_msg', 'Email failed');
            return res.redirect(uri); 
          }
        });
      }
    });
  }
});


// Login user
router.post('/login', function(req, res, next) {
  // store url and query params
  var thisUri = URL.format({
    pathname: "/users/login",
    query: req.query
  });

  //field validations
  var email = req.body.email;
  var password = req.body.password;
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  var errors = req.validationErrors();
  if (errors){
    req.flash('error_msg', errors[0].msg);
    return res.redirect(thisUri); 
  }

  // proceed to authentication
  auth_helper.authenticate(req, res, next, function(err, user, info) {

    // no user, reload page with same query
    if (err || !user) {
      var message = 'Oops, something went wrong';
      if(info.errorCode == error_helper.CODE_USER_NOT_FOUND) message = 'Unknown user';
      if(info.errorCode == error_helper.CODE_PASSWORD_FAILED) message = 'Invalid password';
      if(info.errorCode == error_helper.CODE_USER_DISABLED) message = 'User disabled';
      req.flash('error_msg', message);
      return res.redirect(thisUri); 
    }

    // login the user
    req.logIn(user, function(err) {
      if (err) {
        req.flash('error_msg', "Oops, something went wrong");
        return res.redirect(thisUri); 
      }
      
      redirectToDashboardOrUrl(req, res, user);
    });

  });

});

// Log out
router.get('/logout', function(req, res){
  req.logout();

  req.flash('success_msg', 'You are logged out');

  res.redirect('/users/login');
});

module.exports = router;