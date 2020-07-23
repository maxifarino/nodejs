const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const query_provider = require('../providers/contracts_query_provider');
const logger = require('./log');

exports.getContracts = async function(id, projectId, projectName, subcontractorId, subcontractorName, 
							    	  orderBy, orderDirection, callback) {

	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateGetContractsQuery(id, projectId, projectName, subcontractorId, subcontractorName, 
							    	  orderBy, orderDirection);

		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			console.log("No contract found");
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.createContract = async function(params, callback) {

	let query = query_provider.generateContractInsertQuery(params);

	query = sql_helper.getLastIdentityQuery(query,'Projects');

	sql_helper.createTransaction(query, function(err, result, projectId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: projectId
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

exports.updateContract = async function(params, callback) {

	let query = query_provider.generateContractUpdateQuery(params);

	sql_helper.createTransaction(query, function(err, result, projectId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, params.id);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.id
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

exports.createContracts = async function(params, callback) {

	let query = "";

	for(i = 0; i < params.contractsList.length; i++) {
		let queryParams = params.contractsList[i];
		let id = queryParams.id;

		if(!id) {
			query += query_provider.generateContractInsertQuery(queryParams);
		}
		else {
			query += query_provider.generateContractUpdateQuery(queryParams);
		}
	}

	sql_helper.createTransaction(query, function(err, result, projectId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: null
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

exports.updateContracts = async function(params, callback) {

	let query = "";
	
	for(i = 0; i < params.contractsList.length; i++) {
		let queryParams = params.contractsList[i];

		query += query_provider.generateContractUpdateQuery(queryParams);
	}

	sql_helper.createTransaction(query, function(err, result, projectId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, params.id);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.id
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
