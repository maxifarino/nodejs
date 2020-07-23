
const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const documentTypes_query_provider = require('../cf_providers/documenttypes_query_provider');


exports.getDocTypes = async function(params, callback) {

	try {
		const connection = await sql_helper.getConnection();

		var query = {};
		var result = {};
		var totalCount = 0;

    if(params.pageSize) {
      params.getTotalCount = true;
      query = documentTypes_query_provider.generateDocTypesQuery(params);
      result = await connection.request().query(query);
      if(result.recordset.length > 0) totalCount = result.recordset.length;
    }

    params.getTotalCount = false;
    query = documentTypes_query_provider.generateDocTypesQuery(params);
    result = await connection.request().query(query);
    connection.close();
    
    if(!params.pageSize) {
      totalCount = result.recordset.length;
    }
 
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null, null);
	}
}

exports.createDocTypes = async function(params, callback) {

	let query = documentTypes_query_provider.generateDocTypesInsertQuery(params);

	query = sql_helper.getLastIdentityQuery(query,'DocumentTypes');

	sql_helper.createTransaction(query, function(err, result, documentTypeId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, documentTypeId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: documentTypeId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			}
			return;
		});
	});
}

exports.updateDocTypes = async function(params, callback) {

	let query = documentTypes_query_provider.generateDocTypesUpdateQuery(params);

	sql_helper.createTransaction(query, function(err, result) {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.documentTypeId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.documentTypeId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			}
			return;
		});
	});
}