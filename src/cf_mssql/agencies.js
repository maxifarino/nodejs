const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const agenciesQueryProvider = require('../cf_providers/agencies_query_provider');

exports.getAgencies = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = (params.insuredId) 
			? agenciesQueryProvider.generateInsuredAgenciesQuery(params) 
			: agenciesQueryProvider.generateAgenciesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = (params.insuredId)
				? agenciesQueryProvider.generateInsuredAgenciesQuery(params) 
				: agenciesQueryProvider.generateAgenciesQuery(params);
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

exports.createAgencies = async (params, callback) => {	
	
	let query = agenciesQueryProvider.generateAgenciesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Agencies');

	sql_helper.createTransaction(query, (err, result, agencyId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, agencyId);
	});
};

exports.updateAgencies = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = agenciesQueryProvider.generateAgenciesUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.agencyId);
	});
};

exports.removeAgencies = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = agenciesQueryProvider.generateAgenciesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};