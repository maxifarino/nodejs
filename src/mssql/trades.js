var _ = require('underscore');
const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');
const query_provider = require('../providers/trades_query_provider');
const logger = require('../mssql/log');

let trades = [];

exports.getTradesByLoggeduserId = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query = null;
		let totalRowsCount = 0;
		let result = null;

		if(params.pageNumber) {
			params.getTotalCount = true;
			query = query_provider.generateGetTradesBySCIdQuery(params);
			result = await connection.request().query(query);
			totalRowsCount = result.recordset[0].totalCount;
		}

		params.getTotalCount = false;
		query = query_provider.generateGetTradesBySCIdQuery(params);
		result = await connection.request().query(query);

		connection.close();

		callback(null, result.recordset, totalRowsCount);
	}
	catch (err) {
		console.log(err);
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getTradesByHCId = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query = null;
		let totalRowsCount = 0;
		let result = null;

		if(params.pageNumber) {
			params.getTotalCount = true;
			query = query_provider.generateGetTradesByHCIdQuery(params);
			result = await connection.request().query(query);
			totalRowsCount = result.recordset[0].totalCount;
		}

		params.getTotalCount = false;
		query = query_provider.generateGetTradesByHCIdQuery(params);
		result = await connection.request().query(query);

		connection.close();

		callback(null, result.recordset, totalRowsCount);
	}
	catch (err) {
		console.log(err);
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.AddOrUpdatedTrades = async function(params, callback) {

	let tradeParams = {}
	let hiringClientId = params.hiringClientId;
	let tradesList = params.tradesList;
	let query = "";

	for(i = 0; i < tradesList.length; i++) {
		let tradeParam = tradesList[i];
		if(!tradeParam.id && tradeParam.id != 0) {
			// No id then insert			
			tradeParams.value = tradeParam.value;
			tradeParams.description = tradeParam.description;
			tradeParams.hiringClientId = hiringClientId;
			tradeParams.orderIndex = tradeParam.orderIndex
			query += query_provider.generateAddTradeQuery(tradeParams);
		}
		else {
			// Has id then update existing trade record
			tradeParams.orderIndex = tradeParam.orderIndex
			
			if(tradeParam.description)
				tradeParams.description = tradeParam.description;

			tradeParams.id = tradeParam.id;
			query += query_provider.generateUpdateTradeQuery(tradeParams);
		}
	}

	sql_helper.createTransaction(query, function(err, result, projectId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectId);

		const logParams = {
			eventDescription: params.logParams.eventDescription,
			UserId: params.logParams.userId,
			Payload: hiringClientId
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