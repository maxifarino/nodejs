// External Dependencies
const _ = require('underscore');

// Internal Dependencies
// FACADES
const Users = require('../mssql/users');
const Roles = require('../mssql/roles');
const TimeZones = require('../mssql/timezones');
// PROCESSORS
const emailsProcessor = require('../processors/emails');

// HELPERS
const utils = require('../helpers/utils');
const error_helper = require('../helpers/error_helper');
const email_helper = require('../helpers/email_helper');

// to use inside async functions
var _getUserById = async function(userId, getPassword) {
	var error = null;
	var user = null;
	var disabledError = null;
	var adminError = null;

	await Users.getUserById(userId, getPassword, function(err, response) {
    if (err){
      error = error_helper.getSqlErrorData (err);
    }
    if(!response){
      error = error_helper.getErrorData (error_helper.CODE_TOKEN_FAILED, error_helper.MSG_TOKEN_FAILED);
    }

    user = response;
  });

	// add error for disabled account
	if (user && !user.IsEnabled) {
  	disabledError = error_helper.getErrorData(error_helper.CODE_USER_DISABLED, error_helper.MSG_USER_DISABLED);
  }

  // add error for account not admin
  if (user && (!user.Role || user.Role.Name.toLowerCase().indexOf('admin') == -1)) {
  	adminError = error_helper.getErrorData(error_helper.CODE_USER_NOT_ALLOWED, error_helper.MSG_USER_NOT_ALLOWED);
  }

  return {error, user, disabledError, adminError};
}

// POST create user
exports.createUser = async function(req, res) {
  if (_.isEmpty(req.body) || _.isEmpty(req.body.firstName) || _.isEmpty(req.body.lastName) || 
      _.isEmpty(req.body.email) || _.isEmpty(req.body.roleId) || 
      _.isEmpty(req.body.mustRenewPass) || _.isEmpty(req.body.timeZoneId)) {
    var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // get the latest version of the current user
  var response = await _getUserById(req.currentUser.Id, false);
  if (response.error) {
  	return res.send(response.error);
  }
  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }
  //verify if current user is Admin
  if (response.adminError) {
    return res.send(response.adminError);
  }
	
  // current user is allowed, continue
  var FirstName = req.body.firstName;
  var LastName = req.body.lastName;
  var Mail = req.body.email;
  var RoleID = req.body.roleId;
  var IsEnabled = 1;
  var Password = req.body.password;
  var Phone = req.body.phone;
  var TimeZoneId = req.body.timeZoneId;
  var MustRenewPass = req.body.mustRenewPass;
  var HiringClientId = req.body.hiringClientId;
  var SubContractorId = req.body.subContractorId;

  // check for valid role 
  var role = await Roles.getUserRole({RoleID});
  if (role == null) {
  	var error = error_helper.getErrorData (error_helper.CODE_INVALID_ROLE, error_helper.MSG_INVALID_ROLE);
    return res.send(error);
  }

  // check for valid email
  if(!utils.isEmailValid(Mail)) {
  	var error = error_helper.getErrorData (error_helper.CODE_INVALID_EMAIL, error_helper.MSG_INVALID_EMAIL);
    return res.send(error);
  }
  
  // check for valid timezone
  var timeZone = await TimeZones.getUserTimeZone({TimeZoneId});
  if (timeZone == null) {
  	var error = error_helper.getErrorData (error_helper.CODE_INVALID_TIMEZONE, error_helper.MSG_INVALID_TIMEZONE);
    return res.send(error);
  }

  // if no password passed, create a random one
  if(_.isEmpty(Password)){
  	Password = utils.getRandomPassword();
    console.log(Password);
  }

  var user = { FirstName, LastName, Mail, RoleID, IsEnabled, Password, Phone, TimeZoneId, MustRenewPass, HiringClientId, SubContractorId };
  Users.createUser(user, function(err, created) {
    if (err){
    	var error;
    	if (err.originalError && err.originalError.info && err.originalError.info.message &&
    		err.originalError.info.message.indexOf('duplicate') != -1) {
	  		error = error_helper.getErrorData (error_helper.CODE_EMAIL_IN_USE, error_helper.MSG_EMAIL_IN_USE);
	  	} else {
	  		error = error_helper.getSqlErrorData (err);
	  	}
      return res.send(error);
    }

    if (created) {
      const options = {};
      options.emailOptions = {
        to: user.Mail,
        name: user.FirstName,
        password: user.Password
      };

      options.templateName = process.env.EMAIL_USER_CREATED_TEMPLATE_NAME;
      options.emailOptions.alreadyLoaded = false;

      emailsProcessor.sendEmail(options, function(err, emailSent) {
        if(err) {
          console.log("There was an error sending the email");
          console.log(err);
        }
        return res.status(200).json({ success: true, data: { userCreated: created, emailSent: emailSent } });
      });

    }else {
      return res.status(200).json({ success: true, data: { userCreated: false, emailSent: false } });
    }

  });
}

