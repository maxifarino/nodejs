const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const insurers_coverages_query_provider = require('../cf_providers/insurers_coverages_query_provider');

exports.getInsurersCoverages = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = insurers_coverages_query_provider.generateInsurersCoveragesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = insurers_coverages_query_provider.generateInsurersCoveragesQuery(params);
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

exports.createInsurersCoverages = async (params, callback) => {	
	
	let query = insurers_coverages_query_provider.generateInsurersCoveragesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Insurers_Coverages');

	sql_helper.createTransaction(query, (err, result, insurerCoverageId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, insurerCoverageId);
	});
};

exports.removeInsurersCoverages = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = insurers_coverages_query_provider.generateInsurersCoveragesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};