const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const projects_query_provider = require('../providers/projects_query_provider');
const logger = require('./log');

exports.getProjects = async function (params, callback) {

	try {
		const connection = await sql_helper.getConnection();

		var query = {};
		var result = {};
		var totalCount = 0;
		
		// Check if user is HC

		query = projects_query_provider.generateGetRoleIsHCQuery(params.loggedUserId);
		result = await connection.request().query(query);
		let isHCRole = result.recordset[0].isHCRole == 1;
		let isSCRole = result.recordset[0].isSCRole == 1;
		let isPQRole = result.recordset[0].isPrequalRole == 1;
		params.isHCRole = isHCRole;
		params.isSCRole = isSCRole;
		params.isPQRole = isPQRole;

		if (params.pageSize) {
			params.getTotalCount = true;
			query = projects_query_provider.generateProjectsQuery(params);
			result = await connection.request().query(query);
			totalCount = result.recordset[0].totalCount;
		}

		
		
		params.getTotalCount = false;
		query = projects_query_provider.generateProjectsQuery(params);
		result = await connection.request().query(query);
		connection.close();

		if (!params.pageSize) {
			totalCount = result.recordset.length;
		}
		callback(null, result.recordset, totalCount);
	}
	catch (err) {
		console.log(err);
		callback(err, null, null);
	}
}

exports.createProject = async function (params, callback) {

	let query = projects_query_provider.generateProjectInsertQuery(params);

	query = sql_helper.getLastIdentityQuery(query, 'Projects');

	sql_helper.createTransaction(query, function (err, result, projectId) {
		if (err) {
			return callback(err);
		}
		callback(null, result, projectId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: projectId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			}
			return;
		});
	});
}

exports.updateProject = async function (params, callback) {

	let query = projects_query_provider.generateProjectUpdateQuery(params);

	sql_helper.createTransaction(query, function (err, result, projectId) {
		if (err) {
			return callback(err);
		}
		callback(null, result, params.id);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.id
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			}
			return;
		});
	});
}

exports.getProjectsStatus = async function (callback) {

	try {
		const connection = await sql_helper.getConnection();

		query = projects_query_provider.generateProjectsStatusQuery();
		result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}
