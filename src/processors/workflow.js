const workflows_mssql = require('../mssql/workflows');
const workflows_utils = require('./wf_utils');
const { verbose } = require('../../logConfig')

const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiIyMzQyMzQyMzQyMzQyMzQiLCJjbGllbnRfc2VjcmV0IjoiZGZzZnNkZmhzZGtqZmhza2RqZmhhIiwiZXhwaXJlc19pbiI6Ijk5OTk5OTkiLCJzY29wZSI6bnVsbCwiaWF0IjoxNTYyMjY2NDU4LCJleHAiOjE1NzIyNjY0NTd9.yD0TZX284ATjtDpsuZjJq3z2VPmhSlpG71-srPCywng";

var error_helper = require('../helpers/error_helper');

const _processSC_HC_Pair = async function(hc_sc_pair, scStatus, workflowType) {
	// Process sc hc pair

	// Get WF
	let wf = await workflows_utils.getWF(hc_sc_pair, workflowType);

	// No WF found, then nothing to do here
	if(!wf) return;

	// WF has no components, nothing to do here
	if(wf.components.length == 0) return;

	// Step index is incorrect, raise error
	if(wf.components.length + 1 < hc_sc_pair.wfStepIndex) {
		console.log("WF Done for this wf type, current step:" + hc_sc_pair.wfStepIndex);
	}

	if(verbose) {
		console.log('Workflow process > HC SC pair:' + hc_sc_pair.hiringClientId, hc_sc_pair.subcontractorId, scStatus.status);
	}

	if(verbose) {
		console.log("processSC_HC_Pair:");
		console.log(hc_sc_pair);
		// console.log(wf);
	}

	await workflows_utils.execAction(wf, hc_sc_pair);
}


const _processSCStatus = async function(scStatus, workflowType) {
	// Process sc status
	try {
		let hc_scList = [];

		// Select Hiring clients and SC with this status
		await workflows_mssql.getHC_SC_ByStatus(scStatus.id, function(err, result) {
				if(verbose)
					console.log('Workflow process > SC Status:' + scStatus.status);

				if (err) {
					console.log(err)
				}

				hc_scList = result;
		});

    if(verbose) console.log(hc_scList);
    console.log('Worflow item list total: ', hc_scList.length)
		// process each hc sc pair
		let j = 0;
		for(j = 0; j < hc_scList.length; j++) {
			hc_sc_pair = hc_scList[j];
			hc_sc_pair.statusId = scStatus.id;
			await _processSC_HC_Pair(hc_sc_pair, scStatus, workflowType);
		}
	}
	catch(err) {
		console.log(err);
	}
}



const _processWFType = async function(workflowType) {
	// Process workflow type

	let scStatusList = [];

	await workflows_mssql.getSCStatusByWFTypeQuery(workflowType.id, function(err, result) {
		if(verbose)
			console.log('Workflow type process:' + workflowType.description);
		if (err) {
			console.log(err)
		}

		scStatusList = result;
	});

	// process each sc status
	let k = 0;
	for(k = 0; k < scStatusList.length; k++) {
		scStatus = scStatusList[k];
		await _processSCStatus(scStatus, workflowType);
	}
}

// exports.processWF = async function (callback) {
exports.processWF = async function (req, res, callback) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token !== access_token) {
		console.log('Access token invalid!!');
		return res.status(200).json({ success: false, data: 'Access token invalid!!'  });
	}
	if((process.env.DISABLED_WF == 1)){
		console.log('Workflow process DISABLED');
		return res.status(200).json({ success: false, data: 'Workflow process DISABLED'  });
	}
	// Get workflow types
  console.log('Workflow process RUNNING:',new Date());

	let runninginstance = 'workflow';
	let workflowsTypes = [];
	let isInvalid = false;
	// return res.status(200).json({ success: true, data: { } });

	// Check  if there is another instance runnin
	let isInstanceRunning = false;
	if(verbose) console.log('Check if other WF instance is running');
	await workflows_mssql.getWFIsRunningQuery(function(err, result) {
		console.log(`IS WORKFLOW PROCESS RUNNING  -> ${result}`);

		if (err) {
			console.log(err)
		}
		isInstanceRunning = result;
	});

	if(isInstanceRunning) {
		if(verbose)
			console.log('Other WF instance is running, then exit this process instance');
		return res.status(200).json({ success: true, data: { msg: 'Other WF instance is running, then exit this process instance' } });
	}

	if(verbose) console.log('Add new WF process as running');
	await workflows_mssql.generateAddNewWFProcess(runninginstance,function(err) {
		if (err) {
			console.log(err)
		}
	});
	
	await workflows_mssql.getWorkflowsTypes(function(err, result) {
		if(verbose)
			console.log('Workflow process > Select processes types');
		if (err) {
			isInvalid = true;
		}

		workflowsTypes = result;
	});

	if(isInvalid) {
		console.log("invalid process");
		return res.status(200).json({ success: true, data: { msg: 'Workflow process > Select processes types: invalid process' } });
	}

	// process each WF type
	for(i = 0; i < workflowsTypes.length; i++) {
		workflowType = workflowsTypes[i];
		await _processWFType(workflowType);
	}

	await workflows_mssql.generateCompleteWFProcess(function(err) {
		if(verbose)
			console.log('WF process is completed');
		if (err) {
			console.log(err)
			return res.status(200).json({ success: true, data: { msg: 'Workflow process > ', err } });
		}
		return res.status(200).json({ success: true, data: { msg: 'Workflow process > WF process is completed' } });
	});	
}


