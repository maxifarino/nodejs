const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const tags_query_provider = require('../cf_providers/tags_query_provider');


exports.getTags = async function(params, callback) {

	try {
		const connection = await sql_helper.getConnection();

		var query = {};
		var result = {};
		var totalCount = 0;

    if(params.pageSize) {
      params.getTotalCount = true;
      query = tags_query_provider.generateTagsQuery(params);
      result = await connection.request().query(query);
      if(result.recordset.length > 0) totalCount = result.recordset.length;
    }

    params.getTotalCount = false;
    query = tags_query_provider.generateTagsQuery(params);
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

exports.createTags = async function(params, callback) {

	let query = tags_query_provider.generateTagsInsertQuery(params);

	query = sql_helper.getLastIdentityQuery(query,'Tags');

	sql_helper.createTransaction(query, function(err, result, tagId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, tagId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: tagId
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

exports.updateTags = async function(params, callback) {

	let query = tags_query_provider.generateTagsUpdateQuery(params);

	sql_helper.createTransaction(query, function(err, result) {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.tagId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.tagId
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