const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');

const Roles = require('./roles');
const Titles = require('./titles');
const TimeZones = require('./timezones');
const Trades = require('./trades');
const Functions = require('./functions');
const FormFieldsTypes = require('./formfieldstypes');

var resetChangedLookups = function (callback) {
	var query = `UPDATE ChangedLookups SET Changed = '0'`;
	sql_helper.createTransaction(query, callback);
}

exports.updateChangedLookups = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM ChangedLookups`;
		const result = await connection.request().query(query);
		const changedLookups = result.recordset;
		let mustReset = false;
		connection.close();

		if (changedLookups.length > 0) 
		{
			for (var i=0; i<changedLookups.length; i++) {
				var table = changedLookups[i].TableName;
				var needsUpdate = changedLookups[i].Changed == 1;

				if (needsUpdate) {
					mustReset = true;
					if (table == "FormFieldsTypes") {
						await FormFieldsTypes.getFormFieldsTypes(true);
						console.log("FormFieldsTypes Updated");
					} else if (table == "Functions") {
						await Functions.getFunctions(true);
						console.log("Functions Updated");
					} else if (table == "Roles") {
						await Roles.getRoles(true);
						console.log("Roles Updated");
					} else if (table == "Titles") {
						await Titles.getTitles(true);
						console.log("Titles Updated");
					} else if (table == "TimeZones") {
						await TimeZones.getTimeZones(true);
						console.log("TimeZones Updated");
					} else if (table == "Trades") {
						await Trades.getTrades(true);
						console.log("Trades Updated");
					}
				}
			}

			if (mustReset) {
				resetChangedLookups (callback);
			} else {
				callback(null, false, null);
			}
			
		} 
		else {
			console.log("No ChangedLookups found");
			callback(null, false, null);
		}
	}
	catch (err) {
		callback(err, false, null);
	}
}

