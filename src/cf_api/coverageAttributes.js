const error_helper = require('../helpers/error_helper');
const coverageAttributes = require('../cf_mssql/coverageAttributes');

exports.getCoverageAttributes = async (req, res) => {
	let queryParams = req.query || {};
	
	await coverageAttributes.getCoverageAttributes(queryParams, (err, coverageAttributes, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: coverageAttributes, totalCount: totalCount });
	});
};

exports.createCoverageAttributes = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.coverageId || !params.attributeId || !params.attributeValue) {
		invalidData = true;
  }
	
	if(params.coverageId && (parseInt(params.coverageId) <= 0 || isNaN(parseInt(params.coverageId)))) invalidData = true;
	if(params.attributeId && (parseInt(params.attributeId) <= 0 || isNaN(parseInt(params.attributeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await coverageAttributes.createCoverageAttributes(params, (err, result, coverageAttributeId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { coverageAttributeId: coverageAttributeId } });
	});
};

exports.removeCoverageAttributes = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.coverageAttributeId || (parseInt(params.coverageAttributeId) <= 0 || isNaN(parseInt(params.coverageAttributeId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await coverageAttributes.removeCoverageAttributes(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};