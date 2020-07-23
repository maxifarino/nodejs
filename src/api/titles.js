const Titles = require('../mssql/titles');

// GET all Titles
exports.getTitles = async function(req, res) {
	var titles = await Titles.getTitles();
	return res.status(200).json({ success: true, data: { titles: titles } });
};