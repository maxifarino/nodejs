const attributes = require('../cf_mssql/attributes');
const error_helper = require('../helpers/error_helper');

exports.getAttributes = async (req, res) => {
	let queryParams = req.query || {};
  await attributes.getAttributes(queryParams, (err, attributes, totalCount) => {		
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, attributes: attributes, totalCount: totalCount });
	});
};

exports.createAttributes = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}
	if(!params.attributeName) {
		invalidData = true;
  }

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await attributes.createAttributes(params, (err, result, attributeId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { attributeId: attributeId } });
	});
};

exports.updateAttributes = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if((!params.attributeId) || (!params.attributeName)) {
		invalidData = true;
	}

	if(params.attributeId && (parseInt(params.attributeId) <= 0 || isNaN(parseInt(params.attributeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await attributes.updateAttributes(params, (err, result, attributeId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { attributeId: attributeId } });
	});
};

exports.removeAttributes = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(params.attributeId && (parseInt(params.attributeId) <= 0 || isNaN(parseInt(params.attributeId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await attributes.removeAttributes(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};