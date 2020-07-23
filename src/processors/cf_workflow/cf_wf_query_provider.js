
exports.getActiveWorkflowsQuery = () => {
    return `SELECT * FROM [dbo].[WorkflowsExecStatus] WHERE Status = 'Active'`
}

exports.getStepComponentQuery = (wfConfigId, step) => {
    return `SELECT Id, ComponentId as ComponentType,
            (select createTask from Components where Id = ComponentId) 'createTask'
            FROM [WorkflowsComponents] 
            WHERE WorkflowId = ${wfConfigId}
            AND PositionIndex = ${step} `
}

exports.getComponentConfigsQuery = (compId) => {
    return `SELECT Name, Value
            FROM WorkflowsComponentsParamsValues CPV
            INNER JOIN ComponentsParameters CP ON CP.Id = CPV.ComponentParameterId 
            WHERE WorkflowComponentId = ${compId} `
}

exports.getIncrementStepQuery = (wId) => {
    return `UPDATE [dbo].[WorkflowsExecStatus]
            SET StepIndex += 1,
            LastUpdate = GETDATE()
            WHERE InstanceId = ${wId}`
}

exports.getIncrementIterationQuery = (wId) => {
    return `UPDATE [dbo].[WorkflowsExecStatus]
            SET IterationCount += 1,
                LastUpdate = GETDATE()
            WHERE InstanceId = ${wId}`
}

exports.getMaxStepIndexQuery = (wfConfigId) => {
    return `SELECT MAX(PositionIndex) AS MaxStep
            FROM WorkflowsComponents
            WHERE WorkflowId = ${wfConfigId}`
}

exports.getUpdateWorkflowStatusQuery = (wId, status) => {
    return `UPDATE [dbo].[WorkflowsExecStatus]
            SET Status = '${status}',
                LastUpdate = GETDATE()
            WHERE InstanceId = ${wId}`
}

exports.getCreateWfInstanceQuery = (wfConfigId,wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId) => {
    return `INSERT INTO [dbo].[WorkflowsExecStatus] 
                ([WorkflowConfigId], 
                [WorkflowTypeId], 
                [HolderId], 
                [ProjectInsuredId], 
                [RuleGroupId], 
                [RuleId],
                [CertId],
                [Status])
            VALUES(
                ${wfConfigId},
                ${wfType},
                ${holderId},
                ${projectInsuredId},
                ${ruleGroupId},
                ${ruleId},
                ${certId},
                'Active')`
}

exports.getWorkflowConfigByHolderIdQuery = (holderId, wfType) => {
    return `SELECT Id
            FROM [dbo].[Workflows]
            WHERE HiringClientId = ${holderId}
            AND WorkflowTypeId = ${wfType}`
}