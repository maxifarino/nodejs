const holderSettings = require('../cf_mssql/holderSettings');
const error_helper = require('../helpers/error_helper');

exports.getHolderSettings = async (req, res) => {
	let queryParams = req.query || {};
	let invalidData = false;

	if(!queryParams) {
		invalidData = true;
	}

	if(!queryParams.holderId || (parseInt(queryParams.holderId) <= 0 || isNaN(parseInt(queryParams.holderId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }

  await holderSettings.getHolderSettings(queryParams, (err, holderSettings, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: holderSettings, totalCount: totalCount });
	});
};

exports.updateHolderSettings = async (req, res) => {
	let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.holderId || (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;  
	if(params.CFRevisedWordingPresent && (parseInt(params.CFRevisedWordingPresent) <= 0 || isNaN(parseInt(params.CFRevisedWordingPresent)))) invalidData = true;
	if(params.CFCompliantAndAccepted && (parseInt(params.CFCompliantAndAccepted) <= 0 || isNaN(parseInt(params.CFCompliantAndAccepted)))) invalidData = true;
	if(params.CFRevisedDates && (parseInt(params.CFRevisedDates) <= 0 || isNaN(parseInt(params.CFRevisedDates)))) invalidData = true;
	if(params.CFNonDateFields && (parseInt(params.CFNonDateFields) <= 0 || isNaN(parseInt(params.CFNonDateFields)))) invalidData = true;  
	if(params.CFApplyingCertificates && (parseInt(params.CFApplyingCertificates) <= 0 || isNaN(parseInt(params.CFApplyingCertificates)))) invalidData = true;  
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await holderSettings.updateHolderSettings(params, (err, result, holderId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { holderId: holderId } });
	});
};

exports.getHolderSettingsDataEntryOptions = async (req, res) => {
	let queryParams = req.query || {};
  await holderSettings.getHolderSettingsDataEntryOptions(queryParams, (err, list, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: list, totalCount: totalCount });
	});
};

exports.getHolderSettingsCertificateOptions = async (req, res) => {
	let queryParams = req.query || {};
  await holderSettings.getHolderSettingsCertificateOptions(queryParams, (err, list, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: list, totalCount: totalCount });
	});
};