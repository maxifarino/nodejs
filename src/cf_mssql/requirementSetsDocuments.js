const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const requirementsets_documents_query_provider = require('../cf_providers/requirementsets_documents_query_provider');

exports.getRequirementSetsDocuments = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = requirementsets_documents_query_provider.generateRequirementSetsDocumentsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = requirementsets_documents_query_provider.generateRequirementSetsDocumentsQuery(params);
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

exports.createRequirementSetsDocuments = async (params, callback) => {	
	
	let query = requirementsets_documents_query_provider.generateRequirementSetsDocumentsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'RequirementSets_Documents');

	sql_helper.createTransaction(query, (err, result, requirementSetsDocumentId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, requirementSetsDocumentId);
	});
};

exports.removeRequirementSetsDocuments = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = requirementsets_documents_query_provider.generateRequirementSetsDocumentsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};