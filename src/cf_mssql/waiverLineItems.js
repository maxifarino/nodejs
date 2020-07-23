const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const waiver_line_items_query_provider = require('../cf_providers/waiver_line_items_query_provider');

exports.getWaiverLineItems = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = waiver_line_items_query_provider.generateWaiverLineItemsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = waiver_line_items_query_provider.generateWaiverLineItemsQuery(params);
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

exports.createWaiverLineItems = async (params, callback) => {	
	
	let query = waiver_line_items_query_provider.generateWaiverLineItemsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'WaiverLineItems');

	sql_helper.createTransaction(query, (err, result, waiverLineItemId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, waiverLineItemId);
	});
};

exports.updateWaiverLineItems = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = waiver_line_items_query_provider.generateWaiverLineItemsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.waiverLineItemId);
	});
};

exports.removeWaiverLineItems = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = waiver_line_items_query_provider.generatewaiverLineItemsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};


exports.updateWaiverLineItems = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = waiver_line_items_query_provider.generatewaiverLineItemsUpdateQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};