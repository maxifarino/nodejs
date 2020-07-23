const Functions = require('../mssql/functions');
const error_helper = require('../helpers/error_helper');

// GET all functions
exports.getFunctions = async function(req, res) {
	var functions = await Functions.getFunctions();
	return res.status(200).json({ success: true, data: { functions: functions } });
};

exports.getFunctionAuthorization = async function(req, res) {
  var invalidData = false;

  if(!req.query)
    invalidData = true;

	if (!req.query.userId)
    invalidData = true;

  if (!req.query.functionId)
    invalidData = true;

  if(req.query.userId && (parseInt(req.query.userId) <= 0 || isNaN(parseInt(req.query.userId)))) invalidData = true;
  if(req.query.functionId && (parseInt(req.query.functionId) <= 0 || isNaN(parseInt(req.query.functionId)))) invalidData = true;

  if(invalidData) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  	const params = {};

  	params.userId = req.query.userId;
  	params.functionId = req.query.functionId;

  	Functions.getFunctionAuthorization(params, function(err, result) {
  		if(err) {
  			return res.send(err);
  		}
  		return res.status(200).json( { success: true, isAuthorized: result });
  	});
}

exports.checkFunctionPermission = async function(req, res) {
  var invalidData = false;

  if(!req.query)
    invalidData = true;

	if (!req.query.userId)
    invalidData = true;

  if (!req.query.functionName)
    invalidData = true;

  if(req.query.userId && (parseInt(req.query.userId) <= 0 || isNaN(parseInt(req.query.userId)))) invalidData = true;

  if(invalidData) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  	const params = {};

  	params.userId = req.query.userId;
  	params.functionName = req.query.functionName;

  	Functions.checkRolePermission(params, function(err, result) {
  		if(err) {
  			return res.send(err);
  		}
  		return res.status(200).json( { success: true, isAuthorized: result });
  	});
}