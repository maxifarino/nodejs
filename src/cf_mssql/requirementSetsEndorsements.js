const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const requirementSetsEndorsementsQueryProvider = require('../cf_providers/requirementsets_endorsements_query_provider');

exports.getRequirementSetsEndorsements = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = requirementSetsEndorsementsQueryProvider.generateRequirementSetsEndorsementsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = requirementSetsEndorsementsQueryProvider.generateRequirementSetsEndorsementsQuery(params);
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

exports.createRequirementSetsEndorsements = async (params, callback) => {	
	
	let query = requirementSetsEndorsementsQueryProvider.generateRequirementSetsEndorsementsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'RequirementSets_Endorsements');

	sql_helper.createTransaction(query, (err, result, requirementSetEndorsementId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, requirementSetEndorsementId);
	});
};

exports.removeRequirementSetsEndorsements = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = requirementSetsEndorsementsQueryProvider.generateRequirementSetsEndorsementsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};