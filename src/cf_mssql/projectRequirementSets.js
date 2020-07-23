const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const project_requirementsets_query_provider = require('../cf_providers/project_requirementsets_query_provider');

exports.getProjectRequirementSets = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = project_requirementsets_query_provider.generateProjectRequirementSetsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = project_requirementsets_query_provider.generateProjectRequirementSetsQuery(params);
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

exports.createProjectRequirementSets = async (params, callback) => {	
	
	let query = project_requirementsets_query_provider.generateProjectRequirementSetsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'ProjectRequirementSets');

	sql_helper.createTransaction(query, (err, result, projectRequirementSetId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectRequirementSetId);
	});
};

exports.removeProjectRequirementSets = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = project_requirementsets_query_provider.generateProjectRequirementSetsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};