const coverageTypes = require('../cf_mssql/coverageTypes');
const error_helper = require('../helpers/error_helper');

exports.getCoverageTypes = async (req, res) => {
	let queryParams = req.query || {};
  await coverageTypes.getCoverageTypes(queryParams, (err, coverageTypes, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: coverageTypes, totalCount: totalCount });
	});
};

exports.createCoverageTypes = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await coverageTypes.createCoverageTypes(params, (err, result, coverageTypeId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, coverageTypeId: coverageTypeId });
	});
};

exports.updateCoverageTypes = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if(! params.coverageTypeId || (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await coverageTypes.updateCoverageTypes(params, (err, result, coverageTypeId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { coverageTypeId: coverageTypeId } });
	});
};

exports.removeCoverageTypes = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(! params.coverageTypeId || (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await coverageTypes.removeCoverageTypes(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};