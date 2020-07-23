const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const coverage_attributes_query_provider = require('../cf_providers/coverage_attributes_query_provider');

exports.getCoverageAttributes = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = coverage_attributes_query_provider.generateCoverageAttributesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = coverage_attributes_query_provider.generateCoverageAttributesQuery(params);
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

exports.createCoverageAttributes = async (params, callback) => {	
	
	let query = coverage_attributes_query_provider.generateCoverageAttributesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'CoverageAttributes');

	sql_helper.createTransaction(query, (err, result, insurerId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, insurerId);
	});
};

exports.removeCoverageAttributes = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = coverage_attributes_query_provider.generateCoverageAttributesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};