const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const attributes_query_provider = require('../cf_providers/attributes_query_provider');

exports.getAttributes = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = (params.settings) 
			? attributes_query_provider.generateAttributesByCoverageTypeQuery(params)
			: attributes_query_provider.generateAttributesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;

		if (params.pageSize) {
			params.getTotalCount = true;
			query = (params.settings) 
				? attributes_query_provider.generateAttributesByCoverageTypeQuery(params)
				: attributes_query_provider.generateAttributesQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		
		connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createAttributes = async (params, callback) => {	
	
	let query = attributes_query_provider.generateAttributesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Attributes');

	sql_helper.createTransaction(query, (err, result, attributeId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, attributeId);
	});
};

exports.updateAttributes = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = attributes_query_provider.generateAttributesUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.attributeId);
	});
};

exports.removeAttributes = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = attributes_query_provider.generateAttributesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};