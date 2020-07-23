const requirementSetsEndorsements = require('../cf_mssql/requirementSetsEndorsements');
const error_helper = require('../helpers/error_helper');

exports.getRequirementSetsEndorsements = async (req, res) => {
	let queryParams = req.query || {};
  await requirementSetsEndorsements.getRequirementSetsEndorsements(queryParams, (err, requirementSetsEndorsements, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, requirementSetsEndorsements: requirementSetsEndorsements, totalCount: totalCount });
	});
};

exports.createRequirementSetsEndorsements = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.requirementSetId || (parseInt(params.requirementSetId) <= 0 || isNaN(parseInt(params.requirementSetId)))) invalidData = true;
	if(!params.endorsementId || (parseInt(params.endorsementId) <= 0 || isNaN(parseInt(params.endorsementId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await requirementSetsEndorsements.createRequirementSetsEndorsements(params, (err, result, requirementSetEndorsementId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { requirementSetEndorsementId: requirementSetEndorsementId } });
	});
};

exports.removeRequirementSetsEndorsements = async (req, res) => {
  let params = req.body;
	var invalidData = false;

	if(!params.requirementSetEndorsementId || (parseInt(params.requirementSetEndorsementId) <= 0 || isNaN(parseInt(params.requirementSetEndorsementId)))) invalidData = true;
  if(!params.requirementSetId || (parseInt(params.requirementSetId) <= 0 || isNaN(parseInt(params.requirementSetId)))) invalidData = true;
	if(!params.endorsementId || (parseInt(params.endorsementId) <= 0 || isNaN(parseInt(params.endorsementId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await requirementSetsEndorsements.removeRequirementSetsEndorsements(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};