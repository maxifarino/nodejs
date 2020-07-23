const customFields = require('../cf_mssql/customFields');
const error_helper = require('../helpers/error_helper');

exports.getCustomFields = async (req, res) => {
	let queryParams = req.query || {};
  await customFields.getCustomFields(queryParams, (err, customFields, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, customFields: customFields, totalCount: totalCount });
	});
};

exports.createCustomFields = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.holderId || !params.customFieldName || !params.fieldTypeId) {
		invalidData = true;
  }

  if(params.holderId && (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await customFields.createCustomFields(params, (err, result, customFieldId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { customFieldId: customFieldId } });
	});
};

exports.updateCustomFields = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }
  
  if(!params.customFieldId || 
    (parseInt(params.customFieldId ) <= 0 ||
    isNaN(parseInt(params.customFieldId )))) 
    invalidData = true;  

	if(!params.holderId || !params.customFieldName || !params.fieldTypeId) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await customFields.updateCustomFields(params, (err, result, customFieldId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { customFieldId: customFieldId } });
	});
};

exports.removeCustomFields = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.customFieldId || 
    (parseInt(params.customFieldId ) <= 0 ||
    isNaN(parseInt(params.customFieldId )))) 
    invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await customFields.removeCustomFields(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};