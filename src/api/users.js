// External dependencies
const _ = require('underscore');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./log');
const { writeLog } = require('../utils')

// Internal dependencies
// CONFIGURATIONS
const config = require('../config');

// FACADES
const Users = require('../mssql/users');
const Roles = require('../mssql/roles');
const Titles = require('../mssql/titles');
const TimeZones = require('../mssql/timezones');
const ChangedLookups = require('../mssql/changedlookups');
// const Emails = require('../mssql/emails');

// PROCESSORS
const emailsProcessor = require('../processors/emails');

// HELPERS
const utils = require('../helpers/utils');
const error_helper = require('../helpers/error_helper');
const auth_helper = require('../helpers/auth_helper');
// const email_helper = require('../helpers/email_helper');

// Providers
const templates = require('../providers/templates_provider');

// to use inside async functions
let _getUserById = async function(userId, getPassword) {
	let error = null;
	let user = null;
	let disabledError = null;

	await Users.getUserById(userId, getPassword, function(err, response) {
    if (err){
      error = error_helper.getSqlErrorData (err);
    }
    if(!response){
      error = error_helper.getErrorData (error_helper.CODE_TOKEN_FAILED, error_helper.MSG_TOKEN_FAILED);
    }

    // console.log('getUserById error = ', error)
    // console.log('getUserById response = ', response)

    user = response;
  });

	// add error for disabled account
	if (user && !user.IsEnabled) {
  	disabledError = error_helper.getErrorData(error_helper.CODE_USER_DISABLED, error_helper.MSG_USER_DISABLED);
  }

  return {error, user, disabledError};
}

// to use inside async functions
let _getUserByMail = async function(userMail, getPassword) {
  let error = null;
  let user = null;
  let disabledError = null;

  await Users.getUserByEmail(userMail, getPassword, function(err, response) {
    if (err){
      error = error_helper.getSqlErrorData (err);
    }
    if(!response){
      error = error_helper.getErrorData (error_helper.CODE_USER_NOT_FOUND, error_helper.MSG_USER_NOT_FOUND);
    }

    user = response;
  });

  // add error for disabled account
  if (user && !user.IsEnabled) {
    disabledError = error_helper.getErrorData(error_helper.CODE_USER_DISABLED, error_helper.MSG_USER_DISABLED);
  }

  return {error, user, disabledError};
}

