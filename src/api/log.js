const log = require('../mssql/log');
const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const _ = require('underscore')

// Get log entries by User or / and Event Type or / and Date Time (TimeStamp)
exports.getLogEvents = async function(req, res) {

  const data = {};
  let params = req.body
	let invalidData = false;

	if(params.pageSize && (parseInt(params.pageSize) <= 0 || isNaN(parseInt(params.pageSize)))) invalidData = true;
	if(params.pageNumber && (parseInt(params.pageNumber) <= 0 || isNaN(parseInt(params.pageNumber)))) invalidData = true;
  if(params.systemModuleId && (parseInt(params.systemModuleId) <= 0 || isNaN(parseInt(params.systemModuleId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	await log.getLogEvents(params, function(err, result, totalCount) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		data.totalCount = totalCount;
		data.logEntries = result
		return res.status(200).json({ success: true, data: data });
	});
};

// Add new log entry
exports.addLogEntry = async function(req, res) {
  //console.log('addLogEntry:Event ' + req.body.eventType);

  if (_.isEmpty(req.body) ||
		( _.isEmpty(req.body.eventType) && _.isEmpty(req.body.userId) )
	 ) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  var EventType = req.body.eventType;
  var UserId = req.body.userId;
  var Payload = req.body.payload;

  if(Payload == undefined)
    Payload = '';

  var columns = {
	  EventType,
	  UserId,
	  Payload
  };

  log.addEntry(columns, function(err, updated) {
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

    return res.status(200).json({ success: true });
  });
};

// Get users list foro users filter, only users with a log are included
exports.getLogUsers = async function(req, res) {
	await log.getLogUsers(function(err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: result });
	});
};

// Get users list foro users filter, only users with a log are included
exports.getSystemModules = async function(req, res) {
	await log.getSystemModules(function(err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: result });
	});
};
