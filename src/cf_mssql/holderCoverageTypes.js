const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const holderCoverageTypesQueryProvider = require('../cf_providers/holder_coveragetypes_query_provider');

exports.getHolderCoverageTypes = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = holderCoverageTypesQueryProvider.generateHolderCoverageTypesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = holderCoverageTypesQueryProvider.generateHolderCoverageTypesQuery(params);
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

exports.createHolderCoverageTypes = async (params, callback) => {	
	
	let query = holderCoverageTypesQueryProvider.generateHolderCoverageTypesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'HolderCoveragesTypes');

	sql_helper.createTransaction(query, (err, result, holderCoverageTypeId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, holderCoverageTypeId);
	});
};

exports.updateHolderCoverageTypes = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = holderCoverageTypesQueryProvider.generateHolderCoverageTypesUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.holderCoverageTypeId);
	});
};

exports.removeHolderCoverageTypes = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = holderCoverageTypesQueryProvider.generateHolderCoverageTypesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};