// ------------------- Customer EPs -------------------
// POST get session token
exports.getAPIToken = function(req, res, next) {
	if (_.isEmpty(req.body) || _.isEmpty(req.body.email) || _.isEmpty(req.body.password)) {
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');

	auth_helper.authenticate(req, res, next, function(err, user, info) {
    if (err || !user) {
    	let error;
    	if(info.errorCode == error_helper.CODE_USER_NOT_FOUND){
    		error = error_helper.getErrorData(error_helper.CODE_USER_NOT_FOUND, error_helper.MSG_USER_NOT_FOUND);
    	} else if (info.errorCode == error_helper.CODE_PASSWORD_FAILED) {
    		error = error_helper.getErrorData(error_helper.CODE_PASSWORD_FAILED, error_helper.MSG_PASSWORD_FAILED);
    	} else if (info.errorCode == error_helper.CODE_USER_DISABLED) {
    		error = error_helper.getErrorData(error_helper.CODE_USER_DISABLED, error_helper.MSG_USER_DISABLED);
    	} else {
    		error = error_helper.getSqlErrorData();
    	}

      return res.send(error);
    }

    const tokenPayload = {
      Id: user.Id,
      Role: {
        Id: user.RoleID
      },
      FirstName: user.FirstName,
      LastName: user.LastName,
      Mail: user.Mail,
      hiringClientId: user.FirstHiringClientId
    }

    let token = jwt.sign(tokenPayload, config.secret, {
      expiresIn: parseInt(process.env.TOKEN_EXPIRATION)
    });

    return res.status(200).json({ success: true, token: token });
  });
}
// ------------------- Customer EPs -------------------

// POST get session token
exports.getToken = function(req, res, next) {
	if (_.isEmpty(req.body) || _.isEmpty(req.body.email) || _.isEmpty(req.body.password)) {
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');

	auth_helper.authenticate(req, res, next, function(err, user, info) {
    if (err || !user) {
    	//console.log(err, user, info);
    	let error;
    	if(info.errorCode == error_helper.CODE_USER_NOT_FOUND){
    		error = error_helper.getErrorData(error_helper.CODE_USER_NOT_FOUND, error_helper.MSG_USER_NOT_FOUND);
    	} else if (info.errorCode == error_helper.CODE_PASSWORD_FAILED) {
    		error = error_helper.getErrorData(error_helper.CODE_PASSWORD_FAILED, error_helper.MSG_PASSWORD_FAILED);
    	} else if (info.errorCode == error_helper.CODE_USER_DISABLED) {
    		error = error_helper.getErrorData(error_helper.CODE_USER_DISABLED, error_helper.MSG_USER_DISABLED);
    	} else {
    		error = error_helper.getSqlErrorData();
    	}

      return res.send(error);
    }

    const tokenPayload = {
      Id: user.Id,
      Role: {
        Id: user.RoleID
      },
      CFRole: {
        Id: user.CFRoleId
      },
      FirstName: user.FirstName,
      LastName: user.LastName,
      Mail: user.Mail
    }

    // login the user
    req.logIn(user, function(err) {
      if (err){
        let error = error_helper.getLoginErrorData (error_helper.CODE_LOGIN_ERROR, error_helper.MSG_LOGIN_ERROR, err);
        return res.send(error);
      }

      user.Password = undefined;
      let token = jwt.sign(tokenPayload, config.secret, {
        expiresIn: parseInt(process.env.TOKEN_EXPIRATION)
      });

      ChangedLookups.updateChangedLookups(function (err, updated, id) {
        console.log("err:", err);
        console.log("changed lookups updated:", updated);
        return res.status(200).json({ success: true, data: { token: token, profile: user } });
      });
    });
  });
}

// GET user profile
exports.checkMail = async function(req, res) {
  let mail = req.query.mail;
  let invalidData = false;

  if(!mail) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  Users.checkMail(mail, function(err, exists) {
    if (err){
      let error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: { mailExists: exists } });
  });
};
// console.log('USER !!! '.repeat(30))
// GET user profile
exports.getProfile = async function(req, res) {
  const userId = req.currentUser.Id
  const response = await _getUserById (userId, false);

	if (response.error){
        // console.log('api/users, line 156, response = ', response)
        // console.log('api/users, line 157, userId = ', userId)
    return res.send(response.error);
  }

  return res.status(200).json({ success: true, data: { profile: response.user } });
};

const ifIsStringNullThenDefault = (param, _default) => {
  let output = null
  if (_default == 0 || _default) {
    output = _default
  }

  if (param && param != 'null') {
    output = param
  }
  return output
}

const parseSharedParams = (req) => {
  const params = {}

  params.FirstName         = ifIsStringNullThenDefault(req.body.firstName);
  params.LastName          = ifIsStringNullThenDefault(req.body.lastName);
  params.Mail              = ifIsStringNullThenDefault(req.body.mail);
  params.RoleId            = ifIsStringNullThenDefault(req.body.roleId);
  params.CFRoleId          = ifIsStringNullThenDefault(req.body.CFRoleId);
  params.IsEnabled         = ifIsStringNullThenDefault(req.body.IsEnabled, 1);
  params.TitleId           = ifIsStringNullThenDefault(req.body.titleId, 0);
  params.Phone             = ifIsStringNullThenDefault(req.body.phone);
  params.CellPhone         = ifIsStringNullThenDefault(req.body.cellPhone);
  params.TimeZoneId        = ifIsStringNullThenDefault(req.body.timeZoneId, 0);
  params.MustRenewPass     = ifIsStringNullThenDefault(req.body.mustRenewPass, 0);
  params.IsContact         = ifIsStringNullThenDefault(req.body.IsContact, 0);
  params.Password          = ifIsStringNullThenDefault(req.body.password) ? crypto.createHash('md5').update(req.body.password).digest('hex') : null;

  return params
}

const checkMailTitleTimeZone = async (params, callback) => {
  let error = ''
  // check for valid email if any
  if (params.Mail) {
    if(!utils.isEmailValid(params.Mail)) {
      error = await error_helper.getErrorData (error_helper.CODE_INVALID_EMAIL, error_helper.MSG_INVALID_EMAIL);
    }
  }

  // check for valid Title
  let title = ''
  if (params.TitleId) {
    title = await Titles.getUserTitle(params.TitleId);
    if (!title) {
      error = await error_helper.getErrorData (error_helper.CODE_INVALID_TITLE, error_helper.MSG_INVALID_TITLE);
    }
  }

  // check for valid timeZone
  let timeZone = ''
  if (params.TimeZoneId) {
    timeZone = await TimeZones.getUserTimeZone( params.TimeZoneId );
    if (!timeZone) {
      error = await error_helper.getErrorData (error_helper.CODE_INVALID_TIMEZONE, error_helper.MSG_INVALID_TIMEZONE);
    }
  }
  callback(error)
}

// POST user profile FOR GES
exports.createGESUser = async function(req, res) {
  let error = ''

  const params             = parseSharedParams(req)

  if (req.body.HiringClientsMultiple && req.body.HiringClientsMultiple.length > 1) {
    params.HiringClientsMultiple = req.body.HiringClientsMultiple
  }

  if (req.body.SubcontractorsMultiple && req.body.SubcontractorsMultiple.length > 1) {
    params.SubcontractorsMultiple = req.body.SubcontractorsMultiple
  }

  params.HiringClientId    = ifIsStringNullThenDefault(req.body.HiringClientId);
  params.subContractorId   = ifIsStringNullThenDefault(req.body.subContractorId);
  params.MustUpdateProfile = 0

  // console.log('createUser '.repeat(50))
  // console.log('params = ', params)

  // check for req.body, Id, RoleId or CFRoleId
  if ( _.isEmpty(params) || ( _.isEmpty(params.FirstName) && _.isEmpty(params.LastName) && _.isEmpty(params.Mail) ) ) {
    error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  }

  checkMailTitleTimeZone(params, (err) => {
    error = err
  })

  if (error) {
    console.log('ERROR 255 '.repeat(50))
    console.log('error = ', error)
    console.log('params = ', params)
    return res.send(error);
  }

  const method = req.method;
  // const originalUrl = req.originalUrl;
  // params.userId = req.currentUser.Id;
  // params.eventDescription = method + '/' + originalUrl;

  Users.createUser(params, function(err, updated, userId) {
    if (err){
      let error;
      if (err.originalError && err.originalError.info && err.originalError.info.message &&
        err.originalError.info.message.indexOf('duplicate') != -1) {
        error = error_helper.getErrorData (error_helper.CODE_EMAIL_IN_USE, error_helper.MSG_EMAIL_IN_USE);
      } else {
        error = error_helper.getSqlErrorData (err);
      }
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: { userId } });
  });
};

