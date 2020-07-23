const _ = require('lodash')
const wf_sql = require('./cf_wf_mssql')
const tasksController = require('./controllers/tasks')
const checkController = require('./controllers/check_behavior/check_behavior')
const changeStatusController = require('./controllers/change_status/change_status')



//gets the component for a given workflow config step
exports.getCurrentWfComponent = async (wfConfigId, step) => {
    const result = await wf_sql.getWfStepComponent(wfConfigId, step);

    return result[0]
}


//gets a components configurations parameters
exports.getComponentConfiguration = async (compId, callback) => {
    const result = await wf_sql.getComponentConfigValues(compId)
    let config = {}

    for(i=0; i < result.length; i++){
        configName =  _.camelCase(result[i].Name);
        configValue = result[i].Value

        config[configName] = configValue
    }

    if(config !== []){
        callback(config)
    }
    else{
        console.warn('[CF Workflow] No configurations found for component id: ', compId)
    }
}


//executes the workflow component from its config
exports.executeComponent = async (component, config, workflow, callback) => {
    console.log('[CF Workflow] Executing Component \n', config)

    if (component.createTask) {
        await tasksController.createNewTask(config)
        }
    
    switch(component.ComponentType){
        
        case 12: //FIXME: SET ENV VAR // Check Behavior
            await checkController.CheckStatus(config, workflow)
            break
        
        case 18: //FIXME: SET ENV VAR // Change Status
            await changeStatusController.ChangeStatus(config, workflow)
            break
    }

    if(callback) callback()
}


// increments the step index for a workflow
exports.goToNextStep = async (workflow) => {
    console.log('[CF Workflow] Incrementing step for wf instance: ', workflow.InstanceId)
    
    const maxIndex = await wf_sql.getWfMaxStepIndex(workflow.WorkflowConfigId)
    
    if (maxIndex >= workflow.StepIndex){
        await wf_sql.incrementWorkflowStep(workflow.InstanceId)
    }
    else {
        await wf_sql.updateWorkflowStatus(workflow.InstanceId, 'Completed')
    }
}

// increments the interation count for a workflow
exports.incrementIteration = async (wId) => {
    console.log('[CF Workflow] Incrementing component iteration for wf instance: ', wId)
    
    await wf_sql.incrementWorkflowIteration(wId)
}

// terminates a workflow
exports.updateWorkflowStatus = async (wId, status, callback) => {
    console.log('[CF Workflow] Changing status for wf instance: ', wId)
    
    result = await wf_sql.updateWorkflowStatus(wId, status)

    if (result != 'Success'){
        if(callback) callback(null, result)
    }
    else {
        if(callback) callback(result, null)
    }
}

// creates a workflow instance
exports.createNewInstance = async (wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId, callback) => {
    console.log('[CF Workflow] Creating new wf instance for: ', holderId, projectInsuredId, ruleGroupId, ruleId, certId, 'WF TYPE: ', wfType)
   
    result = await wf_sql.createWfInstance(wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId)

    if (result != 'Success'){
        if(callback) callback(result, null)
    }
    else {
        if(callback) callback(null, result)
    }
}