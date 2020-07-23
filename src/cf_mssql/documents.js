const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const documents_query_provider = require('../cf_providers/documents_query_provider');

exports.getDocuments = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let query;
	let result = {};
	let documentResults = {};
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		const enabledRoles = [8, 12, 13, 14, 15];
		if (params.userCFRoleId === 15) 
			params.isDataEntryClerk = true;

		// filter available hc per userId, if is not admin
		if (params.documentsPage && !enabledRoles.includes(params.userCFRoleId)) {
			console.log('CHECK AVAILABLE HCs');
			query = documents_query_provider.generateCheckAvailableHCPerUserQuery(params);
			let availableHCResult = await connection.request().query(query);
			if (availableHCResult.recordset.length > 0) {
				let availableHCs = availableHCResult.recordset[0].availableHCs;
				if (availableHCs) {
					params.availableHCs = availableHCs.split(/\s*,\s*/).map(Number);
				}
			}
		}

		query = (params.documentsPage === 'true')
			? documents_query_provider.generateDocumentsPageQuery(params)
			:	documents_query_provider.generateDocumentsQuery(params);
		result = await connection.request().query(query);
		documentResults = result.recordset;
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = (params.documentsPage === 'true') 
				? documents_query_provider.generateDocumentsPageQuery(params)
				: documents_query_provider.generateDocumentsQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
				
		connection.close();
		callback(null, documentResults, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createDocuments = async (params, callback) => {	
	let query = documents_query_provider.generateDocumentsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Documents');

	sql_helper.createTransaction(query, (err, result, documentId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, documentId);
	});
};

exports.removeDocuments = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = documents_query_provider.generateDocumentsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.updateDocuments = async (params, callback) => {	
	let query = documents_query_provider.generateDocumentsUpdateQuery(params);
	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
		}
		callback(null);
	});
};

exports.getDocumentStatus = async (params, callback) => {
  try {		
		const connection = await sql_helper.getConnection();
		const query = documents_query_provider.generateDocumentStatusQuery(params);
		const result = await connection.request().query(query);		
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getDocumentTypes = async (params, callback) => {
  try {		
		const connection = await sql_helper.getConnection();
		const query = documents_query_provider.generateDocumentTypesQuery(params);
		const result = await connection.request().query(query);		
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.setDocumentQueue = async (documentId, queueId, callback) => {
	try {		
		const connection = await sql_helper.getConnection();
		const query = documents_query_provider.generateDocumentQueueInsertQuery(documentId, queueId);
		const result = await connection.request().query(query);		
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}	
