const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const project_certtexts_query_provider = require('../cf_providers/project_certtexts_query_provider');

exports.getProjectCertTexts = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = project_certtexts_query_provider.generateProjectCertTextsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = project_certtexts_query_provider.generateProjectCertTextsQuery(params);
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

exports.createProjectCertTexts = async (params, callback) => {	
	
	let query = project_certtexts_query_provider.generateProjectCertTextsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'ProjectCertTexts');

	sql_helper.createTransaction(query, (err, result, projectCertTextId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectCertTextId);
	});
};

exports.updateProjectCertTexts = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = project_certtexts_query_provider.generateProjectCertTextsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.projectCertTextId);
	});
};