const rules = require('../cf_mssql/rules');
const error_helper = require('../helpers/error_helper');

exports.getRules = async (req, res) => {
	let queryParams = req.query || {};
  await rules.getRules(queryParams, (err, rules, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, rules: rules, totalCount: totalCount });
	});
};

exports.createRules = async (req, res) => {
	let params = req.body;
  let invalidData = false;
	
	if(!params) {
		invalidData = true;
	}

	if((!params.ruleGroupId ||
			!params.attributeId ||
			!params.conditionTypeId ||
			!params.deficiencyTypeId ||
			!params.deficiencyText)) 
	{
		invalidData = true;
  }
	
	if(params.ruleGroupId && (parseInt(params.ruleGroupId) <= 0 || isNaN(parseInt(params.ruleGroupId)))) invalidData = true;
	if(params.attributeId && (parseInt(params.attributeId) <= 0 || isNaN(parseInt(params.attributeId)))) invalidData = true;
	if(params.conditionTypeId && (parseInt(params.conditionTypeId) <= 0 || isNaN(parseInt(params.conditionTypeId)))) invalidData = true;
	if(params.deficiencyTypeId && (parseInt(params.deficiencyTypeId) <= 0 || isNaN(parseInt(params.deficiencyTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await rules.createRules(params, (err, result, ruleId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { ruleId: ruleId } });
	});
};

exports.updateRules = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }
  
  if(!params.ruleId || (parseInt(params.ruleId ) <= 0 || isNaN(parseInt(params.ruleId )))) invalidData = true;  

	if((!params.ruleId ||
		!params.ruleGroupId ||
		!params.attributeId ||
		!params.conditionTypeId ||
		!params.deficiencyTypeId ||
		!params.deficiencyText)) 
{
	invalidData = true;
}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await rules.updateRules(params, (err, result, ruleId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { ruleId: ruleId } });
	});
};

exports.removeRules = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.ruleId || (parseInt(params.ruleId ) <= 0 || isNaN(parseInt(params.ruleId )))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await rules.removeRules(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};