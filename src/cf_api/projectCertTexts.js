const error_helper = require('../helpers/error_helper');
const projectCertTexts = require('../cf_mssql/projectCertTexts');

exports.getProjectCertTexts = async (req, res) => {
	let queryParams = req.query || {};
	
	await projectCertTexts.getProjectCertTexts(queryParams, (err, projectCertTexts, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: projectCertTexts, totalCount: totalCount });
	});
};

exports.createProjectCertTexts = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.projectId) {
		invalidData = true;
	}
	
	if(!params.projectId || (parseInt(params.projectId ) <= 0 || isNaN(parseInt(params.projectId )))) invalidData = true;  
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await projectCertTexts.createProjectCertTexts(params, (err, result, projectCertTextId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { projectCertTextId: projectCertTextId } });
	});
};

exports.updateProjectCertTexts = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
	}
	
	if(!params.projectId) {
		invalidData = true;
	}
  
	if(params.projectId && (parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await projectCertTexts.updateProjectCertTexts(params, (err, result, projectCertTextId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { projectCertTextId: projectCertTextId } });
	});
};