const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper')
const query_provider = require('../providers/query_provider');
const log_query_provider = require('../providers/log_query_provider');
const hashes_processor = require('../processors/hashes');

// Get system modules
exports.getSystemModules = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		query = log_query_provider.generateModulesQuery();
		result = await connection.request().query(query);
		connection.close();


		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			console.log("No log found.");
			callback(null, null);
		}
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

// Get users with log entries
exports.getLogUsers = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		query = log_query_provider.generateLogUsersQuery();
		result = await connection.request().query(query);
		connection.close();


		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			console.log("No log found.");
			callback(null, null);
		}
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

// Get log entries by User or / and Event Type or / and Date Time (TimeStamp)
exports.getLogEvents = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		var totalCount = 0;

		if(params.pageNumber) {
      params.getTotalCount = true;
			var query = log_query_provider.generateLogsQuery(params);
			var result = await connection.request().query(query);
      totalCount = result.recordset[0].totalCount;
		}

    params.getTotalCount = false;
		query = log_query_provider.generateLogsQuery(params);
		result = await connection.request().query(query);
		connection.close();
		if(!params.pageNumber) {
			totalCount = result.recordset.length;
		}

		if(result.recordset.length > 0){
			callback(null, result.recordset, totalCount);
		} else {
			console.log("No log found.");
			callback(null, null, null);
		}
	}
	catch(err) {
		console.log(err);
		callback(err, null, null);
	}
}

_elimSlash = (str) => {
  let res = str
  if (str[str.length-1] == '/') {
    res = str.slice(0, str.length-1)
  }
  return res
}

// Add new log entry
exports.addEntry = async function(params, callback) {

  params.eventDescription =  _elimSlash(params.eventDescription)

	const result = await _getLogEventTypeId(params)
	if(result.error) {
		return callback(result.error);
	}
	if(!result.eventTypeId) {
		let error = error_helper.getErrorData(error_helper.CODE_LOG_EVENT_TYPE_NOT_FOUND, error_helper.MSG_LOG_EVENT_TYPE_NOT_FOUND);
		return callback(error);
	}

	const queryParams = {
		EventType: result.eventTypeId,
		UserId: params.UserId,
		Payload: params.Payload
	};

	const query = log_query_provider.generateLogInsertQuery(queryParams);

	sql_helper.createTransaction(query, callback);
}

_getLogEventTypeId = async function(params) {
	console.log('Getting eventTypeId')
	let error = null;
	let eventTypeId = null;
	try {
    const connection = await sql_helper.getConnection();
		const query = log_query_provider.generateLogEventTypeIdQuery(params);
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			eventTypeId = result.recordset[0].Id;
			return { error, eventTypeId };
		} else {
			console.log("No log event found.");
			return { error, eventTypeId };
		}
	}
	catch(err) {
		error = err;
		return { error, eventTypeId };
	}
}