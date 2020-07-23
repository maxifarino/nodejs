var _ = require('underscore');
const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');
const query_provider = require('../providers/query_provider');

let functions = [];

exports.loadFunctions = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM Functions`;
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			functions = result.recordset;
			callback(null, functions);
		} 
		else {
			console.log("No functions found");
			callback(null, []);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getFunctions = async function(reload) {
	if(reload || functions.length <= 0){
		console.log("retrieving functions");
		await this.loadFunctions(function(err, functions){
			console.log(err, functions.length);
		});
	}
	
	return functions;
}

exports.getFunctionAuthorization = async function(params, callback) {
	try {
		var roleId = 0;
		const connection = await sql_helper.getConnection();

		var query = query_provider.generateFunctionAuthorizationQuery(params);
		var result = await connection.request().query(query);

		let isUserAuthorized = result.recordset.length > 0;
		if(isUserAuthorized == false) {
			query = query_provider.generateRoleByUserQuery(params);
			result = await connection.request().query(query);
			roleId = result.recordset[0].roleId;

			if(roleId == 1 || roleId == 7)
				isUserAuthorized = true;
		}

		connection.close();

		console.log('Userid:')
		console.log(params.userId)
		console.log('isUserAuthorized:')
		console.log(isUserAuthorized);

		callback(null, isUserAuthorized);
	}
	catch(err) {
		callback(err, null);
	}
}

exports.checkRolePermission = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		var query = query_provider.checkRolePermissions(params);
		var result = await connection.request().query(query);

		connection.close();

		const hasPermission = (result.recordset.length > 0);

		callback(null, hasPermission);
	}
	catch(err) {
		callback(err, null);
	}
}