const error_helper = require('../helpers/error_helper');
const projectInsuredDeficiencies = require('../cf_mssql/projectInsuredDeficiencies');

exports.getProjectInsuredDeficiencies = async (req, res) => {
	let queryParams = req.query || {};
	
	await projectInsuredDeficiencies.getProjectInsuredDeficiencies(queryParams, (err, projectInsuredDeficiencies, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, projectInsuredDeficiencies: projectInsuredDeficiencies, totalCount: totalCount });
	});
};

exports.createProjectInsuredDeficiencies = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.deficiencyTypeId || 
		 !params.deficiencyStatusId || 
		 !params.projectInsuredId || 
		 !params.ruleId) 
	{
		invalidData = true;
  }
	
	if(params.deficiencyTypeId && (parseInt(params.deficiencyTypeId) <= 0 || isNaN(parseInt(params.deficiencyTypeId)))) invalidData = true;
	if(params.deficiencyStatusId && (parseInt(params.deficiencyStatusId) <= 0 || isNaN(parseInt(params.deficiencyStatusId)))) invalidData = true;
	if(params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if(params.ruleId && (parseInt(params.ruleId) <= 0 || isNaN(parseInt(params.ruleId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await projectInsuredDeficiencies.createProjectInsuredDeficiencies(params, (err, result, projectInsuredDeficiencyId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { projectInsuredDeficiencyId: projectInsuredDeficiencyId } });
	});
};

exports.removeProjectInsuredDeficiencies = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.projectInsuredDeficiencyID || (parseInt(params.projectInsuredDeficiencyId) <= 0 || isNaN(parseInt(params.projectInsuredDeficiencyId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await projectInsuredDeficiencies.removeProjectInsuredDeficiencies(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};


exports.updateProjectInsuredDeficiencies = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.projectInsuredDeficiencyId || (parseInt(params.projectInsuredDeficiencyId) <= 0 || isNaN(parseInt(params.projectInsuredDeficiencyId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

	params.modifiedById = req.currentUser.Id;

	console.log('PARAMS', params);
  await projectInsuredDeficiencies.updateProjectInsuredDeficiencies(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};