// POST user profile
exports.createUser = async function(req, res) {
  let error = ''

  const params             = parseSharedParams(req)

  if (req.body.HiringClientsMultiple && req.body.HiringClientsMultiple.length > 1) {
    params.HiringClientsMultiple = req.body.HiringClientsMultiple
  }

  if (req.body.SubcontractorsMultiple && req.body.SubcontractorsMultiple.length > 1) {
    params.SubcontractorsMultiple = req.body.SubcontractorsMultiple
  }

  params.HiringClientId    = ifIsStringNullThenDefault(req.body.HiringClientId);
  params.subContractorId   = ifIsStringNullThenDefault(req.body.subContractorId);
  params.MustUpdateProfile = 0

  // console.log('createUser '.repeat(50))
  // console.log('params = ', params)

  // check for req.body, Id, RoleId or CFRoleId
  if ( _.isEmpty(params) || ( _.isEmpty(params.FirstName) && _.isEmpty(params.LastName) && _.isEmpty(params.Mail) ) ) {
    error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  }

  checkMailTitleTimeZone(params, (err) => {
    error = err
  })

  if (error) {
    console.log('ERROR 255 '.repeat(50))
    console.log('error = ', error)
    console.log('params = ', params)
    return res.send(error);
  }

  const method = req.method;
  const originalUrl = req.originalUrl;
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  Users.createUser(params, function(err, updated, userId) {
    if (err){
    	let error;
    	if (err.originalError && err.originalError.info && err.originalError.info.message &&
    		err.originalError.info.message.indexOf('duplicate') != -1) {
	  		error = error_helper.getErrorData (error_helper.CODE_EMAIL_IN_USE, error_helper.MSG_EMAIL_IN_USE);
	  	} else {
	  		error = error_helper.getSqlErrorData (err);
	  	}
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: { userId } });
  });
};

