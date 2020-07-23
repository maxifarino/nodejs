// Internal dependencies
// HELPERS
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper')
const { writeLog } = require('../utils')

// PROVIDERS
const tasks_query_provider = require('../providers/tasks_query_provider');

// FACADES
const logger = require('./log');

exports.createTaskSimple = async function(params, callback) {
	let query = "";
	try {
    query = tasks_query_provider.generateTaskInsertSimpleQuery(params);
		// console.log(query);
		sql_helper.createTransaction(query, function(err) {
			if(err) {
				callback(err, query);
			}
		});
	}
	catch(err) {
		console.log(err);
	}
}

exports.createOrUpdateTask = async function(params, callback) {
	let query = "";

	if(!params.task.taskId)	
		query = tasks_query_provider.generateTaskInsertQuery(params.task);
	else
		query = tasks_query_provider.generateTaskUpdateQuery(params.task, params.userId);

	if(!params.task.taskId)	
		query = sql_helper.getLastIdentityQuery(query,'Tasks');

	sql_helper.createTransaction(query, function(err, result, taskId) {
		if(err) {
			console.log(err);
			return callback(err);
		}

		let locTaskId;

		if(!params.task.taskId)
			locTaskId = taskId;
		else
			locTaskId = params.task.taskId;

		callback(null, result, locTaskId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: locTaskId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}

exports.getTasks = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		var query;
		var result;
		var totalRowsCount = 0;		


		//Get Status list
		var queryContactsTypes = tasks_query_provider.generateTasksContactsTypesQuery();
		var resultContactsTypes = await connection.request().query(queryContactsTypes);

		var queryStatus = tasks_query_provider.generateTasksStatusQuery();
		var resultStatus = await connection.request().query(queryStatus);

		//Get Types list
		var queryTypes = tasks_query_provider.generateTasksTypesQuery(params.system);
		var resultTypes = await connection.request().query(queryTypes);

		//Get Asset Types list
		var queryPriorityTypes = tasks_query_provider.generatePrioritiesStatusQuery();
		var resultPriorityTypes = await connection.request().query(queryPriorityTypes);

		params.getTotalCount = true;
		query = tasks_query_provider.generateTasksQuery(params);
		result = await connection.request().query(query);
    totalRowsCount = result.recordset[0].totalCount;
    
		params.getTotalCount = false;
    query = tasks_query_provider.generateTasksQuery(params);
    // console.log('query = ', query)
    result = await connection.request().query(query);

		connection.close();

		for(let i = 0; i < result.recordset.length; i++) {
			let task = result.recordset[i];
			let hiringClientId = result.recordset[i].HiringClientId;
			let subcontractorId = result.recordset[i].subcontractorId;
			if(task.assetTypeId == 1) {
				hiringClientId = task.assetId;
			}

			let hc_sc_pair = {};
			hc_sc_pair.hiringClientId = hiringClientId;
			hc_sc_pair.subcontractorId = subcontractorId;
			result.recordset[i].hc_sc_pair = hc_sc_pair;
		}

		var responseData = {};
		responseData.tasksList = result.recordset;

		responseData.ContactsTypesPossibleValues = resultContactsTypes.recordset;
		responseData.StatusPossibleValues = resultStatus.recordset;
		responseData.TaskTypesPossibleValues = resultTypes.recordset;
		responseData.PriorityPossibleValues = resultPriorityTypes.recordset;

		callback(null, responseData, totalRowsCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getNotifications = async function(userId, callback) {
	try {
		const connection = await sql_helper.getConnection();

		//Get Status list
		var queryNotifications = tasks_query_provider.generateNotificationsQuery(userId);
		var resultNotifications = await connection.request().query(queryNotifications);
		connection.close();

		callback(null, resultNotifications.recordset[0].notificationsCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.addNotification = async function(userId, callback) {
	try {
		
		var queryNotifications = tasks_query_provider.generateAddNotificationsStatusQuery(userId);

		sql_helper.createTransaction(queryNotifications, function(err, result, id) {
		if(err) {
			return callback(err);
		}

		callback(null, null);

		});
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getLastWFWaitingTask = async function(hc_sc_pair, step, wf, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query = tasks_query_provider.generateGetLastWFTaskQuery(hc_sc_pair, step, wf);
		let result = await connection.request().query(query);
		connection.close();

		let returnValue = null;

		if(result.recordset.length > 0)
			returnValue = result.recordset[0];

		callback(null, returnValue);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getLastWFRemediationWaitingTask = async function(hiringClientId, subcontractorId, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query = tasks_query_provider.generateGetLastWFRemediationTaskQuery(hiringClientId, subcontractorId);
		let result = await connection.request().query(query);
		connection.close();

		let returnValue = null;

		if(result.recordset.length > 0)
			returnValue = result.recordset[0];

		callback(null, returnValue);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

