const endorsements = require('../cf_mssql/endorsements');
const error_helper = require('../helpers/error_helper');

exports.getEndorsements = async (req, res) => {
	let queryParams = req.query || {};
  await endorsements.getEndorsements(queryParams, (err, endorsements, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, endorsements: endorsements, totalCount: totalCount });
	});
};

exports.createEndorsements = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.holderId || !params.name) {
		invalidData = true;
  }

  if(params.holderId && (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await endorsements.createEndorsements(params, (err, result, endorsementId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { endorsementId: endorsementId } });
	});
};

exports.updateEndorsements = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }
  
  if(!params.endorsementId || 
    (parseInt(params.endorsementId ) <= 0 ||
    isNaN(parseInt(params.endorsementId )))) 
    invalidData = true;  

	if(!params.endorsementId || !params.holderId || !params.name) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await endorsements.updateEndorsements(params, (err, result, endorsementId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { endorsementId: endorsementId } });
	});
};

exports.removeEndorsements = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.endorsementId || 
    (parseInt(params.endorsementId ) <= 0 ||
    isNaN(parseInt(params.endorsementId )))) 
    invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await endorsements.removeEndorsements(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};