// PUT user profile
exports.updateUser = async function(req, res) {
  let error = ''

  const params             = parseSharedParams(req)

  if (req.body.HiringClientsMultiple && req.body.HiringClientsMultiple.length >= 1) {
    params.HiringClientsMultiple = req.body.HiringClientsMultiple
  }

  if (req.body.SubcontractorsMultiple && req.body.SubcontractorsMultiple.length > 1) {
    params.SubcontractorsMultiple = req.body.SubcontractorsMultiple
  }

  params.HiringClientId    = ifIsStringNullThenDefault(req.body.HiringClientId);
  params.subContractorId   = ifIsStringNullThenDefault(req.body.subContractorId);
  params.MustUpdateProfile = ifIsStringNullThenDefault(req.body.mustUpdateProfile);

  params.Id                = ifIsStringNullThenDefault(req.body.id);

  // console.log('updateUser '.repeat(50))
  // console.log('params = ', params)

  // check for req.body, Id, RoleId or CFRoleId
  if ( _.isEmpty(params) || !params.Id || (!params.CFRoleId && !params.RoleId) ) {
    error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  }

  checkMailTitleTimeZone(params, (err) => {
    error = err
  })

  if (error) {
    console.log('ERROR 301 '.repeat(50))
    console.log('error = ', error)
    console.log('params = ', params)
    return res.send(error);
  }

  const method = req.method;
  const originalUrl = req.originalUrl;
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  Users.updateUser(params, function(err, updated) {
    if (err){
      let error;
      if (err.originalError && err.originalError.info && err.originalError.info.message &&
        err.originalError.info.message.indexOf('duplicate') != -1) {
        error = error_helper.getErrorData (error_helper.CODE_EMAIL_IN_USE, error_helper.MSG_EMAIL_IN_USE);
      } else {
        error = error_helper.getSqlErrorData (err);
      }
      console.log('ERROR 435 '.repeat(50))
      return res.send(error);
    }

    // console.log('updated = ', updated)

    return res.status(200).json({ success: true, data: { profileUpdated: updated } });
  });
};

// GET all users
exports.getUsers = function(req, res) {

  const searchTerm              = req.query.searchTerm
  const projectId              = req.query.projectId
  const roleId                  = req.query.roleId
  const CFRoleId                = req.query.CFRoleId
  const hiringClientId          = req.query.hiringClientId
  const subcontractorId         = req.query.subcontractorId
  const pageSize                = req.query.pageSize
  const pageNumber              = req.query.pageNumber
  const orderBy                 = req.query.orderBy
  const orderDirection          = req.query.orderDirection
  const showBothHCandSCusers    = req.query.showBothHCandSCusers ? Boolean(req.query.showBothHCandSCusers) : false
  const withoutPagination       = Boolean(req.query.withoutPagination)
  const associatedOnly          = Number(req.query.associatedOnly)
  const searchCFOnly            = req.query.searchCFOnly
  const searchPQOnly            = req.query.searchPQOnly
  const searchForHolder            = req.query.searchForHolder
  const holderUsersArchived            = req.query.holderUsersArchived
  let   invalidData             = false;

  if(pageSize && (parseInt(pageSize) <= 0 || isNaN(parseInt(pageSize)))) invalidData = true;
	if(pageNumber && (parseInt(pageNumber) <= 0 || isNaN(parseInt(pageNumber)))) invalidData = true;

  // let
  //   doesHCexist = (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))),
  //   doesSCexist = (subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId))))

  // if(!doesHCexist && !doesSCexist) invalidData = true;


  if(!(
    orderBy == 'id' ||
    orderBy == 'firstName' ||
    orderBy == 'lastName' ||
    orderBy == 'name' ||
    orderBy == 'firstName, lastName' ||
    orderBy == 'mail' ||
    orderBy == 'roleId' ||
    orderBy == 'CFRoleId' ||
    orderBy == 'role' ||
    orderBy == 'CFRole' ||
    orderBy == 'isEnabled' ||
    orderBy == 'titleId' ||
    orderBy == 'title' ||
    orderBy == 'phone' ||
    orderBy == 'cellPhone' ||
    orderBy == 'timeZoneId' ||
    orderBy == 'timeZone' ||
    orderBy == 'mustRenewPass' ||
    orderBy == 'mustUpdateProfile' ||
    orderBy == 'status' ||
    orderBy == 'company' ||
    orderBy == 'timeStamp'
    )) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
	}

	let query = {
		searchTerm,
		roleId,
    CFRoleId,
    orderBy,
    orderDirection,
    hiringClientId,
    subcontractorId,
    pageSize,
    pageNumber,
    userId: req.currentUser.Id,
    associatedOnly,
    withoutPagination,
    showBothHCandSCusers,
    projectId,
    searchForHolder,
    holderUsersArchived,
    searchCFOnly,
    searchPQOnly,
  }

  Users.getUsers(query, async function(err, users, totalCount) {
    if (err){
      let error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }
    let data = {};
    data.totalCount = totalCount;
    data.users = users;
		removeCompanyOnCertainRoles(data);
    return res.status(200).json({ success: true, data: data });
  });
};

