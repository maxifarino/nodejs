const sql_helper = require('../mssql/mssql_helper');

exports.getCountries = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM Countries `;
		const result = await connection.request().query(query);
    //console.log("DATA", result);
    connection.close();
		callback(null, result);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getStates = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM States`;
		const result = await connection.request().query(query);
    //console.log("DATA", result);
    connection.close();
		callback(null, result);
	}
	catch (err) {
		callback(err, null);
	}
}
