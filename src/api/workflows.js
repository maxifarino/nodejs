const _ = require('underscore')
const workflowsSQL = require('../mssql/workflows')
const sql_helper = require('../mssql/mssql_helper')
const workflows_query_provider = require('../providers/workflows_query_provider')
const error_helper = require('../helpers/error_helper');

exports.getWorkflows = async function(req, res) {

	var invalidData = false;
	let params = req.query;
	let hiringClientId = null;
	let system = params.system;

	if(!params) invalidData = true;
	if(invalidData != true) {
		hiringClientId = params.hiringClientId;

		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	workflowsSQL.getWorkflows(hiringClientId, system, function(err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}

		//console.log(result);

		return res.status(200).json({ success: true, data: result });
	});
}

exports.getWorkflowSteps = async function(req, res) {

	var invalidData = false;
	let params = req.query;
	let hiringClientId = null;

	if(!params) invalidData = true;
	if(invalidData != true) {
		hiringClientId = params.hiringClientId;

		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	workflowsSQL.getWorkflow(hiringClientId, function(err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}

		//console.log(result);

		return res.status(200).json({ success: true, data: result });
	});
}

exports.getWFMailTemplate = async function(req, res) {

	var invalidData = false;
	let params = req.query;
	let hiringClientId = null;
	let workflowTypeId = null;

	if(!params) invalidData = true;

	if(invalidData != true) {
		hiringClientId = params.hiringClientId;
		workflowTypeId = params.workflowTypeId;

		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;

		if(!workflowTypeId) invalidData = true;
		if(workflowTypeId && (parseInt(workflowTypeId) <= 0 || isNaN(parseInt(workflowTypeId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	workflowsSQL.getWFMailTemplate(hiringClientId, workflowTypeId, function(err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}


exports.setWfSCStatusById = async function(req, res) {
	var invalidData = false;
  let 
    params = req.body,
	  hiringClientId,
	  subcontractorId,
    subcontractorStatusId,
    userId

	if(!params) {
		invalidData = true;
	} 
	else {
		hiringClientId = params.hiringClientId;
		subcontractorId = params.subcontractorId;
    subcontractorStatusId = params.subcontractorStatusId;
    userId = params.userId;

		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;

		if(!subcontractorId) invalidData = true;
		if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;

		if(!subcontractorStatusId) invalidData = true;
    if(subcontractorStatusId && (parseInt(subcontractorStatusId) <= 0 || isNaN(parseInt(subcontractorStatusId)))) invalidData = true;
    
    if(!userId) invalidData = true;
		if(userId && (parseInt(userId) <= 0 || isNaN(parseInt(userId)))) invalidData = true;
	}

	if(invalidData){
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	const hc_sc_pair = {};
	hc_sc_pair.subcontractorId = subcontractorId;
  hc_sc_pair.hiringClientId = hiringClientId;
  
  const connection = await sql_helper.getConnection();
  const calibratedParam = {}
        calibratedParam.hiringClientId = hiringClientId
        calibratedParam.subContractorId = subcontractorId
  const query = await workflows_query_provider.generateSCStatusIdByHC_SC_PairQuery(calibratedParam);
  const result = await connection.request().query(query);
  
  const oldStatusId = result.recordset[0].SubcontractorStatusId
  connection.close(); 

	await workflowsSQL.setWfSCStatusById(hc_sc_pair, subcontractorStatusId, async function(err) {
		if (err) {
      const error = error_helper.getSqlErrorData(err);
			return res.status(500).send(error);
    }

    await workflowsSQL.updateSCstatusLog(hc_sc_pair, oldStatusId, subcontractorStatusId, function(err) {
      if (err) {
        const error = error_helper.getSqlErrorData(err);
        return res.status(500).send(error);
      }
      return res.status(200).json({ success: true});
    });

  });
	
}

exports.getComponentParameters = async function(req, res) {

	var invalidData = false;
	let params = req.query;
	let componentId = null;

	if(!params) invalidData = true;
	if(invalidData != true) {
		componentId = params.componentId;

		if(!componentId) invalidData = true;
		if(componentId && (parseInt(componentId) <= 0 || isNaN(parseInt(componentId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	workflowsSQL.getComponentParameters(componentId, function(err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}

exports.addWorkflow = async function(req, res) {
	var invalidData = false;
	let params = req.body;
	let hiringClientId = null;
	let workflowTypeId = null;

	if(!params) invalidData = true;
	if(invalidData != true) {
		hiringClientId = params.hiringClientId;
		workflowTypeId = params.workflowTypeId;

		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;

		if(!workflowTypeId) invalidData = true;
		if(workflowTypeId && (parseInt(workflowTypeId) <= 0 || isNaN(parseInt(workflowTypeId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	await workflowsSQL.addWorkflow(params, function(err, result, workflowId) {
		var locWorkflowId = workflowId;
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if(params.id)
			locWorkflowId = params.id;

		return res.status(200).json({ success: true, data: { workflowId: locWorkflowId } });
	});
}

exports.getWorkflowComponents = async function (req, res) {
	try {
		var invalidData = false;
		var workflowId;
		var workflowTypeId;
		var resetToDefaultWF;
		var system;
		let params = req.query;
		if(!params) invalidData = true;

		if(invalidData != true) {
			workflowId = params.workflowId;
			resetToDefaultWF = params.resetToDefaultWF;
			system = params.system || 'pq';


			if(workflowId &&
				(parseInt(workflowId) <= 0 || isNaN(parseInt(workflowId)))) invalidData = true;
			if(resetToDefaultWF && (resetToDefaultWF != 'true' && resetToDefaultWF != 'false'))
				invalidData = true;

			if (system && system != 'cf' && system != 'pq') {
				invalidData = true;
			}
		}

		if(invalidData){
			let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		   return res.send(error);
		}

		//Get all possible components for a workflow whith all the possible parameters with all the possible values
		var possible_values = [];

		await workflowsSQL.getWorkflowAllComponentsAllParamsAllValues(workflowId, system, function(err, possibleValues) {
			if (err) {
				console.log(err);
				let error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}

			possible_values = possibleValues;
		});

		if(resetToDefaultWF == 'true') {
			// Get HC by WF id
			await workflowsSQL.getHCFromWorkflowId(params.workflowId, async function(err, result) {
				if(err) {
					console.log(err);
					let error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}

				if(result) {
					hiringClientId = result[0].hiringClientId;
					workflowTypeId = result[0].workflowTypeId;
				}

			});

			// Remove current WF
			await workflowsSQL.removeCurrentWF(hiringClientId, async function(err) {
				if(err) {
					console.log(err);
					let error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}
			});

			console.log("Removed wf:" + workflowId + " for HC:" + hiringClientId);

			// Clone default WF
			await workflowsSQL.cloneDefaultWF(hiringClientId, async function(err, workflowId) {
				if(err) {
					console.log(err);
					let error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}
			});

			// Assign new created workflowId
			await workflowsSQL.getWFIdFromHCIdAndWFTypeId(hiringClientId, workflowTypeId, async function(err, result) {
				if(err) {
					console.log(err);
					let error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}

				if(result) {
					workflowId = result[0].id;
				}

			});

			console.log("Cloned default wf to new id:" + workflowId + " for HC:" + hiringClientId);
		}

		console.log("Get Workflow components:");

		// Get components for provided workflowId
		var components = [];
		await workflowsSQL.getWorkflowComponents(workflowId, async function(err, result) {
			if (err) {
				console.log(err);
				let error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
			if (!result) {
				let error = error_helper.getErrorData(error_helper.CODE_WORKFLOW_NOT_FOUND, error_helper.MSG_WORKFLOW_NOT_FOUND);
				return res.send(error);
			}

			components = result.recordset;
			componentsResp = [];

			for(i = 0; i < components.length; i++) {
				var component = {};
				component.positionIndex =components[i].positionIndex;
				component.current_value = {};
				component.current_value.componentId = components[i].componentId;
				component.current_value.workflowComponentId = components[i].workflowComponentId;
				component.current_value.name = components[i].name;

				// Get parameters
				await workflowsSQL.getComponentCurrentParameters(components[i].workflowComponentId, function(err, parametersResult) {
						if (err) {
							console.log(err);
							let error = error_helper.getSqlErrorData(err);
							return res.send(error);
						}
						if (!result) {
							let error = error_helper.getErrorData(error_helper.CODE_WORKFLOW_NOT_FOUND, error_helper.MSG_WORKFLOW_NOT_FOUND);
							return res.send(error);
						}

						var current_parameters = [];
						var parameters = parametersResult.recordset;

						let compPossibleValues = workflowsSQL.getComponentParameters();

						for(j = 0; j < parameters.length; j++) {
							var current_parameter = {};
							current_parameter.workflowsComponentsParamsValuesId = parameters[j].workflowsComponentsParamsValuesId;
							current_parameter.componentParameterId = parameters[j].componentParameterId;
							current_parameter.name = parameters[j].name;
							current_parameter.value = parameters[j].value;
							current_parameter.componentId = parameters[j].componentId;
							current_parameter.valueId = null;

							for(let h = 0; h < compPossibleValues.length; h++) {
								if(current_parameter.value == compPossibleValues[h].value) {
									current_parameter.valueId = compPossibleValues[h].id;
								}
							}
							current_parameters.push(current_parameter);
						}

						component.current_parameters = current_parameters;
						componentsResp.push(component);
					});
				}

	  		return res.status(200).json({ success: true, workflowId: workflowId, components: componentsResp, possible_values: possible_values });
		});
	}
	catch(err) {
		console.log(err);
		return res.status(500).send(error);
	}
}

exports.addWorkflowSteps = async function(req, res) {
	var invalidData = false;
	let params = req.body;
	let hiringClientId = null;
	let workflowTypeId = null;
	let components = null;

	if(!params) invalidData = true;
	if(invalidData != true) {
		hiringClientId = params.hiringClientId;
		workflowTypeId = params.workflowTypeId;
		components = params.components;

		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
		if(!workflowTypeId) invalidData = true;
		if(workflowTypeId && (parseInt(workflowTypeId) <= 0 || isNaN(parseInt(workflowTypeId)))) invalidData = true;

		if(!components)
			invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	await workflowsSQL.addOrUpdateWorkflowSteps(params, function(err, result, workflowId) {
		var locWorkflowId = workflowId;
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if(params.id)
			locWorkflowId = params.id;

		return res.status(200).json({ success: true, data: { workflowId: locWorkflowId } });
	});
}
