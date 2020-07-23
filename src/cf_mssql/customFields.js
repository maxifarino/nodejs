const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const customfields_query_provider = require('../cf_providers/customfields_query_provider');

exports.getCustomFields = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = customfields_query_provider.generateCustomFieldsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = customfields_query_provider.generateCustomFieldsQuery(params);
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

exports.createCustomFields = async (params, callback) => {	
	
	let query = customfields_query_provider.generateCustomFieldsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'CustomFields');

	sql_helper.createTransaction(query, (err, result, customFieldId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, customFieldId);
	});
};

exports.updateCustomFields = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = customfields_query_provider.generateCustomFieldsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.customFieldId);
	});
};

exports.removeCustomFields = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = customfields_query_provider.generateCustomFieldsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};