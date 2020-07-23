var _ = require('underscore');
const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');

let timeZones = [];

exports.loadTimeZones = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM TimeZones`;
		const result = await connection.request().query(query);
		connection.close();
		if(result.recordset.length > 0) 
		{
			timeZones = result.recordset;
			callback(null, timeZones);
		} 
		else {
			console.log("No timeZones found");
			callback(null, []);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.getTimeZones = async function(reload) {
	if(reload || timeZones.length <= 0){
		console.log("retrieving timeZones");
		await this.loadTimeZones(function(err, timeZones){
		});
	}
	
	return timeZones;
}

exports.getUserTimeZone = async function(TimeZoneId) {
	if(timeZones.length <= 0){
		console.log("retrieving timezones");
		await this.loadTimeZones(function(err, tz){
      timeZones = tz
		});
	}

	if(timeZones.length > 0){
	  	var index = _.findIndex(timeZones, (item) => { return item.Id.toString() == TimeZoneId.toString() });
	  	if(index != -1){
			return timeZones[index];
	  	}
	}

	return null;
}
