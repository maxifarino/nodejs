const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const coverages_query_provider = require('../cf_providers/coverages_query_provider');

exports.getCoverages = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = coverages_query_provider.generateCoveragesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = coverages_query_provider.generateCoveragesQuery(params);
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

exports.createCoverages = async (params, callback) => {	
	
	let query = coverages_query_provider.generateCoveragesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Coverages');

	sql_helper.createTransaction(query, (err, result, coverageId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, coverageId);
	});
};

exports.updateCoverages = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = coverages_query_provider.generateCoveragesUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.coverageId);
	});
};

exports.removeCoverages = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = coverages_query_provider.generateCoveragesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.coverageExpirations = async (params, callback) => {
	let result = {};	

  try {		
		const connection = await sql_helper.getConnection();		
		let query = coverages_query_provider.generateCoverageExpirations(params);
		result = await connection.request().query(query);
		
		console.log('RESULT ', result)
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getCoveragesTopLayers = async (params, callback) => {
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = coverages_query_provider.generateCoveragesTopLayersQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
			
		connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createCoveragesTopLayers = async (params, callback) => {	
	let query = coverages_query_provider.generateCoveragesTopLayersInsertQuery(params);
	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
		}
		callback(null, result);
	});
};

exports.getCoveragesAndAttributesStatus = async (params, callback) => {
	try {		
		let query = coverages_query_provider.getCoveragesAndAttributesStatusQuery(params)
		const connection = await sql_helper.getConnection();	
		result = await connection.request().query(query)
		connection.close();		
		
		callback(null, result.recordset);
	}
	catch(err) {
		callback(err, null);
	}

}