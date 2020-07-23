const { verbose } = require('../../../logConfig')
const error_helper = require('../../helpers/error_helper')
const wf_sql = require('./cf_wf_mssql')
const wf_utils = require('./utils')
const tasksController = require('./controllers/tasks');

const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiIyMzQyMzQyMzQyMzQyMzQiLCJjbGllbnRfc2VjcmV0IjoiZGZzZnNkZmhzZGtqZmhza2RqZmhhIiwiZXhwaXJlc19pbiI6Ijk5OTk5OTkiLCJzY29wZSI6bnVsbCwiaWF0IjoxNTYyMjY2NDU4LCJleHAiOjE1NzIyNjY0NTd9.yD0TZX284ATjtDpsuZjJq3z2VPmhSlpG71-srPCywng";



exports.executeWorkflow = async (req, res, callback) => {
    
    // Token Control
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token !== access_token) {
		console.log('Access token invalid!!');
		return res.status(200).json({ success: false, data: 'Access token invalid!!'  });
	}
	/*
	// Skip execution if engine disabled in backend
	if((process.env.DISABLED_WF == 1)){
		console.log('Workflow process DISABLED');
		return res.status(200).json({ success: false, data: 'Workflow process DISABLED'  });
	}

	// Check  if there is another instance running
    let runninginstance = 'workflow';
    let isInstanceRunning = false;
	if(verbose) console.log('Check if other WF instance is running');
	await workflows_mssql.getWFIsRunningQuery(function(err, result) {
		console.log(`IS WORKFLOW PROCESS RUNNING  -> ${result}`);

		if (err) {
			console.log(err)
		}
		isInstanceRunning = result;
	});

    // Abort process if another instance is already running
	if(isInstanceRunning) {
		if(verbose)
			console.log('Other WF instance is running, then exit this process instance');
		return res.status(200).json({ success: true, data: { msg: 'Other WF instance is running, then exit this process instance' } });
	}

    // Add new process trail
    if(verbose) console.log('Add new WF process as running');
	await workflows_mssql.generateAddNewWFProcess(runninginstance,function(err) {
		if (err) {
			console.log(err)
		}
	});
    */

	
    // MAIN 
    console.log('[CF Workflow] Workflow process called at: ',new Date());
	//return res.status(200).json({ success: true, data: {msg: 'Workflow process started!' } });
    
    let activeWorkflows = [];

	// get all active workflows that need processing
	console.log('[CF Workflow] Getting active workflows...');
	await wf_sql.getActiveWorkflows( (err, result) => {
		if (err) {
			console.log('[CF Workflow] Error getting active workflows: ', err);
		}
		activeWorkflows = result;
	});

	// process each workflow
	for(i = 0; i < activeWorkflows.length; i++) {
		workflow = activeWorkflows[i];
		console.log('[CF Workflow] Getting current component for workflow instance:\n', workflow)
		
		let currentComp = await wf_utils.getCurrentWfComponent(workflow.WorkflowConfigId, workflow.StepIndex)
		console.log('[CF Workflow] Getting configuration for wf component: ',currentComp)
		
		if (currentComp) {
			await wf_utils.getComponentConfiguration(currentComp.Id, (compConfigs) => {

				compConfigs.holderId = workflow.HolderId;
				compConfigs.projectInsuredId = workflow.ProjectInsuredId;

				wf_utils.executeComponent(currentComp, compConfigs, workflow, () => {
					wf_utils.goToNextStep(workflow)
				})
			})
		}



		//if()
		//wf_utils.goToNextStep(workflow.WorkflowId)
	}

	console.log('[CF Workflow] Workflow process completed at: ',new Date());
	return res.status(200).json({ success: true, data: { msg: 'Workflow process completed!' } });
	
	/*
	await workflows_mssql.generateCompleteWFProcess(function(err) {
		if(verbose)
			console.log('WF process is completed');
		if (err) {
			console.log(err)
			return res.status(200).json({ success: true, data: { msg: 'Workflow process > ', err } });
		}
		return res.status(200).json({ success: true, data: { msg: 'Workflow process > WF process is completed' } });
	}); */	
}

exports.UpdateWorflowStatus = async (req, res) => {
	const wId = 1//req.body.workflowInstanceId
	const status = 'On Hold'//req.body.status
/*
  if(!wId || (parseInt(wId) <= 0 || isNaN(parseInt(wId)))){
	let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA)
	return res.send(error)
  }

  if(!status || (status = '' || isNaN(status))){
	let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA)
	return res.send(error)
  }
*/
  await wf_utils.updateWorkflowStatus(wId, status, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err)
    }  
		return res.status(200).json({ success: true, data: result });
	});
	
}

exports.InstanceNewWorkflow = async (req, res) => {	
	console.log(req.params)
	const wfType =  req.body.workflowType
	const holderId = req.body.holderId
	const projectInsuredId = req.body.projectInsuredId
	const ruleGroupId = req.body.workflowType
	const ruleId = req.body.workflowType
	const certId = req.body.workflowType
/*
  if(!wId || (parseInt(wId) <= 0 || isNaN(parseInt(wId)))){
	let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA)
	return res.send(error)
  }
*/
  await wf_utils.createNewInstance(wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err)
    }  
		return res.status(200).json({ success: true, data: result });
	});
	
}

exports.CheckExpiries = async (req, res) => {

	const holderId = req.body.holderId
	const projectInsuredId = req.body.projectInsuredId
	const ruleGroupId = req.body.workflowType
	const ruleId = req.body.workflowType
	const certId = req.body.workflowType


	const params = {
		"ProjectInsuredID": 2,
		"ProjectID": 1068,
		"InsuredID": 5216,
		"ProjectInsuredStatusID": 0,
		"ComplianceStatusID": 6,
		"RequirementSetID": 6,
		"RuleGroupID": 1001,
		"RuleID": 1004,
		"HolderID": 1125,
		"CoverageTypeId": 1,
		"CoverageType": "General Liability",
		"DisplayOrder": 0,
		"CoverageStatusID": 1,
		"CoverageStatus": "Non-Submitted",
		"RuleAttributeId": 9,
		"AttributeName": "Limit - Each Occurence",
		"ConditionTypeID": 5,
		"ConditionValue": "500000",
		"AttributeValue": null,
		"CAAttributeID": null,
		"CoverageAttributeStatusID": null,
		"AttributeStatus": "NON-SUBMITTED",
		"ProjectInsuredDeficiencyID": null,
		"DeficiencyTypeID": null,
		"DeficiencyTypeName": null,
		"DeficiencyText": "The General Liability per occurrence limit must be a minimum limit of $500,000.",
		"DeficiencyStatusID": null,
		"DeficiencyStatusName": "Non-Submitted",
		"CertificateID": 11,
		"DocumentId": 69,
		"DocumentStatus": "Non-Submitted"
	};

	await tasksController.createExpiredWaiverTask(params)
		.then( res => {
			console.log(res)
		})
/*
  if(!wId || (parseInt(wId) <= 0 || isNaN(parseInt(wId)))){
	let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA)
	return res.send(error)
  }
*/
  await wf_utils.createNewInstance(wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err)
    }

		return res.status(200).json({ success: true, data: result });
	});
	
}