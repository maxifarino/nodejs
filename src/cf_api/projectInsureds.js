const projectInsureds = require('../cf_mssql/projectInsureds');
const error_helper = require('../helpers/error_helper');

exports.getProjectInsureds = async (req, res) => {
	let queryParams = req.query || {};
	let invalidData = false;

	if (queryParams.projectId && (parseInt(queryParams.projectId) <= 0 || isNaN(parseInt(queryParams.projectId)))) invalidData = true;
	if (queryParams.insuredId && (parseInt(queryParams.insuredId) <= 0 || isNaN(parseInt(queryParams.insuredId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await projectInsureds.getProjectInsureds(queryParams, (err, projectInsureds, totalCount, totalProjectNonArchived) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, projectInsureds: projectInsureds, totalCount: totalCount, totalProjectNonArchived: totalProjectNonArchived });
	});
};

exports.createProjectInsureds = async (req, res) => {
	let params = req.body;
	let invalidData = false;

	if (!params) {
		invalidData = true;
	}
	if (!params.projectId || !params.insuredId) {
		invalidData = true;
	}

	if (params.projectId && (parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId)))) invalidData = true;
	if (params.insuredId && (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await projectInsureds.createProjectInsureds(params, (err, result, projectInsuredId) => {
		if (err) {
			(err === 'exists')
				? error = error_helper.getErrorData(error_helper.CODE_PROJECT_INSURED_EXISTS, error_helper.MSG_PROJECT_INSURED_EXISTS)
				: error = error_helper.getSqlErrorData(err)

			return res.send(error);
		}

		return res.status(200).json({ success: true, projectInsuredId: projectInsuredId });
	});
};

exports.updateProjectInsureds = async (req, res) => {
	let params = req.body;
	let invalidData = false;

	if (!params) {
		invalidData = true;
	}

	if (!params.projectInsuredId || !params.projectId || !params.insuredId) {
		invalidData = true;
	}

	if (params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if (params.projectId && (parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId)))) invalidData = true;
	if (params.insuredId && (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await projectInsureds.updateProjectInsureds(params, (err, result, projectInsuredId) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: { projectInsuredId: projectInsuredId } });
	});
};

exports.removeProjectInsureds = async (req, res) => {
	let params = req.body;
	var invalidData = false;

	if (params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await projectInsureds.removeProjectInsureds(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true });
	});
};

exports.archiveProjectInsureds = async (req, res) => {
	let params = req.body;

	await projectInsureds.archiveProjectInsureds(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true });
	});
}

exports.exemptProjectInsureds = async (req, res) => {
	let params = req.body;
	await projectInsureds.exemptProjectInsureds(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true });
	});
}

exports.createProjectInsuredsCertificate = async (req, res) => {
	let params = req.body;
	let invalidData = false;

	if (!params) {
		invalidData = true;
	}
	if (!params.projectInsuredId || !params.certificateId) {
		invalidData = true;
	}

	if (params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if (params.certificateId && (parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await projectInsureds.createProjectInsuredsCertificate(params, (err, result) => {
		if (err) {
			(err === 'exists')
				? error = error_helper.getErrorData(error_helper.CODE_PROJECT_INSURED_CERTIFICATE_EXISTS, error_helper.MSG_PROJECT_INSURED_CERTIFICATE_EXISTS)
				: error = error_helper.getSqlErrorData(err)

			return res.send(error);
		}
		return res.status(200).json({ success: true });
	});
};






exports.updateComplianceStatusProjectInsureds = async (req, res) => {
	let params = req.body;
	let invalidData = false;

	if (!params) {
		invalidData = true;
	}

	//UPDATE THIS FILEDS TOO
	//params.complianceStartDate
	//params.complianceEndDate

	if (params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if (params.complianceStatusId && (parseInt(params.complianceStatusId) <= 0 || isNaN(parseInt(params.complianceStatusId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await projectInsureds.updateComplianceStatusProjectInsureds(params, (err, result, projectInsuredId) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: { ...params } });
	});
};