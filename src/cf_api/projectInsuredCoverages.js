const error_helper = require('../helpers/error_helper');
const projectInsuredCoverages = require('../cf_mssql/projectInsuredCoverages');

exports.getProjectInsuredCoverages = async (req, res) => {
	let queryParams = req.query || {};
	
	await projectInsuredCoverages.getProjectInsuredCoverages(queryParams, (err, projectInsuredCoverages, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: projectInsuredCoverages, totalCount: totalCount });
	});
};

exports.createProjectInsuredCoverages = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.coverageId || !params.projectInsuredId) {
		invalidData = true;
  }
	
	if(params.coverageId && (parseInt(params.coverageId) <= 0 || isNaN(parseInt(params.coverageId)))) invalidData = true;
	if(params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
		
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await projectInsuredCoverages.createProjectInsuredCoverages(params, (err, result, projectInsuredCoverageId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { projectInsuredCoverageId: projectInsuredCoverageId } });
	});
};

exports.removeProjectInsuredCoverages = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.projectInsuredCoverageId || (parseInt(params.projectInsuredCoverageId) <= 0 || isNaN(parseInt(params.projectInsuredCoverageId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await projectInsuredCoverages.removeProjectInsuredCoverages(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};