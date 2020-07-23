const projectCustomFields = require('../cf_mssql/projectCustomFields');
const error_helper = require('../helpers/error_helper');

exports.getProjectCustomFields = async (req, res) => {
	let queryParams = req.query || {};
  await projectCustomFields.getProjectCustomFields(queryParams, (err, projectCustomFields, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, projectCustomFields: projectCustomFields, totalCount: totalCount });
	});
};

exports.getProjectCustomFieldsByProjectId = async (req, res) => {
  let queryParams = req.query || {};
  let invalidData = false;

  if(!queryParams.projectId) {
		invalidData = true;
  }
  if(queryParams.projectId && (parseInt(queryParams.projectId) <= 0 || isNaN(parseInt(queryParams.projectId)))) invalidData = true;
  
  if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }

  await projectCustomFields.getProjectCustomFieldsByProjectId(queryParams, (err, projectCustomFields, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, projectCustomFields: projectCustomFields, totalCount: totalCount });
	});
};

/**
 * @param {Number} projectId
 * @param {Array} customFields - ex: [{ customFieldId, fieldName, fieldValue, displayOrder, archived }]
 */
exports.createProjectCustomFields = async (req, res) => {
  let params = req.body;
	let invalidData = false;
	
	if(!params) {
		invalidData = true;
	}
	if(!params.projectId) {
		invalidData = true;
  }
  
  if(!Array.isArray(params.customFields)) {
    try {
      JSON.parse(params.customFields);
    } catch(e) {
      invalidData = true;
    }      
  } 

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await projectCustomFields.createProjectCustomFields(params, (err) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true });
	});
};