const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const projectinsureds_coverages_query_provider = require('../cf_providers/projectinsureds_coverages_query_provider');

exports.getProjectInsuredCoverages = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = projectinsureds_coverages_query_provider.generateProjectInsuredCoveragesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = projectinsureds_coverages_query_provider.generateProjectInsuredCoveragesQuery(params);
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

exports.createProjectInsuredCoverages = async (params, callback) => {	
	
	let query = projectinsureds_coverages_query_provider.generateProjectInsuredCoveragesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'ProjectInsureds_Coverages');

	sql_helper.createTransaction(query, (err, result, projectInsuredCoverageId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectInsuredCoverageId);
	});
};

exports.removeProjectInsuredCoverages = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = projectinsureds_coverages_query_provider.generateProjectInsuredCoveragesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};