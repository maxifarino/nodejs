const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const customterms_query_provider = require('../cf_providers/customterms_query_provider');

exports.getCustomTerms = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = customterms_query_provider.generateCustomTermsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = customterms_query_provider.generateCustomTermsQuery(params);
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

exports.createCustomTerms = async (params, callback) => {	
	
	let query = customterms_query_provider.generateCustomTermsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'CustomTerms');

	sql_helper.createTransaction(query, (err, result, customFieldId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, customFieldId);
	});
};

exports.updateCustomTerms = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = customterms_query_provider.generateCustomTermsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.customFieldId);
	});
};

exports.removeCustomTerms = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = customterms_query_provider.generateCustomTermsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};