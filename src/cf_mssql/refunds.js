const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const refundsQueryProvider = require('../cf_providers/refunds_query_provider');

exports.getRefunds = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = refundsQueryProvider.generateRefundsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = refundsQueryProvider.generatereRundsQuery(params);
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

exports.createRefunds = async (params, callback) => {	
	
	let query = refundsQueryProvider.generateRefundsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Refunds');

	sql_helper.createTransaction(query, (err, result, refundId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, refundId);
	});
};

exports.updateRefunds = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = refundsQueryProvider.generateRefundsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.refundId);
	});
};

exports.removeRefunds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = refundsQueryProvider.generateRefundsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};