const geoSql = require('../mssql/geo')
const error_helper = require('../helpers/error_helper');

// GET USA states list
exports.getUSAStates = async function(req, res) {
	var invalidData = false;

	await geoSql.getUSAStates(async function(err, statesResult) {
		if(err) {
			let error = error_helper.getSqlErrorData(err);
			res.send(error);
		}
		if(!statesResult) {
			let error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
		   	return res.send(error);
		}

		return res.status(200).json({ success: true, geoUSAStates: statesResult });
	});
}

