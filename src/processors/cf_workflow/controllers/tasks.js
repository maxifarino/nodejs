const moment = require('moment')
const {_} = require('lodash')
const sql_helper = require('../../../mssql/mssql_helper');
const tasks_helper = require('../../../cf_mssql/tasks');
const holder_helper = require('../../../cf_mssql/holders');

const query_provider = require('../../../cf_providers/tasks_query_provider')
const wf_utils = require('../utils')
// TODO these values shouldn't be hardcoded
const CERTFOCUS_TASK_OPEN_ID = 3;
const CERTFOCUS_TASK_FINISHED_ID = 2;
const CERTFOCUS_TASK_PENDING_ID = 1;

exports.createNewTask = async (params) => {
    try {

        const dueDate = moment().add(parseInt(params.daysToComplete), 'days').format('YYYY-MM-DD');

        let queryParams = {
            statusId: CERTFOCUS_TASK_OPEN_ID,
            description: _.escape(params.taskDescription),
            dateDue: `${dueDate} 23:59:59.000`,
            assetTypeId: 8, //task type is always related to a project / insured.
            tasksPriorityId: 2, // Priorities are 1 = urgent, 2 = normal, 3 = low
            enteredByUserId: null,
            typeId: params.taskType,
            projectInsuredId: params.projectInsuredId,
            assetId: params.projectInsuredId,
            holderId: params.holderId,

        };
        switch (params.assignToType) {
            case "3": //Department
                queryParams.departmentId = params.assignToId;
                break;
            case "1": //Role
                queryParams.assignedToRoleId = params.assignToId;
                break;
            default: //By default is assigned to a user.
                queryParams.assignedToUserId = params.assignToId;
                break;
        }
        const query = query_provider.generateTaskInsertQuery(queryParams);
        const connection = await sql_helper.getConnection();
        const result = await connection.request().query(query);
        connection.close();

        console.log(result)
    }
    catch(err){
        console.error(err)
    }
}

exports.createExpiredWaiverTask = async (params) => {
    
    let invalidData = false;
    if (!params) {
        invalidData = true;
    }

    if (params.HolderID && (parseInt(params.HolderID) <= 0 || isNaN(parseInt(params.HolderID)))) invalidData = true;
    if ((parseInt(params.DocumentId) <= 0 || isNaN(parseInt(params.DocumentId)))) invalidData = true;
    if (params.ProjectId && (parseInt(params.ProjectId) <= 0 || isNaN(parseInt(params.ProjectId)))) invalidData = true;
    if (params.ProjectInsuredID && (parseInt(params.ProjectInsuredID) <= 0 || isNaN(parseInt(params.ProjectInsuredID)))) invalidData = true;
    if (params.InsuredID && (parseInt(params.InsuredID) <= 0 || isNaN(parseInt(params.InsuredID)))) invalidData = true;

    if (invalidData) {
        console.log('invalid data')
        return false;
    }

    let taskDescription = params.DeficiencyText+'\n';
    taskDescription += params.DeficiencyStatusName;

    const taskParams = {
        description: taskDescription,
        statusId: 3, // open
        assetTypeId: 8, // Project/Insured
        tasksPriorityId: 2, // 2-normal
        dateDue: `${moment().format('YYYY-MM-DD')} 23:59:59.000`,
        holderId: params.HolderID,
        documentId: params.DocumentId,
        projectId: params.ProjectID,
        assetId: params.InsuredID,
        projectInsuredId: params.ProjectInsuredID,
        insuredId: params.InsuredID,
    }

    const accountManagerResult =  await holder_helper.getHoldersAccountManager(params.HolderID);
    if (accountManagerResult[0]) {
        const {accountManager, department, CFadmin} = accountManagerResult[0];
        if (accountManager) {
            taskParams.assignedToUserId = accountManager;
        } else if(department) {
            taskParams.departmentId = department
        } else {
            taskParams.assignedToRoleId = CFadmin
        }
    }

    await tasks_helper.getTaskTypeIdByName('Expired Waiver', (err, taskType) => {
        if (err) {
            return false;
        }
        taskParams.typeId = taskType[0].Id;
        console.log(taskType)
    });

    let query = query_provider.generateTaskInsertQuery(taskParams);
    query = sql_helper.getLastIdentityQuery(query,'Tasks');

    sql_helper.createTransaction(query, function(err, result, taskId) {
        if (err) {
            console.log(err);
            return false;
        }
        return taskId;
    });
}
