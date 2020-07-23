const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const project_documents_query_provider = require('../cf_providers/project_documents_query_provider');

exports.getProjectDocuments = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = project_documents_query_provider.generateProjectDocumentsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = project_documents_query_provider.generateProjectDocumentsQuery(params);
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

exports.createProjectDocuments = async (params, callback) => {	
	
	let query = project_documents_query_provider.generateProjectDocumentsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Projects_Documents');

	sql_helper.createTransaction(query, (err, result, ProjectDocumentId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, ProjectDocumentId);
	});
};

exports.removeProjectDocuments = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = project_documents_query_provider.generateProjectDocumentsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};