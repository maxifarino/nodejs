const error_helper = require('../helpers/error_helper');
const insureds = require('../cf_mssql/insureds');
const holders = require('../cf_mssql/holders');
const { asyncForEach } = require('../helpers/utils');

exports.getInsureds = async (req, res) => {
	let queryParams = req.query || {};

	await insureds.getInsureds(queryParams, async (err, insureds, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		// shallow param is used for insured typeAhead
		if (!queryParams.shallow) {

			await asyncForEach(insureds, async function (item, idx) {
				if (item.HolderName && item.HolderName.length > 0) {
					const processedHolderIds = new Set();
					const processedHolders = new Set();
					const holders = item.HolderName.split(',');

					holders.forEach(el => {
						let holder = el.split('|');
						if (holder[1] !== '' && holder[1] !== undefined) {
							processedHolderIds.add(holder[0]);
							processedHolders.add(holder[1]);
						}
					});
					item.HolderId = Array.from(processedHolderIds);
					item.HolderName = Array.from(processedHolders);
				}

				if (item.ProjectName && item.ProjectName.length > 0) {
					const processedProjects = new Set();
					const projects = item.ProjectName.split(',');

					projects.forEach(el => {
						let project = el.split('|');
						if (project[1] !== '' && project[1] !== undefined) {
							processedProjects.add(project[1]);
						}
					});
					item.ProjectName = Array.from(processedProjects);
				}
			});
		}

		return res.status(200).json({ success: true, data: insureds, totalCount: totalCount });
	});
};

exports.createInsureds = async (req, res) => {
	let params = req.body;
	let invalidData = false;
	console.log('PARAMS', params);
	
	if (!params) {
		invalidData = true;
	}

	if (!params.insuredName) {
		invalidData = true;
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await insureds.createInsureds(params, async (err, result, insuredId) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if (params.holderId) {
			holderChidren = await getHolderChildren(insuredId, params.holderId);
			console.log('holderChidren: ', holderChidren);
			if (Array.isArray(holderChidren) && holderChidren.length > 0) {
				holderChidren.forEach(e => {
					try {
						associateInsuredToHolder(insuredId, e.Id);
					} catch (error) {
						return res.send(error)
					}
				});
			} else {	
				associateInsuredToHolder(insuredId, params.holderId);
			}
		}

		return res.status(200).json({ success: true, data: { insuredId: insuredId } });
	});
};

exports.updateInsureds = async (req, res) => {
	let params = req.body;
	let invalidData = false;
	let holderChidren = [];

	if (!params) {
		invalidData = true;
	}

	if (!params.insuredId || (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;
	if (!params.countryId || (parseInt(params.countryId) <= 0 || isNaN(parseInt(params.countryId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await insureds.updateInsureds(params, async (err, result, insuredId) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if (params.holderId) {
			await removeInsuredHolders(insuredId);
			holderChidren = await getHolderChildren(insuredId, params.holderId);
			console.log('holderChidren: ', holderChidren);
			if (Array.isArray(holderChidren) && holderChidren.length > 0) {
				holderChidren.forEach(e => {
					try {
						associateInsuredToHolder(insuredId, e.Id);
					} catch (error) {
						return res.send(error)
					}
				});
			} else {
				associateInsuredToHolder(insuredId, params.holderId);
			}
		}

		return res.status(200).json({ success: true, data: { insuredId: insuredId } });
	});
};

const removeInsuredHolders = async (insuredId) => (
	new Promise((resolve, reject) => {
		insureds.removeInsuredHolders({ insuredId: insuredId }, (err, data) => { err ? reject(err) : resolve(data) });
	})
);

const getHolderChildren = async (insuredId, holderId) => (
	new Promise((resolve, reject) => {
		holders.getHolderChildren({ insuredId: insuredId, holderId: holderId }, (err, data) => { err ? reject(err) : resolve(data) });
	})
);

const associateInsuredToHolder = async (insuredId, holderId) => (
	new Promise((resolve, reject) => {
		insureds.associateInsuredToHolder({ insuredId: insuredId, holderId: holderId }, (err, data) => {
			err ? reject(err) : resolve(data);
		});
	})
);

exports.removeInsureds = async (req, res) => {
	let params = req.body;
	var invalidData = false;

	if (!params.insuredId || (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await insureds.removeInsureds(params, async (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		await removeInsuredHolders(params.insuredId);
		return res.status(200).json({ success: true });
	});
};

exports.archiveInsureds = async (req, res) => {
	let params = req.body;
	var invalidData = false;

	if (!params.insuredId || (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await insureds.archiveInsureds(params, async (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}		
		return res.status(200).json({ success: true });
	});
};

// Hiringclients_SubContractors
exports.getInsuredsByHolder = async (req, res) => {
	let queryParams = req.query || {};
	let invalidData = false;

	if (!queryParams.holderId || (parseInt(queryParams.holderId) <= 0 || isNaN(parseInt(queryParams.holderId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await insureds.getInsuredsByHolder(queryParams, async (err, insureds) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: insureds });
	});
};