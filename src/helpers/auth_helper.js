const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = require('../mssql/users');
const error_helper = require('../helpers/error_helper');


passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    Users.getUserByEmail(email, true, function(err, user){
      const date = `${(new Date()).toLocaleString()}`
     	if (err) {
        console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/helpers/auth_helper.js,\n>ERROR TYPE: Unable to authenticate User and log in\n>ERROR msg: ' + err + '\n')
        return done(null, false, {errorCode: error_helper.CODE_MSSQL_ERROR});
      }
     	if(!user){
        console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/helpers/auth_helper.js,\n>ERROR TYPE: No User returned by getUserByEmail\n>ERROR msg: ' + err + '\n')
     		return done(null, false, {errorCode: error_helper.CODE_USER_NOT_FOUND});
     	}
      if (user.IsEnabled == 0 || user.IsEnabled == "0"){
        console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/helpers/auth_helper.js,\n>ERROR TYPE: User returned by getUserByEmail is not enabled\n>ERROR msg: ' + err + '\n')
        return done(null, false, {errorCode: error_helper.CODE_USER_DISABLED});
      } 

     	Users.comparePassword(password, user.Password, function(err, isMatch){
     		if (err) {
          console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/helpers/auth_helper.js,\n>ERROR TYPE: Unable to compare User password\n>ERROR msg: ' + err + '\n')
          return done(null, false, {errorCode: error_helper.CODE_MSSQL_ERROR});
        }
     		if(isMatch){
     			return done(null, user);
     		} else {
          console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/helpers/auth_helper.js,\n>ERROR TYPE: Unable to compare User password\n>ERROR msg: ' + err + '\n')
     			return done(null, false, {errorCode: error_helper.CODE_PASSWORD_FAILED});
     		}
     	});
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.Id);
});

passport.deserializeUser(function(id, done) {
  Users.getUserById(id, false, function(err, user) {
    done(err, user);
  });
});

exports.authenticate = function(req, res, next, callback) {
  passport.authenticate('local', callback)(req, res, next);
}