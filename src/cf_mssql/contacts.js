const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const query_provider = require('../cf_providers/contacts_query_provider');


exports.getContacts = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let queryParams = {}
		var totalRowsCount = 0;

		//Get ContactTypes list
		var queryContactsTypes = query_provider.generateContactsTypesQuery();
		var resultContactsTypes = await connection.request().query(queryContactsTypes);

		queryParams = params;
		// console.log('QUERY PARAMS', {queryParams});
		if(params.pageSize && params.pageNumber) {
			queryParams.pagination = {}
			queryParams.pagination.pageSize = params.pageSize;
			queryParams.pagination.pageNumber = params.pageNumber;
		}

		if(params.pageNumber) {
			queryParams.getTotalCount = true;
			var query = query_provider.generateContactsQuery(queryParams);
			var result = await connection.request().query(query);
			totalRowsCount = result.recordset.length;			
		}

    queryParams.getTotalCount = false;
		query = query_provider.generateContactsQuery(queryParams);
		result = await connection.request().query(query);

		connection.close();
		if(!params.pageNumber) {
			totalRowsCount = result.recordset.length;			
		}

		var responseData = {};
		responseData.contactsTypesPossibleValues = resultContactsTypes.recordset;
		if(result.recordset.length > 0){
			responseData.contacts = result.recordset;

			callback(null, responseData, totalRowsCount);
		} else {
			console.log("No contacts found.");
			callback(null, responseData, totalRowsCount);
		}


    // const query = `SELECT * FROM Contacts `;
		// const result = await connection.request().query(query);
    // console.log("DATA", result);
    // connection.close();
		// callback(null, result);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.createContact = async function(params, callback) {
	console.log('createContact', params);
	let query = query_provider.generateContactInsertQuery(params);

	if(params.contactId)
		query = query_provider.generateContactUpdateQuery(params);

	if(!params.contactId)
		query = sql_helper.getLastIdentityQuery(query,'Contacts');

	sql_helper.createTransaction(query, function(err, result, contactId) {
		if(err) {
			return callback(err);
		}

		// if(params.holderId)
		// 	query = query_provider.generateHolderContactInsertQuery({holderId: params.hodlerId, contactId: contactId});
		// if(params.insuredId)
		// 	query = query_provider.generateInsuredContactInsertQuery({insuredId: params.insuredId, contactId: contactId});


		let locContactId = null;
		if(!params.contactId) {
			locContactId = contactId;
		}
		else {
			locContactId = params.contactId
		}

		callback(null, result, contactId);

	});
}

exports.linkContactAndHolder = async function(params, callback) {
	try {
		let query = query_provider.generateHolderContactInsertQuery(params);
		sql_helper.createTransaction(query, callback);
	}
	catch(err) {
		callback(err, null);
	}
}

exports.linkContactAndInsured = async function(params, callback) {
	try {
		let query = query_provider.generateInsuredContactInsertQuery(params);
		sql_helper.createTransaction(query, callback);
	}
	catch(err) {
		callback(err, null);
	}
}

exports.unlinkContactAndHolder = async function(params, callback) {
	try {
		let query = query_provider.generateHolderContactUnlinkQuery(params);
		sql_helper.createTransaction(query, callback);
	}
	catch(err) {
		callback(err, null);
	}
}

exports.unlinkContactAndInsured = async function(params, callback) {
	try {
		let query = query_provider.generateInsuredContactUnlinkQuery(params);
		sql_helper.createTransaction(query, callback);
	}
	catch(err) {
		callback(err, null);
	}
}