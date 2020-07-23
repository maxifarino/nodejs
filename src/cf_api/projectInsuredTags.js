const error_helper = require('../helpers/error_helper');
const projectInsuredTags = require('../cf_mssql/projectInsuredTags');

exports.getProjectInsuredTags = async (req, res) => {
		
	let queryParams = req.query || {};
		
	await projectInsuredTags.getProjectInsuredTags(queryParams, (err, projectInsuredTags, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: projectInsuredTags, totalCount: totalCount });
	});
};

exports.createProjectInsuredTags = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.projectInsuredId || (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if(!params.tagId || (parseInt(params.tagId) <= 0 || isNaN(parseInt(params.tagId)))) invalidData = true;  
		
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	// Assigned by
	params.assignedById = req.currentUser.Id;

  await projectInsuredTags.createProjectInsuredTags(params, (err, result, projectInsuredTagId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { projectInsuredTagId: projectInsuredTagId } });
	});
};

exports.removeProjectInsuredTags = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.projectInsuredId || (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
  if(!params.tagId || (parseInt(params.tagId) <= 0 || isNaN(parseInt(params.tagId)))) invalidData = true;  
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await projectInsuredTags.removeProjectInsuredTags(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};