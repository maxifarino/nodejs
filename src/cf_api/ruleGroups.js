const ruleGroups = require('../cf_mssql/ruleGroups');
const error_helper = require('../helpers/error_helper');

exports.getRuleGroups = async (req, res) => {
	let queryParams = req.query || {};
  await ruleGroups.getRuleGroups(queryParams, (err, ruleGroups, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, ruleGroups: ruleGroups, totalCount: totalCount });
	});
};

exports.createRuleGroups = async (req, res) => {
	let params = req.body;
  let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if((!params.ruleGroupName ||
			!params.requirementSetId ||
			!params.coverageTypeId)) 
	{
		invalidData = true;
  }

	if(params.requirementSetId && (parseInt(params.requirementSetId) <= 0 || isNaN(parseInt(params.requirementSetId)))) invalidData = true;
	if(params.coverageTypeId && (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await ruleGroups.createRuleGroups(params, (err, result, ruleGroupId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { ruleGroupId: ruleGroupId } });
	});
};

exports.updateRuleGroups = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
	}
	
	if((!params.ruleGroupId ||
		!params.ruleGroupName ||
		!params.requirementSetId ||
		!params.coverageTypeId)) 
	{
		invalidData = true;
	}
  
  if(!params.ruleGroupId || (parseInt(params.ruleGroupId ) <= 0 || isNaN(parseInt(params.ruleGroupId )))) invalidData = true;  
	if(params.requirementSetId && (parseInt(params.requirementSetId) <= 0 || isNaN(parseInt(params.requirementSetId)))) invalidData = true;
	if(params.coverageTypeId && (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await ruleGroups.updateRuleGroups(params, (err, result, ruleGroupId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { ruleGroupId: ruleGroupId } });
	});
};

exports.removeRuleGroups = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.ruleGroupId || (parseInt(params.ruleGroupId ) <= 0 || isNaN(parseInt(params.ruleGroupId )))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await ruleGroups.removeRuleGroups(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};