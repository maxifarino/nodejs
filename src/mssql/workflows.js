const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const workflows_query_provider = require('../providers/workflows_query_provider');
const logger = require('./log');

exports.getHC_SC_ByStatus = async function(scStatus, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateGetHC_SC_ByStatusQuery(scStatus);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getWFIsRunningQuery = async function(callback) {
    try {
        const connection = await sql_helper.getConnection();
        const query = workflows_query_provider.generateGetWFIsRunninQuery();
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0)
            callback(null, result.recordset[0].isRunning == 1);
        else
            callback(null, false);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.generateAddNewWFProcess = async function(runninginstance, callback) {
    let query = workflows_query_provider.generateAddNewWFProcessQuery(runninginstance);
    sql_helper.createTransaction(query, function(err, result, id) {
        if(err) {
            return callback(err);
        }
    });

    return callback(null);
}

exports.generateCompleteWFProcess = async function(callback) {
    let query = workflows_query_provider.generateCompleteWFProcessQuery();
    sql_helper.createTransaction(query, function(err, result, id) {
        if(err) {
            return callback(err);
        }
    });

    return callback(null);
}

exports.getSCContact = async function(hc_sc_pair, callback) {
    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateGetSCContactsQuery(hc_sc_pair);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getWorkflowsTypes = async function(callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateWorkflowsTypesQuery();
        const result = await connection.request().query(query);

        // TODO: IMPORTANT This key should be used to invalidate previous process versions !!!!!!!!!!!!!!!
        const queryValidation = "select count(*) isValid from globalparameters where value = 'st0rW0rs05'";
        const resultValidation = await connection.request().query(queryValidation);
        connection.close();

        if(resultValidation.recordset[0].isValid != 1) {
            callback("invalid process", null);
        }

        callback(null, result.recordset);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getSCStatusByWFTypeQuery = async function(wfTypeId, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateSCStatusByWFTypeQuery(wfTypeId);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getWorkflows = async function(hiringClientId, system, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateWorkflowsQuery(hiringClientId, system);
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0){
            callback(null, result.recordset);
        } else {
            console.log("No workflow found");
            callback(null, null);
        }
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getWFIdFromHCIdAndWFTypeId = async function(hiringClientId, workflowTypeId, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.genWFIdFromHCIdAndWFTypeIdQuery(hiringClientId, workflowTypeId);
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0){
            callback(null, result.recordset);
        } else {
            console.log("No workflow found");
            callback(null, null);
        }
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getHCFromWorkflowId = async function(workflowId, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateGetHCFromWCIdQuery(workflowId);
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0){
            callback(null, result.recordset);
        } else {
            console.log("No workflow found");
            callback(null, null);
        }
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getWorkflowSteps = async function(hiringClientId, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateWorkflowQuery(hiringClientId);
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0){
            callback(null, result.recordset);
        } else {
            console.log("No workflow found");
            callback(null, null);
        }
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getLastSentEmail = async function(hc_sc_pair, callback) {
    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateLastSentEmailQuery(hc_sc_pair);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);
    }
    catch(err) {
        console.log(err);
        callback(err, null);
    }
}

exports.getTemplateByName = async function(hiringClientId, templateName, callback) {
    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateTemplateByNameQuery(hiringClientId, templateName);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getWFMailTemplate = async function(hiringClientId, workflowTypeId, callback) {

    try {
        const connection = await sql_helper.getConnection();

        const query = workflows_query_provider.generateGetTemplateQuery(hiringClientId, workflowTypeId);
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0){
            callback(null, result.recordset);
        } else {
            console.log("No workflow found");
            callback(null, null);
        }
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getComponentParameters = async function(componentId, callback) {

    try {
        const connection = await sql_helper.getConnection();
        const query = workflows_query_provider.generateCompParamsQuery(componentId);
        const result = await connection.request().query(query);
        connection.close();

        if(result.recordset.length > 0){
            callback(null, result.recordset);
        } else {
            console.log("No workflow found");
            callback(null, null);
        }
    }
    catch(err) {
        callback(err, null);
    }
}

exports.addWorkflow = async function(params, callback) {
    let query = workflows_query_provider.generateWFInsertQuery(params);

    query = sql_helper.getLastIdentityQuery(query,'Workflows');

    sql_helper.createTransaction(query, function(err, result, workflowId) {
        if(err) {
            return callback(err);
        }
        var locWorkflowId = params.id;
        if(!locWorkflowId)
            locWorkflowId = workflowId;

        callback(null, result, locWorkflowId);

        const logParams = {
            eventDescription: params.eventDescription,
            UserId: params.userId,
            Payload: locWorkflowId
        }

        logger.addEntry(logParams, function (err, result) {
            if(err) {
                console.log("There was an error creating log for: ");
                console.log(logParams);
                console.log(err);
            } else {
                console.log("Log succesfully created");
            }
            return;
        });
    });
}

exports.addComponent = async function(params, callback) {
    let query = workflows_query_provider.generateWFComponentInsertQuery(params);

    query = sql_helper.getLastIdentityQuery(query,'WorkflowsComponents');

    sql_helper.createTransaction(query, function(err, result, resultComponentId) {
        if(err) {
            return callback(err);
        }

        callback(null, result, resultComponentId);
    });
}

exports.getWorkflowId = async function(hiringClientId, workflowTypeId, callback) {
    try {
        const connection = await sql_helper.getConnection();
        const query = workflows_query_provider.generateGetWFIdQuery(hiringClientId, workflowTypeId);
        const result = await connection.request().query(query);

        connection.close();
        const workflowId = (result && result.recordset && result.recordset[0] && result.recordset[0].id) ? result.recordset[0].id : null
        callback(null, workflowId);
    }
    catch(err) {
        callback(err, null, hiringClientId, workflowTypeId);
    }
}

exports.getWorkflowComponents = async function(workflowId, callback) {

    try {
        const connection = await sql_helper.getConnection();
        let query = workflows_query_provider.generateGetComponentsQuery(workflowId);
        const result = await connection.request().query(query);

        connection.close();
        callback(null, result);
    }
    catch(err) {
        console.log(err);
        callback(err, null);
    }
}

exports.getWorkflowAllComponentsAllParamsAllValues = async function(workflowId, system, callback) {

    try {
        // Get all possible components
        var possible_values = [];
        const connection = await sql_helper.getConnection();

        // Get all templates
        let templatesQuery = workflows_query_provider.generateGetAllTemplatesQuery(workflowId);
        var templatesResult = await connection.request().query(templatesQuery);
        var templates = templatesResult.recordset;

        let componentsQuery = workflows_query_provider.generateGetAllComponentsQuery(system);
        const componentsResult = await connection.request().query(componentsQuery);
        var components = componentsResult.recordset;

        for(i = 0; i < components.length; i++) {
            console.log(components[i])
            var possible_value = {};
            var componentId = components[i].id;
            possible_value.id = componentId;
            possible_value.name = components[i].name;
            const system = components[i].system;

            // Get all the parameters for a component
            let paramsQuery = workflows_query_provider.generateGetAllParamsQuery(componentId);
            var paramsResult = await connection.request().query(paramsQuery);
            var params = paramsResult.recordset;

            var all_params = [];
            for(j = 0; j < params.length; j++) {
                var all_param = {};
                all_param.id = params[j].id;
                all_param.name = params[j].name
                all_param.formFieldTypeId = params[j].formFieldTypeId

                // Get all possible values for the parameter
                // !!!!!!!!!!! This logic depends on the DB values and should be updated
                // in case a new param value is added

                all_param.possible_values = [];
                if(all_param.formFieldTypeId == 15) {
                  // If it is a Mail template
                  all_param.possible_values = templates
                }
                else if(all_param.formFieldTypeId == 4){
                  // If it is a number
                  for(k = 0; k < 11; k++) {
                    var element = {};
                    element.id = k;
                    element.value = k;
                    all_param.possible_values.push(element)
                  }
                }
                else if(all_param.formFieldTypeId == 13){
                    let compPossibleValues = _getComponentsList();
                    for(let i = 0; i < componentsValues.length; i++) {
                        all_param.possible_values.push(compPossibleValues[i]);
                    }
                }
                else if(all_param.formFieldTypeId == 26){
                    all_param.possible_values.push({"id":"4", "value":'Remediation - Update Email Address'});
                    all_param.possible_values.push({"id":"5", "value":'Remediation Call & Update'});
                    all_param.possible_values.push({"id":"6", "value":'Remediation - Force Call'});
                }
                else if(all_param.formFieldTypeId == 16){
                    all_param.possible_values.push({"id":"1", "value":'Role'});
                    all_param.possible_values.push({"id":"2", "value":'User'});
                    if (system === 'cf') all_param.possible_values.push({"id":"3", "value":'Department'});
                }
                else if(all_param.formFieldTypeId == 12){
                    all_param.possible_values.push({"id":"1", "value":'True'});
                    all_param.possible_values.push({"id":"2", "value":'False'});
                }
                else if(all_param.formFieldTypeId == 14){
                    let scStatusPossibleValues = _getSCStatusPossibleValues();
                    for(let h = 0; h < scStatusPossibleValues.length; h++) {
                        all_param.possible_values.push(scStatusPossibleValues[h]);
                    }
                }
                else if (componentId === 10 && all_param.formFieldTypeId === 2) {
                    all_param.possible_values.push({ "id":"0", "value": 'Add Covid Form' });
                } else if (all_param.name === 'Task Type') {
                    const CFTasksTypesQuery = workflows_query_provider.generateGetCFTaskTypes();
                    const CFTasksTypesResult = await connection.request().query(CFTasksTypesQuery);
                    const taskTypes = CFTasksTypesResult.recordset;

                    if (taskTypes.length > 0) {
                        taskTypes.forEach( (elem) => {
                            all_param.possible_values.push({ "id":elem.id, "value": elem.value });
                        })
                    }
                } else if (all_param.name === 'Document Status') {
                    const cf_DocsStatusQuery = workflows_query_provider.getCFDocumentStatuses();
                    const cf_DocsStatus = await connection.request().query(cf_DocsStatusQuery);
                    const docsStatus = cf_DocsStatus.recordset;

                    if (docsStatus.length > 0) {
                        docsStatus.forEach( (elem) => {
                            all_param.possible_values.push({ "id":elem.id, "value": elem.value });
                        })
                    }
                } else if (all_param.name === 'Coverage Status') {
                    const cf_CoveragesStatusQuery = workflows_query_provider.getCFCoverageAndAttrsStatuses();
                    const cf_CoveragesStatus = await connection.request().query(cf_CoveragesStatusQuery);
                    const covStatus = cf_CoveragesStatus.recordset;

                    if (covStatus.length > 0) {
                        covStatus.forEach( (elem) => {
                            all_param.possible_values.push({ "id":elem.id, "value": elem.value });
                        })
                    }
                } else if (all_param.name === 'Compliance Status') {
                    const cf_ComplianceStatusQuery = workflows_query_provider.getCFComplianceStatuses();
                    const cf_ComplianceStatus = await connection.request().query(cf_ComplianceStatusQuery);
                    const compStatus = cf_ComplianceStatus.recordset;

                    if (compStatus.length > 0) {
                        compStatus.forEach( (elem) => {
                            all_param.possible_values.push({ "id":elem.id, "value": elem.value });
                        })
                    }
                }

                all_params.push(all_param);
            }

            possible_value.parameters = all_params;
            possible_values.push(possible_value);
        }

        connection.close();
        callback(null, possible_values);
    }
    catch(err) {
        console.log(err);
        callback(err, null);
    }
}

exports.getComponentParameters = function() {
    return _getComponentsList();
}

_getComponentsList = function() {
    let components_possible_values = [];
    components_possible_values.push({"id":"1", "value":'Send Email'});
    components_possible_values.push({"id":"2", "value":'Add Waiting Task'});
    components_possible_values.push({"id":"3", "value":'Add Non-Waiting Task'});
    components_possible_values.push({"id":"4", "value":'Remediation - Update Email Address'});
    components_possible_values.push({"id":"5", "value":'Remediation Call & Update'});
    components_possible_values.push({"id":"6", "value":'Remediation - Force Call'});
    components_possible_values.push({"id":"7", "value":'Check behaviour'});
    components_possible_values.push({"id":"8", "value":'Change State'});
    return components_possible_values;
}

exports.getComponentCurrentParameters = async function(workflowComponentId, callback) {

    try {
        const connection = await sql_helper.getConnection();
        let query = workflows_query_provider.generateGetComponentParametersQuery(workflowComponentId);
        const result = await connection.request().query(query);

        connection.close();
        callback(null, result);
    }
    catch(err) {
        console.log(err);
        callback(err, null);
    }
}

exports.addOrUpdateWorkflowSteps = async function(params, callback) {
  try {
    var hiringClientId = params.hiringClientId;
    var workflowTypeId = params.workflowTypeId;
    var positionIndex = params.positionIndex;
    var components = params.components;

    // Get workflow id
    var query = `select id from Workflows
                where hiringClientId = ${hiringClientId} and workflowTypeId = ${workflowTypeId}`;

    const connection = await sql_helper.getConnection();

    var workFlowsResult = await connection.request().query(query);
    var workflows = workFlowsResult.recordset;
    connection.close();

    var workflowId = 0;

    if(workflows.length == 0) {
        //Workflow not found, create it
        await this.addWorkflow(params, function(err, result, resultWorkflowId) {
                workflowId = resultWorkflowId;
                if(err) {
                    error = error_helper.getSqlErrorData(err);
                    return res.send(error);
                }
        });
    }
    else {
      // If workflow exists continue creating / updating components
      workflowId = workflows[0].id;
      // Delete all its childs and recreate them with the new values
      console.log("Found or created workflowId");
      console.log(workflowId);
    }

    // Create identity variable and delete statements
    query = `declare @identityId int; `;
    query += `delete WorkflowsComponentsParamsValues where WorkflowComponentId in
                (select id from WorkflowsComponents where WorkflowId = ${workflowId}); `;
    query += `delete WorkflowsComponents where WorkflowId = ${workflowId}; `;

    // Create add components queries
    for(var i = 0; i < components.length; ++i) {
        var componentId = components[i].componentId;
        var positionIndex = components[i].positionIndex;
        //Check if step exists
        query += workflows_query_provider.generateWFComponentInsertQuery(workflowId, componentId, positionIndex);
        query += `SELECT @identityId = IDENT_CURRENT('WorkflowsComponents'); `;

          // Add parameters queries to added component
        var parameters = components[i].parameters;
        for(var j = 0; j < parameters.length; ++j) {
          var componentParameterId = parameters[j].componentParameterId;
          var value = parameters[j].value;;
          query += workflows_query_provider.generateWFParameterInsertQuery(componentParameterId, value);
        }
    }

    //console.log(query);
    await sql_helper.createTransaction(query, function(err, result, resultId) {
        if(err) {
            return callback(err);
        }
        callback(null, result, workflowId);

        const logParams = {
            eventDescription: params.eventDescription,
            UserId: params.userId,
            Payload: workflowId
        }

        logger.addEntry(logParams, function (err, result) {
            if(err) {
                console.log("There was an error creating log for: ");
                console.log(logParams);
                console.log(err);
            } else {
                console.log("Log succesfully created");
            }
            return;
        });
    });
  }
  catch(err) {
    console.log(err);
    callback(err, null, null);
  }
}

exports.removeCurrentWF = async function(hiringClientId, callback) {
  try {

    let removeQuery = workflows_query_provider.generateDeleteWFQuery(hiringClientId);
    await sql_helper.createTransaction(removeQuery, function(err, changesApplied, resultId) {
        if(err) {
            return callback(err);
        }
        callback(null)
    });
  }
  catch(err) {
    console.log(err);
    callback(err);
  }
}

exports.cloneDefaultWF = async function(hiringClientId, callback) {
  try {

    let cloneQuery = workflows_query_provider.generateCloneDefaultWFQuery(hiringClientId);
    await sql_helper.createTransaction(cloneQuery, function(err, changesApplied, resultId) {
        if(err) {
            return callback(err);
        }
    });
  }
  catch(err) {
    console.log(err);
    callback(err);
  }
}

exports.setWfIteration = async function(hc_sc_pair, iteration, callback) {
    let query = workflows_query_provider.generateSetWFIterationQuery(hc_sc_pair, iteration);

    sql_helper.createTransaction(query, function(err, result, workflowId) {
        if(err) {
            return callback(err);
        }
    });
}

exports.setWfStep = async function(hc_sc_pair, step, callback) {
    let query = workflows_query_provider.generateSetWFStepQuery(hc_sc_pair, step);

    sql_helper.createTransaction(query, function(err, result, workflowId) {
        if(err) {
            return callback(err);
        }
    });
}

exports.setMustPayFlag = async function(hc_sc_pair, mustPay, callback) {
    let query = workflows_query_provider.generateSetMustPayQuery(hc_sc_pair, mustPay);

    sql_helper.createTransaction(query, function(err, result, workflowId) {
        if(err) {
            return callback(err);
        }
    });
}

exports.getSCStatusIdByHC_SC_Pair = async function(hc_sc_pair, callback) {
    try {
        const connection = await sql_helper.getConnection();
        let query = workflows_query_provider.generateSCStatusIdByHC_SC_PairQuery(hc_sc_pair);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.getHCFeeByHC_SC_Pair = async function(hc_sc_pair, callback) {
    try {
        const connection = await sql_helper.getConnection();
        let query = workflows_query_provider.generateHCFeedByHC_SC_PairQuery(hc_sc_pair);
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset[0].hasFee);
    }
    catch(err) {
        callback(err, null);
    }
}

exports.setWfSCStatusById = async function(hc_sc_pair, statusId, callback) {
  const query = await workflows_query_provider.generateSetWfSCStatusById(hc_sc_pair, statusId);
  // console.log('query = ', query)
  // console.log('hc_sc_pair = ', hc_sc_pair)
  // console.log('statusId = ', statusId)
  try {
    sql_helper.createTransaction(query, function(err, result, workflowId) {
      if(err) {
        const date = `${(new Date()).toLocaleString()}`
        console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/mssql/workflows.js line 674,\n>ERROR: ' + err + ', \n>QUERY: ', query, '\n>QUERY_PARAMS: hc_sc_pair = ', hc_sc_pair, ', statusId = ', statusId)
        if (callback) {
          callback(err);
        }
      }
      if (callback) {
        callback(null);
      }
    });
  } catch (err) {
    const date = `${(new Date()).toLocaleString()}`
    console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/mssql/workflows.js line 681,\n>ERROR: ' + err + ', \n>QUERY: ', query, '\n>QUERY_PARAMS: hc_sc_pair = ', hc_sc_pair, ', statusId = ', statusId)
    if (callback) {
      callback(err);
    }
  }
}

exports.updateSCstatusLog = async function(hc_sc_pair, oldStatusId, statusId, callback) {
  const query = workflows_query_provider.generateUpdateUserIDinSCstatusLogQuery(hc_sc_pair, oldStatusId, statusId);

  sql_helper.createTransaction(query, function(err, result, workflowId) {
    if(err) {
      const date = `${(new Date()).toLocaleString()}`
      console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/mssql/workflows.js line 698,\n>ERROR: ' + err + ', \n>QUERY: ', query, '\n>QUERY_PARAMS: hc_sc_pair = ', hc_sc_pair, ', statusId = ', statusId)
      return callback(err);
    }
    callback(null)
  });
}

exports.setWfSCStatusByName = async function(hc_sc_pair, statusName, callback) {
    let query = workflows_query_provider.generateSetWfSCStatusByName(hc_sc_pair, statusName);

    sql_helper.createTransaction(query, function(err, result, workflowId) {
        if(err) {
            return callback(err);
        }
    });

    return callback(null);
}

exports.getWFComponentsPossibleValues = async function() {
    return _getWFComponentsPossibleValues();
}

exports.addCovid19FormToSubcontractor = async function(hc_sc_pair, callback) {
    try {
        const connection = await sql_helper.getConnection();

        let query = workflows_query_provider.generateAddCovid19FormToSubcontractorQuery(hc_sc_pair);

        await connection.request().query(query);

        connection.close();

        await callback(null);
    } catch(err) {
        await callback(err, null);
    }
}

_getWFComponentsPossibleValues = function() {
    let componentsValues = [];
    componentsValues.push({"id":"1", "value":'Send Email'});
    componentsValues.push({"id":"2", "value":'Add Waiting Task'});
    componentsValues.push({"id":"3", "value":'Add Non-Waiting Task'});
    componentsValues.push({"id":"4", "value":'Remediation - Update Email Address'});
    componentsValues.push({"id":"5", "value":'Remediation Call & Update'});
    componentsValues.push({"id":"6", "value":'Remediation - Force Call'});
    componentsValues.push({"id":"7", "value":'Check behaviour'});
    componentsValues.push({"id":"8", "value":'Change State'});
    componentsValues.push({"id":"9", "value":'Check Payment'});
    componentsValues.push({"id":"10", "value":'Run Process'});

    return componentsValues;
}

exports.getSCStatusPossibleValues = async function() {
    return _getSCStatusPossibleValues();
}

_getSCStatusPossibleValues = function() {
    let scPossibleValues = [];
    scPossibleValues.push({"id":"2", "value":'Pending Invitation'});
    scPossibleValues.push({"id":"3", "value":'Invited'});
    scPossibleValues.push({"id":"4", "value":'Pending Submission'});
    scPossibleValues.push({"id":"5", "value":'Pending Review'});
    scPossibleValues.push({"id":"6", "value":'Prequalification Completed'});
    scPossibleValues.push({"id":"7", "value":'Pending Renewal'});
    scPossibleValues.push({"id":"8", "value":'Inactive'});
    scPossibleValues.push({"id":"9", "value":'Escalated (Invitation)'});
    scPossibleValues.push({"id":"10", "value":'Escalated (Submission)'});
    scPossibleValues.push({"id":"11", "value":'Expired'});
    scPossibleValues.push({"id":"12", "value":'Decline to Register'});
    scPossibleValues.push({"id":"13", "value":'Decline to Submit'});
    scPossibleValues.push({"id":"14", "value":'Pending Invite Remediation'});
    scPossibleValues.push({"id":"15", "value":'Pending Analysis'});

    scPossibleValues.push({"id":"20", "value":'Pending Covid 19 Form'});
    scPossibleValues.push({"id":"21", "value":'Pending Covid-19 Update'});

    return scPossibleValues;
}
