const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const rules_query_provider = require('../cf_providers/rules_query_provider');

exports.getRules = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = rules_query_provider.generateRulesQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = rules_query_provider.generateRulesQuery(params);
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

exports.createRules = async (params, callback) => {	
	
	let query = rules_query_provider.generateRulesInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Rules');

	sql_helper.createTransaction(query, (err, result, ruleId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, ruleId);
	});
};

exports.updateRules = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = rules_query_provider.generateRulesUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.ruleId);
	});
};

exports.removeRules = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = rules_query_provider.generateRulesDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};