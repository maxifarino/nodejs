var _ = require('underscore');
const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');

let formFieldsTypes = [];

exports.loadFormFieldsTypes = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM FormFieldsTypes`;
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			formFieldsTypes = result.recordset;
			callback(null, formFieldsTypes);
		} 
		else {
			console.log("No formFieldsTypes found");
			callback(null, []);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getFormFieldsTypes = async function(reload) {
	if(reload || formFieldsTypes.length <= 0){
		console.log("retrieving formFieldsTypes");
		await this.loadFormFieldsTypes(function(err, formFieldsTypes){
			console.log(err, formFieldsTypes.length);
		});
	}
	
	return formFieldsTypes;
}
