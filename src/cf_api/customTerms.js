const customTerms = require('../cf_mssql/customTerms');
const error_helper = require('../helpers/error_helper');

exports.getCustomTerms = async (req, res) => {
	let queryParams = req.query || {};
  await customTerms.getCustomTerms(queryParams, (err, customTerms, totalCount) => {		
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: customTerms, totalCount: totalCount });
	});
};

exports.createCustomTerms = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.holderId || !params.customTerm || !params.originalTerm) {
		invalidData = true;
  }

  if(params.holderId && (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await customTerms.createCustomTerms(params, (err, result, customTermId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { customTermId: customTermId } });
	});
};

exports.updateCustomTerms = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }
  
  if(!params.customTermId || (parseInt(params.customTermId) <= 0 || isNaN(parseInt(params.customTermId )))) 
    invalidData = true;  

	if(!params.holderId || (parseInt(params.customTermId) <= 0 || isNaN(parseInt(params.customTermId))))
		invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await customTerms.updateCustomTerms(params, (err, result, customTermId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { customTermId: customTermId } });
	});
};

exports.removeCustomTerms = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(!params.customTermId || (parseInt(params.customTermId ) <= 0 || isNaN(parseInt(params.customTermId )))) 
    invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await customTerms.removeCustomTerms(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }    
		return res.status(200).json({ success: true });
	});
};