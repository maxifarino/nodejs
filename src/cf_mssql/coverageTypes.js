const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const coverageTypesQueryProvider = require('../cf_providers/coveragetypes_query_provider');

exports.getCoverageTypes = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = coverageTypesQueryProvider.generateCoverageTypesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = coverageTypesQueryProvider.generateCoverageTypesQuery(params);
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

exports.createCoverageTypes = async (params, callback) => {	
	
	let query = coverageTypesQueryProvider.generateCoverageTypesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'CoveragesTypes');

	sql_helper.createTransaction(query, (err, result, coverageTypeId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, coverageTypeId);
	});
};

exports.updateCoverageTypes = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = coverageTypesQueryProvider.generateCoverageTypesUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.coverageTypeId);
	});
};

exports.removeCoverageTypes = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = coverageTypesQueryProvider.generateCoverageTypesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};