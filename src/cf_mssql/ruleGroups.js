const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const rulegroups_query_provider = require('../cf_providers/rulegroups_query_provider');
const rules_query_provider = require('../cf_providers/rules_query_provider');

exports.getRuleGroups = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = (params.detail) 
			? rulegroups_query_provider.generateRuleGroupsDetailQuery(params)
			: rulegroups_query_provider.generateRuleGroupsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize && !params.detail) {
			params.getTotalCount = true;
			query = rulegroups_query_provider.generateRuleGroupsQuery(params);
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

exports.createRuleGroups = async (params, callback) => {	
	
	let query = rulegroups_query_provider.generateRuleGroupsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'ruleGroups');

	sql_helper.createTransaction(query, (err, result, ruleGroupId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, ruleGroupId);
	});
};

exports.updateRuleGroups = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = rulegroups_query_provider.generateRuleGroupsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.ruleGroupId);
	});
};

exports.removeRuleGroups = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = rulegroups_query_provider.generateRuleGroupsDeleteQuery(params);
		result = await connection.request().query(query);

		if (params.deleteAllRules) {	
			let query = rules_query_provider.generateRulesDeleteByRuleGroupIdQuery(params);
			result = await connection.request().query(query);
		}

		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};