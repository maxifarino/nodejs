const error_helper = require('../helpers/error_helper');
const projectInsuredComplianceStatus = require('../cf_mssql/projectInsuredComplianceStatus');

exports.getProjectInsuredComplianceStatus = async (req, res) => {
	let queryParams = req.query || {};
	
	await projectInsuredComplianceStatus.getProjectInsuredComplianceStatus(queryParams, (err, projectInsuredComplianceStatus, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: projectInsuredComplianceStatus, totalCount: totalCount });
	});
};