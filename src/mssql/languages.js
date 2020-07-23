// Internal dependencies
// HELPERS
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper')

// PROVIDERS
const query_provider = require('../providers/query_provider');

exports.getLanguagesRawData = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateLanguagesDataQuery();
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			let rawData = result.recordset;
			callback(null, rawData);
		} 
		else {
			console.log("No language found");
			callback(null, null);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getLanguage = async function(queryParams, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateLanguageQuery(queryParams);
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			let language = result.recordset[0];
			callback(null, language);
		} 
		else {
			console.log("No language found");
			callback(null, null);
		}
	}
	catch (err) {
		console.log(err);
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getDictionaries = async function(query, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			let dictionaries = result.recordset;
			callback(null, dictionaries);
		} 
		else {
			console.log("No Dictionaries found");
			callback(null, null);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.createLanguage = async function(queryParams, callback) {
	const query = query_provider.generateLanguageInsertQuery(queryParams);

	sql_helper.createTransaction(query, callback);
}

exports.updateValues = async function(queryParams, callback) {
	const query = query_provider.generateLanguageValuesUpdateQuery(queryParams);

	sql_helper.createTransaction(query, callback);
}