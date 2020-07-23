const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const query_provider = require('../providers/query_provider');
const logger = require('./log');

exports.getUSAStates = async function(callback) {

	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateUSAStatesQuery();
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