const removeCompanyOnCertainRoles = data => {
	const modifiedList = data.users;
	const CFRoles = [10, 11, 20, 21, 22, 23];
	const PQRoles = [3, 4, 6];
	data.users = modifiedList.map(user => {
		if (!CFRoles.includes(user.CFRoleId) && !PQRoles.includes(user.roleID)) user.company = '';
		return user;
	});
}

// POST change user password
exports.changePassword = async function(req, res) {
	let oldPassword = req.body.oldPassword;
	let newPassword = req.body.newPassword;

	// check the input
	if (_.isEmpty(oldPassword) || _.isEmpty(newPassword)) {
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }


  // validate new password
  if (!utils.isPasswordValid(newPassword)) {
  	let error = error_helper.getErrorData (error_helper.CODE_INVALID_PASSWORD, error_helper.MSG_INVALID_PASSWORD);
    return res.send(error);
  }

  // get the latest version of the current user
  let response = await _getUserById(req.currentUser.Id, true);
  if (response.error) {
  	return res.send(response.error);
  }
  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }

  // user is enabled, continue
  let user = response.user;
  // validate the input with the stored password
  cryptOldPassword = crypto.createHash('md5').update(oldPassword).digest('hex');
  cryptNewPassword = crypto.createHash('md5').update(newPassword).digest('hex');
  Users.comparePassword(cryptOldPassword, user.Password, function(err, isMatch) {
 		if (err) {
      let error = error_helper.getSqlErrorData (err);
    	return res.send(error);
    }
 		if(isMatch){
 			// password is correct, lets change it
 			Users.changePassword(user.Id, cryptNewPassword, false, function(err, changed) {
 				if (err) {
	        let error = error_helper.getSqlErrorData (err);
	      	return res.send(error);
	      }

	      return res.status(200).json({ success: true, data: { passwordChanged: changed } });
 			});

 		} else {
 			let error = error_helper.getErrorData (error_helper.CODE_PASSWORD_FAILED, error_helper.MSG_PASSWORD_FAILED);
    	return res.send(error);
 		}
 	});

};

// POST reset password and get email
exports.resetPassword = async function(req, res) {
  if (_.isEmpty(req.body.email)) {
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // validate email
  if (!utils.isEmailValid(req.body.email)) {
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_EMAIL, error_helper.MSG_INVALID_EMAIL);
    return res.send(error);
  }

	// get the latest version of the current user
  let response = await _getUserByMail(req.body.email, false);
  if (response.error) {
  	return res.send(response.error);
  }

  //verify if current user is enabled
  if (response.disabledError) {
    return res.send(response.disabledError);
  }

  // user is enabled, continue
  let user = response.user;
  let newPassword = utils.getRandomPassword();

  cryptNewPassword = crypto.createHash('md5').update(newPassword).digest('hex');

  Users.changePassword(user.Id, cryptNewPassword, true, async function(err, changed) {
		if (err) {
      let error = error_helper.getSqlErrorData (err);
    	return res.send(error);
    }

    // if password is successfully changed, send an email
    if(changed) {
      const options = {}

      options.emailOptions = {
        to: user.Mail,
        name: user.FirstName,
        password: newPassword
      };

      options.templateName = process.env.EMAIL_PASSWORD_RECOVERY_TEMPLATE_NAME;
      options.emailOptions.alreadyLoaded = false;

      emailsProcessor.sendEmail(options, function(err, emailSent) {
        if(err) {
          console.log("There was an error sending the email");
          console.log(err)
        }
        return res.status(200).json({ success: true, data: { passwordChanged: changed, emailSent: emailSent } });
      });

    }else {
    	return res.status(200).json({ success: true, data: { passwordChanged: false, emailSent: false } });
    }
	});
}

