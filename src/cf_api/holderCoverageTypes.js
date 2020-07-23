const holderCoverageTypes = require('../cf_mssql/holderCoverageTypes');
const error_helper = require('../helpers/error_helper');

exports.getHolderCoverageTypes = async (req, res) => {
	let queryParams = req.query || {};
  await holderCoverageTypes.getHolderCoverageTypes(queryParams, (err, holderCoverageTypes, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: holderCoverageTypes, totalCount: totalCount });
	});
};

exports.createHolderCoverageTypes = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.holderId || (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;
	if(!params.coverageTypeId || (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await holderCoverageTypes.createHolderCoverageTypes(params, (err, result, holderCoverageId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, holderCoverageId: holderCoverageId });
	});
};

exports.updateHolderCoverageTypes = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if(!params.holderId || (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;
	if(!params.coverageTypeId || (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await holderCoverageTypes.updateHolderCoverageTypes(params, (err, result, holderCoverageId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { holderCoverageId: holderCoverageId } });
	});
};

exports.removeHolderCoverageTypes = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(!params.holderId || (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;
	if(!params.coverageTypeId || (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await holderCoverageTypes.removeHolderCoverageTypes(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};