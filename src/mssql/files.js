const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const files_query_provider = require('../providers/files_query_provider');
const logger = require('./log');
const { writeLog } = require('./../utils')

exports.getFiles = async function (queryParams, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query;
		let result;
		let totalCount = 0;

		queryParams.getTotalCount = true;
		query = files_query_provider.generateGetFilesQuery(queryParams);
		result = await connection.request().query(query);
		totalCount = result.recordset[0].totalCount;

		queryParams.getTotalCount = false;
		query = files_query_provider.generateGetFilesQuery(queryParams);
		// writeLog('mssql/files, line 21, queryParams = ', queryParams)
		// writeLog('mssql/files, line 21, query = ', query)
		result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset, totalCount);
	}
	catch (err) {
		console.log(err);
		callback(err, null, null);
	}
};

exports.getFilesForSavedForms = async function (queryParams, callback) {
	try {

		const connection = await sql_helper.getConnection();
		let query = files_query_provider.generateGetFilesForSavedFormQuery(queryParams);
		let result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);

	} catch (err) {
		console.log(err);
		callback(err, null, null);
	}
}

exports.addDocumentFile = async function (params, callback) {
	try {
		let query = files_query_provider.generateFileInsertQuery(params);
		console.log('addDocumentFile',query);
		query = sql_helper.getLastIdentityQuery(query, 'Files');	
		console.log('addDocumentFile',query);

		sql_helper.createTransaction(query, function (err, result, newFileId) {

			if (err) {
				console.log('addDocumentFile',err);
				return callback(err);
			}
			callback(null, newFileId);

			/*const logParams = {
				eventDescription: params.logParams.eventDescription,
				UserId: params.logParams.userId,
				Payload: newFileId
			}

			logger.addEntry(logParams, function (err, result) {
				if (err) {
					console.log("There was an error creating log for: ");
					console.log(params.logParams);
					console.log(err);
				}

				return;
			});*/
		});
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};