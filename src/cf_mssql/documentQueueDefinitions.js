const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const documentQueueDefinitionsQueryProvider = require('../cf_providers/document_queue_definitions_query_provider');

exports.getDocumentQueueDefinitions = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueDefinitionsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = documentQueueDefinitionsQueryProvider.generateDocumentQueueDefinitionsQuery(params);
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

exports.createDocumentQueueDefinitions = async (params, callback) => {	
	
	let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueDefinitionsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Document_Queue_Definitions');

	sql_helper.createTransaction(query, (err, result, queueId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, queueId);
	});
};

exports.updateDocumentQueueDefinitions = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueDefinitionsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.queueId);
	});
};

exports.removeDocumentQueueDefinitions = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueDefinitionsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

/* Document Queue Users */
exports.getDocumentQueueUsers = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueUsersQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = documentQueueDefinitionsQueryProvider.generateDocumentQueueUsersQuery(params);
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

exports.createDocumentQueueUsers = async (params, callback) => {	
	
	let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueUsersInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Users_Document_Queue');

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
		}
		callback(null, result);
	});
};

exports.removeDocumentQueueUsers = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = documentQueueDefinitionsQueryProvider.generateDocumentQueueUsersDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getAvailableUsersPerRole = async (params, callback) => {
  try {		
		const connection = await sql_helper.getConnection();		
		const query = documentQueueDefinitionsQueryProvider.generateAvailableUsersPerRoleQuery(params);
		const result = await connection.request().query(query);
		
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};