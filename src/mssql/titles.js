var _ = require('underscore');
const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');

let titles = [];

exports.loadTitles = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM Titles`;
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			titles = result.recordset;
			callback(null, titles);
		} 
		else {
			console.log("No titles found");
			callback(null, []);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getTitles = async function(reload) {
	if(reload || titles.length <= 0){
		console.log("retrieving titles");
		await this.loadTitles(function(err, titles){
			console.log(err, titles.length);
		});
	}
	
	return titles;
}

exports.getUserTitle = async function(user) {
	if(titles.length <= 0){
		console.log("retrieving titles");
		await this.loadTitles(function(err, roles){
			console.log(err, titles.length);
		});
	}

	if(titles.length > 0){
  	var index = _.findIndex(titles, (item) => { return item.Id.toString() == user.TitleId.toString() });
  	if(index != -1){
			return titles[index];
  	}
	}

	return null;
}