// POST enable/disable user
exports.enableUser = async function(req, res) {
	if (_.isEmpty(req.body) || _.isEmpty(req.body.userId) || _.isEmpty(req.body.enable)) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // get the latest version of the current user
  var response = await _getUserById(req.currentUser.Id, false);
  if (response.error) {
  	return res.send(response.error);
  }
  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }
  //verify if current user is Admin
  if (response.adminError) {
    return res.send(response.adminError);
  }

  // current user is verified, continue
  Users.enableUser(req.body.userId, req.body.enable, function(err, changed) {
    if (err){
      var error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }
    if(!changed){
      var error = error_helper.getErrorData (error_helper.CODE_USER_NOT_FOUND, error_helper.MSG_USER_NOT_FOUND);
      return res.send(error);
    }

    var enabledValue = (req.body.enable == "1" || req.body.enable >= 1) ? "1":"0";
    return res.status(200).json({ success: true, data: { IsEnabled: enabledValue } });
  });
};

// POST change user role
exports.changeUserRole = async function(req, res) {
	if (_.isEmpty(req.body) || _.isEmpty(req.body.userId) || _.isEmpty(req.body.roleId)) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // check for valid role 
  var role = await Roles.getUserRole({RoleID:req.body.roleId});
  if (role == null) {
  	var error = error_helper.getErrorData (error_helper.CODE_INVALID_ROLE, error_helper.MSG_INVALID_ROLE);
    return res.send(error);
  }

  // get the latest version of the current user
  var response = await _getUserById(req.currentUser.Id, false);
  if (response.error) {
  	return res.send(response.error);
  }
  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }
  //verify if current user is Admin
  if (response.adminError) {
    return res.send(response.adminError);
  }

  // current user is verified, continue
  Users.changeUserRole(req.body.userId, role.Id, function(err, changed) {
    if (err){
      var error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }
    if(!changed){
      var error = error_helper.getErrorData (error_helper.CODE_USER_NOT_FOUND, error_helper.MSG_USER_NOT_FOUND);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: { RoleID: role.Id } });
  });
};

// POST change user password
exports.changeUserPassword = async function(req, res) {
  if (_.isEmpty(req.body) || _.isEmpty(req.body.userId)) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // get the latest version of the current user
  var response = await _getUserById(req.currentUser.Id, false);
  if (response.error) {
    return res.send(response.error);
  }
  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }
  //verify if current user is Admin
  if (response.adminError) {
    return res.send(response.adminError);
  }

  // current user is verified, continue
  var response = await _getUserById(req.body.userId, false);
  if (response.error) {
    return res.send(response.error);
  }

  var user = response.user;

  var newPassword = req.body.password;
  if(_.isEmpty(newPassword)){
    newPassword = utils.getRandomPassword();
    console.log(newPassword);
  }

  var forceRenew = req.body.forceRenew == "true";
  console.log("must renew", forceRenew);

  Users.changePassword(req.body.userId, newPassword, forceRenew, function(err, changed) {
    if (err) {
      var error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }

    if (changed) {
      const options = {};
      options.emailOptions = {
        to: user.Mail,
        name: user.FirstName,
        password: newPassword
      };

      options.templateName = process.env.EMAIL_PASSWORD_CHANGED_BY_ADMIN_TEMPLATE_NAME;

      emailsProcessor.sendEmail(options, function(err, emailSent) {
        if(err) {
        console.log("There was an error sending the email");
        console.log(err);
        }
        return res.status(200).json({ success: true, data: { userCreated: created, emailSent: emailSent } });
      });
    }else {
      return res.status(200).json({ success: true, data: { passwordChanged: false, emailSent: false } });
    }

  });
};

// WARNING, ONLY FOR TESTING
exports.deleteUser = async function(req, res) {
	if (_.isEmpty(req.body) || _.isEmpty(req.body.userId)) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // get the latest version of the current user
  var response = await _getUserById(req.currentUser.Id, false);
  if (response.error) {
  	return res.send(response.error);
  }
  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }
  //verify if current user is Admin
  if (response.adminError) {
    return res.send(response.adminError);
  }

  Users.deleteUser(req.body.userId, function(err, deleted) {
    if (err){
      var error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: { userDeleted: deleted } });
  });
}
