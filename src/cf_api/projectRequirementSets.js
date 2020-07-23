const error_helper = require('../helpers/error_helper');
const projectRequirementSets = require('../cf_mssql/projectRequirementSets');

exports.getProjectRequirementSets = async (req, res) => {
	let queryParams = req.query || {};
	
	await projectRequirementSets.getProjectRequirementSets(queryParams, (err, projectRequirementSets, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: projectRequirementSets, totalCount: totalCount });
	});
};

exports.createProjectRequirementSets = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.projectId || 
		 !params.requirementSetId) {
		invalidData = true;
	}
	
	if(!params.projectId || (parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId)))) invalidData = true;
	if(!params.requirementSetId || (parseInt(params.requirementSetId) <= 0 || isNaN(parseInt(params.requirementSetId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await projectRequirementSets.createProjectRequirementSets(params, (err, result, projectRequirementSetId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { projectRequirementSetId: projectRequirementSetId } });
	});
};

exports.removeProjectRequirementSets = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.projectRequirementSetId || (parseInt(params.projectRequirementSetId) <= 0 || isNaN(parseInt(params.projectRequirementSetId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await projectRequirementSets.removeProjectRequirementSets(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};