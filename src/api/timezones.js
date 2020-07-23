const TimeZones = require('../mssql/timezones');

// GET all TimeZones
exports.getTimeZones = async function(req, res) {
	var timeZones = await TimeZones.getTimeZones();
	return res.status(200).json({ success: true, data: { timeZones: timeZones } });
};