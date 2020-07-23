const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const project_insured_documents = require('../cf_providers/projectinsureds_documents_query_provider');

exports.getProjectInsuredDocuments = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = project_insured_documents.generateProjectInsuredDocumentsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = project_insured_documents.generateProjectInsuredDocumentsQuery(params);
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

exports.createProjectInsuredDocuments = async (params, callback) => {	
	
	let query = project_insured_documents.generateProjectInsuredDocumentsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'ProjectInsureds_Documents');

	sql_helper.createTransaction(query, (err, result, projectInsuredDocumentId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectInsuredDocumentId);
	});
};

exports.removeProjectInsuredDocuments = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = project_insured_documents.generateProjectInsuredDocumentsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};