const ChangedLookups = require('../mssql/changedlookups');
const Roles = require('../mssql/roles');
const Titles = require('../mssql/titles');
const TimeZones = require('../mssql/timezones');
const Trades = require('../mssql/trades');

// GET login resources
exports.updateChangedLookups = async function(req, res) {
	ChangedLookups.updateChangedLookups(function(err, updated, lookupId){
		if (err) {
			var error = error_helper.getSqlErrorData(err)
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { updated } });
	});
};

// GET login resources
exports.getLoginReources = async function(req, res) {
	var roles = await Roles.getRoles();
	var titles = [];
	var timeZones = [];
	var trades = [];

	return res.status(200).json({ success: true, data: { roles, titles, timeZones, trades } });
};