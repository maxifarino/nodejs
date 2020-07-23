const error_helper = require('../helpers/error_helper');
const insurersCoverages = require('../cf_mssql/insurersCoverages');

exports.getInsurersCoverages = async (req, res) => {
	let queryParams = req.query || {};
	
	await insurersCoverages.getInsurersCoverages(queryParams, (err, insurersCoverages, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: insurersCoverages, totalCount: totalCount });
	});
};

exports.createInsurersCoverages = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.coverageId || !params.insurerId) {
		invalidData = true;
  }
	
	if(params.coverageId && (parseInt(params.coverageId) <= 0 || isNaN(parseInt(params.coverageId)))) invalidData = true;
	if(params.insurerId && (parseInt(params.insurerId) <= 0 || isNaN(parseInt(params.insurerId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await insurersCoverages.createInsurersCoverages(params, (err, result, insurerCoverageId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { insurerCoverageId: insurerCoverageId } });
	});
};

exports.removeInsurersCoverages = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.insurerCoverageId || (parseInt(params.insurerCoverageId) <= 0 || isNaN(parseInt(params.insurerCoverageId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await insurersCoverages.removeinsurersCoverages(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};