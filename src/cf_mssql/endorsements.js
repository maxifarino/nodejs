const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const endorsements_query_provider = require('../cf_providers/endorsements_query_provider');

exports.getEndorsements = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = endorsements_query_provider.generateEndorsementsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = endorsements_query_provider.generateEndorsementsQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
		connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createEndorsements = async (params, callback) => {	
	
	let query = endorsements_query_provider.generateEndorsementsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'endorsements');

	sql_helper.createTransaction(query, (err, result, endorsementId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, endorsementId);
	});
};

exports.updateEndorsements = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = endorsements_query_provider.generateEndorsementsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.endorsementId);
	});
};

exports.removeEndorsements = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = endorsements_query_provider.generateEndorsementsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};