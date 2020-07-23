const requirementSets = require('../cf_mssql/requirementSets');
const error_helper = require('../helpers/error_helper');

exports.getRequirementSets = async (req, res) => {
	let queryParams = req.query || {};
  await requirementSets.getRequirementSets(queryParams, (err, requirementSets, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, requirementSets: requirementSets, totalCount: totalCount });
	});
};

exports.createRequirementSets = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.name) {
		invalidData = true;
  }

  if(params.holderId && (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await requirementSets.createRequirementSets(params, (err, result, requirementSetId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { requirementSetId: requirementSetId } });
	});
};

exports.updateRequirementSets = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }
  
  if(!params.requirementSetId || 
    (parseInt(params.requirementSetId ) <= 0 ||
    isNaN(parseInt(params.requirementSetId )))) 
    invalidData = true;  

	if(!params.requirementSetId || !params.holderId || !params.name) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await requirementSets.updateRequirementSets(params, (err, result, requirementSetId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { requirementSetId: requirementSetId } });
	});
};

exports.removeRequirementSets = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.requirementSetId || 
    (parseInt(params.requirementSetId ) <= 0 ||
    isNaN(parseInt(params.requirementSetId )))) 
    invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await requirementSets.removeRequirementSets(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

exports.getRequirementSetsDetail = async (req, res) => {
	let queryParams = req.query || {};
	console.log(queryParams);
	
  await requirementSets.getRequirementSetsDetail(queryParams, (err, requirementSets, totalCount, availableCoverages, availableEndorsements) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		
		return res.status(200).json({ success: true, requirementSets, totalCount, availableCoverages, availableEndorsements });
	});
};

exports.getHolderSetIds = async (req, res) => {
	let queryParams = req.query || {};
	await requirementSets.getHolderSetIds(queryParams, (err, reqSetHolderIds) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		let holderSetIds = reqSetHolderIds.map(item => item.HolderSetID);
		return res.status(200).json({ success: true, holderSetIds: holderSetIds });
	});
};

exports.createDuplicateRequirementSets = async (req, res) => {
	let params = req.body;
  let invalidData = false;
	if(!params) {
		invalidData = true;
	}

  if(params.reqSetId && (parseInt(params.reqSetId) <= 0 || isNaN(parseInt(params.reqSetId)))) invalidData = true;
  if(params.holderId && (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await requirementSets.createDuplicateRequirementSets(params, (err, result, requirementSetId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { requirementSetId: requirementSetId } });
	});
};