// GET users related to logged users from HC and SC (non PQ users)
exports.getUsersBrief = function(req, res) {
  let invalidData = false
  let query = req.query;
  let userId = req.currentUser.Id;
  let roleId = req.currentUser.Role.Id;
  let hiringClientId;

  if(!query) {
    invalidData = true;
  }
  else {
    hiringClientId = query.hiringClientId;
    subcontractorId = query.subcontractorId;
    if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
    if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.status(500).send(error);
  }

  Users.getUsersBrief(userId, hiringClientId, subcontractorId, roleId, function(err, users) {
    if (err){
      console.log(err);
      let error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, users: users });
  });
};


// GET user mustpay
exports.getMustPay = async function(req, res) {
  const userId = req.currentUser.Id
  const roleId = req.currentUser.Role.Id;
  let query = req.query;
  let invalidData = false;
  let hiringClientId;
  let subcontractorId;

  if(!query) {
    invalidData = true;
  }
  else {
    hiringClientId = query.hiringClientId;
    subcontractorId = query.subcontractorId;
    if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
    if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.status(500).send(error);
  }
  // console.log(query);
  await Users.getMustPay(userId, hiringClientId, subcontractorId, roleId, function(err, response) {
    if (err && !response) {
      const msg = 'Contact System Administrator...Error: ' + err
      return res.send(msg);
    }
    // console.log('response = ', response)
    return res.status(200).json({ success: true, data: response });
  });
};

exports.getUsersHiringClientsAndOrSubcontractors = async (req, res) => {
  let invalidData = false
  let query = req.query;
  let userId = query.userId

  if(!query) {
    invalidData = true;
  } else {
    if (userId && (parseInt(userId) <= 0 || isNaN(parseInt(userId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.status(500).send(error);
  }

  Users.getUsersHiringClientsAndOrSubcontractors(userId, function(err, HCsAndOrSCs) {
    if (err){
      const date = `${(new Date()).toLocaleString()}`
      console.log('\n>DATE : ' + date + ',\n>FUNCTION: getUsersHiringClientsAndOrSubcontractors,\n>ERROR: ' + err + ', \n>QUERY: ', query)
      const error = error_helper.getSqlErrorData (err);
      return res.send(error);
    }

    const parseHcsAndSubs = (_HCsAndOrSCs) => {
      const hcs    = []
      const subs   = []
      let   output = { hcs, subs }
      if (_HCsAndOrSCs && _HCsAndOrSCs.length && _HCsAndOrSCs.length > 0) {
        // console.log(_HCsAndOrSCs)
        for (let i=0; i<_HCsAndOrSCs.length; i++) {
          const hcAndOrSub = _HCsAndOrSCs[i]
          // console.log('hcAndOrSub.hcId = ', hcAndOrSub.hcId)
          if (_HCsAndOrSCs[i].hcId && (i == 0 || _HCsAndOrSCs[i-1].hcId != _HCsAndOrSCs[i].hcId)) {
            hcs.push({
              id: hcAndOrSub.hcId,
              name: hcAndOrSub.hcName
            })
          }
          if (_HCsAndOrSCs[i].subId && (i == 0 || _HCsAndOrSCs[i-1].subId != _HCsAndOrSCs[i].subId)) {
            subs.push({
              id: hcAndOrSub.subId,
              name: hcAndOrSub.subName
            })
          }
        }

        output = {
          hcs,
          subs
        }
      }
      return output
    }


    const obj = parseHcsAndSubs(HCsAndOrSCs)

    // console.log('GET HCs AND SUBs = '.repeat(50))
    // console.log('HCsAndOrSCs = ', HCsAndOrSCs)
    // console.log('obj = ', obj)
    return res.status(200).json({ success: true, data: {
                                                          hiringClients: obj.hcs,
                                                          subContractors: obj.subs
                                                        }
    });
  });
}