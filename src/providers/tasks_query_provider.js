// const { writeLog } = require('../utils')

const _moveDateToWorkingDays = function(testDateParam) {
	const testDay = new Date(testDateParam);
	const dayOfWeek = testDay.getDay();
	let offset = 0;
	// If Sunday
	if(dayOfWeek == 0) {
		offset = 1;
	}
	// If Saturday
	if(dayOfWeek == 6) {
		offset = 2;
	}

	testDay.setDate(testDay.getDate() + offset);

	return testDay.toISOString();
}

exports.moveDateToWorkingDays = function(testDate) {
	return _moveDateToWorkingDays(testDate);
}

exports.generateTaskInsertQuery = function(params) {
  let query = 
` DECLARE       @TaskId numeric(38,0);
	INSERT INTO   Tasks (
                  Name, 
                  Description, 
                  TypeId, 
                  statusId, 
                  assetId, 
                  assetTypeId, 
                  enteredDate, 
                  modifiedDate, 
                  modifyByUserId`;

	if (params.enteredByUserId) {
    query += 
`                               , 
                  enteredByUserId,
                  dateDue`;
  }
    
	if (params.assignedToUserId) {
    query += 
`                         , 
                  assignedToUserId`;
  }
    
	if (params.tasksPriorityId) {
    query += 
`                                 , 
                  tasksPriorityId, 
                  assignedToRoleId`;
  }

	if (params.subcontractorId) {
    query += 
`                                 , 
                  subcontractorId`;
  }   

	if (params.hiringClientId) {
    query += 
`                                , 
                  HiringClientId`;
  }
		

	if (params.contactTypeId) {
    query += 
`                               , 
                  contactTypeId`
  }
    
                   
  query +=      `) VALUES (
		              '${params.name}',
		              '${params.description}',
		              ${params.typeId}`;
  
	if (params.statusId) {
    query += 
`                                 , 
                  ${params.statusId}`;
  } else {
    query += 
`                                 , 
                  ${params.typeId == 2 ? 1 : 3}`;
  }
    
	if (params.assetId) {
    query += 
`                   , 
                  ${params.assetId}`;
  }

	if (params.assetTypeId) {
    query += 
`                                 , 
                  ${params.assetTypeId}`;
  }
    
	if (params.enteredDate) {
    query += 
`                                     , 
                  ${params.enteredDate}`;
  } else {
    query += 
`                                      , 
                  getdate(), 
                  getdate()`;
  }
    

	if (params.modifyByUserId) {
    query += 
`                          , 
                  ${params.modifyByUserId}`;
  } else {
    query += 
`                   , 
                  ${params.enteredByUserId}`;
  }
    
	if (params.enteredByUserId) {
    query += 
`                   , 
                  ${params.enteredByUserId}`;
  }
    
	if (params.dateDue && params.dateDue != null) {
		const dateDue = _moveDateToWorkingDays(params.dateDue);
    query += 
`                     , 
                  '${dateDue}'`;
	} else {
    query += 
`                             , 
                  getdate()`;
	}

	if (params.assignedToUserId) {
    query += 
`                   , 
                  ${params.assignedToUserId}`;
	}

	if (params.tasksPriorityId) {
    query += 
`                   , 
                  ${params.tasksPriorityId}`;
  } else {
    query += 
`                   , 
                  1`;
  }

	if (params.assignedToRoleId) {
    query += 
`                   , 
                  ${params.assignedToRoleId}`;
	} else {
    query += 
`                   , 
                  null`;
	}		

	if (params.subcontractorId) {
    query += 
`                   , 
                  ${params.subcontractorId}`;
  }
  
	if (params.hiringClientId) {
    query += 
`                     , 
                  ${params.hiringClientId}`;
  }

	if (params.contactTypeId) {
    query += 
`                     , 
                  ${params.contactTypeId}`;
  }

  query +=
`
              );  

SET           @TaskId = SCOPE_IDENTITY() 
INSERT INTO   TasksHistory  (
                TaskId, 
                PreviousStatusId, 
                ChangedStatusId, 
                ChangedByUserId, 
                ChangedDate
              )
	            VALUES (
                @TaskId,
                1,
                1,
                ${params.enteredByUserId},
                getDate()
              ); `;
    
    console.log('query = ', query)
    console.log('params = ', params)

    // tasksQuery # 1

	return query;
}

exports.generateTaskUpdateQuery = function(queryParams, userId) {
	let query = ` DECLARE @PrevStatusId numeric(38, 0) 
	UPDATE Tasks
	SET`;

	if(queryParams.name) {
		query += ` name = '${queryParams.name}',`;
	}

	if(queryParams.description) {
		query += ` description = '${queryParams.description}',`;
	}

	if(queryParams.typeId) {
		query += ` typeId = ${queryParams.typeId},`;
	}

	if(queryParams.statusId) {
		query += ` statusId = ${queryParams.statusId},`;
	}

	if(queryParams.assetId) {
		query += ` assetId = ${queryParams.assetId},`;
	}

	if(queryParams.assetTypeId) {
		query += ` assetTypeId = ${queryParams.assetTypeId},`;
	}

	if(queryParams.enteredDate) {
		query += ` enteredDate = '${queryParams.enteredDate}',`;
	}

	if(queryParams.modifyByUserId) {
		query += ` modifyByUserId = ${queryParams.modifyByUserId},`;
	}

	if(queryParams.enteredByUserId) {
		query += ` enteredByUserId = ${queryParams.enteredByUserId},`;
	}

	if(queryParams.dateDue) {
		query += ` dateDue = '${queryParams.dateDue}',`;
	}


	if(queryParams.assignedToUserId) {
		query += ` assignedToUserId = '${queryParams.assignedToUserId}',`;
	}
	else {
		query += ` assignedToUserId = null,`;	
	}

	if(queryParams.assignedToRoleId && (!queryParams.assignedToUserId || queryParams.assignedToUserId == null)) {
		query += ` assignedToRoleId = '${queryParams.assignedToRoleId}',`;
	}
	else {
		query += ` assignedToRoleId = null,`;
	}

	if(queryParams.tasksPriorityId) {
		query += ` tasksPriorityId = '${queryParams.tasksPriorityId}',`;
	}

	if(queryParams.subcontractorId) {
		query += ` subcontractorId = '${queryParams.subcontractorId}',`;
  }
  
  if(queryParams.hiringClientId) {
		query += ` hiringClientId = '${queryParams.hiringClientId}',`;
  }

	if(queryParams.contactTypeId) {
		query += ` contactTypeId = '${queryParams.contactTypeId}',`;
	}

	query += ` ModifyByUserId = ${userId}, 
		ModifiedDate = getDate(),
		@PrevStatusId = StatusId
	WHERE Id = ${queryParams.taskId}; `;

	query += ` INSERT INTO TasksHistory 
		(TaskId, PreviousStatusId, ChangedStatusId, ChangedByUserId, ChangedDate)
	VALUES (
		${queryParams.taskId},
		@PrevStatusId,`;

	if(queryParams.statusId) {
		query += ` ${queryParams.statusId},`;
	} 
	else {
		query += ` @PrevStatusId,`;
	}

	query += ` ${userId},
		getDate()); `;

	if(queryParams.completed == true) {
		query +=  ` UPDATE Tasks SET statusId = 2, completedDate = getDate(), isRead=1, completedByUserId = ${queryParams.enteredByUserId} 
								WHERE id = ${queryParams.taskId}; `;
	}

  // console.log(query);
  // tasksQuery # 2
	return query;
}

exports.generateTasksContactsTypesQuery = function() {
  // tasksQuery # 3
	return `SELECT id, type FROM TasksContactsTypes `;
}

exports.generateTasksStatusQuery = function() {
  // tasksQuery # 4
	return `SELECT id, status FROM TaskStatus `;
}

exports.generateTasksTypesQuery = function(system) {
	// tasksQuery # 5
	console.log('system:', system);
	if (typeof system === "undefined") {
		return `SELECT id, type, system FROM TaskTypes`;
	} else {
		return `SELECT id, type FROM TaskTypes WHERE system = '${system}'`;
	}
}

exports.generateAssetsTypesStatusQuery = function() {
  // tasksQuery # 6
	return `SELECT id, type FROM TasksAssetTypes WHERE system = 'pq'`;
}

exports.generatePrioritiesStatusQuery = function() {
  // tasksQuery # 7
	return `SELECT id, name FROM TasksPriorities ORDER BY Name ASC `;
}

exports.generateTasksQuery = function(queryParams) {
	let whereClause = null;
  let query = `SELECT   T.id, 
                        T.name, 
                        T.description, 
                        T.typeId, 
                        (
                          SELECT  type 
                          FROM    TaskTypes 
                          WHERE   id = T.typeId
                        ) type,
                        T.statusId, 
                        (
                          SELECT  status 
                          FROM    TaskStatus 
                          WHERE   id = T.statusId
                        ) status,
                        T.assetId, 
                        T.assetTypeId, 
                        (
                          SELECT  type 
                          FROM    TasksAssetTypes 
                          WHERE   id = T.assetTypeId
                        ) assetType,
                        T.enteredDate, 
                        T.enteredByUserId,
                        (
                          SELECT  firstname + ' ' lastName 
                          FROM    USERS 
                          WHERE   id = T.enteredByUserId
                        ) enteredByUser,
                        T.modifiedDate, 
                        T.modifyByUserId, 
                        (
                          SELECT  firstname + ' ' lastName 
                          FROM    USERS 
                          WHERE   id = T.modifyByUserId
                        ) modifyByUser,
                        T.assignedToUserId, 
                        (
                          SELECT  firstname + ' ' lastName 
                          FROM    USERS 
                          WHERE   id = T.assignedToUserId
                        ) assignedToUser,
                        T.assignedToRoleId, 
                        (
                          SELECT  name 
                          FROM    Roles 
                          WHERE   id = T.assignedToRoleId
                        ) assignedToRole,
                        T.dateDue,
                        T.dateDue dueDate,
                        T.tasksPriorityId,
                        T.ContactTypeId,
                        T.HiringClientId,
                        ISNULL( (
                          SELECT  type 
                          FROM    TasksContactsTypes 
                          WHERE   id = T.ContactTypeId
                        ), '' ) contactType,
                        (
                          SELECT  name 
                          FROM    TasksPriorities 
                          WHERE   id = T.tasksPriorityId
                        ) tasksPriority,
                        ISNULL( (
                          SELECT  name 
                          FROM    hiringClients 
                          WHERE   id = T.HiringClientId
                        ), '' ) hiringClient,
                        ISNULL( (
                          SELECT  name 
                          FROM    SubContractors 
                          WHERE   id = T.AssetId 
                          AND     T.assetTypeId = 2
                        ), '' ) + ISNULL( (
                                    SELECT  name 
                                    FROM    SubContractors 
                                    WHERE   id = T.subcontractorId 
                                    AND     T.assetTypeId <> 2
                                  ), '' ) subcontractor,
                        subcontractorId,
                        TT.system
								`;

	if(queryParams.getTotalCount == true) {
    query = `
                        SELECT      COUNT(*) totalCount `;
	}

  query += `
                        FROM        Tasks T 
                        LEFT JOIN   TaskTypes TT ON TT.id = T.typeId`;

  whereClause = ` 
                        WHERE       1 = 1 `;

	if(queryParams.alltasks) {
    whereClause += ` 
                        AND         T.TypeId IN (2,4) `;
	}

	if(queryParams.system) {
    whereClause += ` 
                        AND         TT.System = '${queryParams.system}' `;
	}

	if(queryParams.taskId) {
    whereClause += ` 
                        AND         T.Id = ${queryParams.taskId} `;
	}

	if(queryParams.typeId) {
    whereClause += ` 
                        AND         T.TypeId = ${queryParams.typeId} `;
	}

	if(queryParams.statusId) {
    whereClause += ` 
                        AND         T.StatusId = ${queryParams.statusId} `;
	}

	if(queryParams.subcontractorId) {
    whereClause += ` 
                        AND         T.subcontractorId = ${queryParams.subcontractorId} `;
	}

	if(queryParams.hiringClientId) {
    whereClause += ` 
                        AND         T.HiringClientId = ${queryParams.hiringClientId} `;
	}

	if(queryParams.assetId) {
    whereClause += ` 
                        AND         T.AssetId = ${queryParams.assetId} `;
	}

	if(queryParams.assetTypeId) {
    whereClause += ` 
                        AND         T.assetTypeId = ${queryParams.assetTypeId} `;
	}

	if(queryParams.assignedToRoleId) {
    whereClause += ` 
                        AND         T.assignedToRoleId = ${queryParams.assignedToRoleId} `;
	}

	if(queryParams.assignedToUserId) {
		whereClause += ` AND (T.assignedToUserId = ${queryParams.assignedToUserId} 
											OR T.assignedToRoleId = (SELECT roleId FROM Users WHERE id = ${queryParams.assignedToUserId})
											OR T.assignedToRoleId = (SELECT CFRoleId FROM Users WHERE id = ${queryParams.assignedToUserId})
											OR T.AssetTypeId = 8) `;
	}

	if (queryParams.searchTerm) {
    whereClause += ` 
                        AND         (
                                          T.Name LIKE '%${queryParams.searchTerm}%' 
                                      OR  T.Description LIKE '%${queryParams.searchTerm}%'
                                      OR  T.subcontractorId in (
                                            SELECT	Id
                                            FROM	SubContractors
                                            WHERE	Name like '%${queryParams.searchTerm}%'
                                          )
                                      ) `;
	}

	if (queryParams.dateDue) {
    whereClause += ` 
                        AND         T.dateDue >= '${queryParams.dateDue}' `;
	}

	if (queryParams.dueDate) {
    whereClause += ` 
                        AND         T.dateDue >= '${queryParams.dueDate}' `;
  }

	if (queryParams.enteredDate) {
    whereClause += ` 
                        AND         T.enteredDate >= '${queryParams.enteredDate}' `;
	}

	if (queryParams.modifiedDate) {
    whereClause += ` 
                        AND         DAY(T.modifiedDate) = DAY('${queryParams.modifiedDate}') 
										    AND         MONTH(T.modifiedDate) = MONTH('${queryParams.modifiedDate}')
										    AND         YEAR(T.modifiedDate) = YEAR('${queryParams.modifiedDate}')
										    AND         T.modifiedDate >= '${queryParams.modifiedDate}' `;
	}

    whereClause += ` 
                        AND         assetTypeId <> 3            `;


	if(whereClause) {
		query += whereClause;
	}

	if(queryParams.getTotalCount == false) {
		if(queryParams.orderBy) {
      query +=  ` 
                        ORDER BY    ${queryParams.orderBy}`;
			if(queryParams.orderDirection) {
        query +=  ` 
                        ${queryParams.orderDirection}`;
			}
		}
		else {
      query +=  ` 
                        ORDER BY    id ASC`;
		}
	}

	if(queryParams.pageSize && queryParams.getTotalCount == false) {
		let pageSize = queryParams.pageSize;
		let pageNumber = queryParams.pageNumber;
    query += ` 
                        OFFSET      ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
  }
  
  // console.log('queryParams = ', queryParams)
  //console.log(query);

  // tasksQuery # 8
	return query;
}

exports.generateNotificationsQuery = function(userId) {
  // Excludes Accounts notes
  // tasksQuery # 9
	return ` SELECT COUNT(*) notificationsCount FROM Tasks WHERE assignedToUserId = ${userId} AND isRead IS NULL AND AssetTypeId <> 3 `;
}

exports.generateAddNotificationsStatusQuery = function(userId) {
  // tasksQuery # 10	
	return ` UPDATE Tasks SET isRead = 1 WHERE assignedToUserId = ${userId} AND isRead IS NULL `;
}

exports.generateTaskInsertSimpleQuery = function(params) {
  let query = ` 
    INSERT INTO   Tasks (
                    Name, 
                    Description, 
                    TypeId, 
                    StatusId, 
                    AssetId, 
                    AssetTypeId,
                    EnteredDate,
                    EnteredByUserId,
                    ModifiedDate,
                    ModifyByUserId,`;

	if(params.userId) {
    query += `
                    AssignedToUserId,`;
  }

	if(params.assignedToRoleId) {
    query += `
                    AssignedToRoleId,`;
  }

  query += `
                    DateDue,
                    TimeStamp, 
                    TasksPriorityId,
                    isRead,
                    completedDate,
                    completedByUserId,
                    subcontractorId,
                    ContactTypeId`;

	if(params.isWaitingTask) {
    query += `,
                    isWaitingTask`;
  }	

	if(params.isRemediation) {
    query += `,
                    isRemediation`;
  }	

	if(params.hiringClientId) {
    query += `,
                    hiringClientId`;
  }	

	if(params.step) {
    query += `,
                    wfStepIndex`;
  }	

	if(params.WorkflowTypeId) {
    query += `,
                    WorkflowTypeId`;
  }	

  query += `
                    ) VALUES ( 
                      '${params.name}',
                      '${params.description}',
                      2, 
                      1,
                      ${params.subcontractorId},
                      2,
                      getDate(),
                      null,
                      getDate(),
                      null, `;   
  
  /* the VALUES up until here are (from top to bottom): 
  name, 
  description, 
  typeId: task, 
  statusId: WIP, 
  assetId, 
  Asset SC id (assetTypeId), 
  enteredDate, 
  enteredByuserId, 
  modifiedDate, 
  modifyByUserId */

	if(params.userId) {
    query += `
                      ${params.userId},`; // assignedToUserId
  }

	if(params.assignedToRoleId) {
    query += `
                      ${params.assignedToRoleId},`; // assignedToRoleId
  }
	
  query += `
                      getDate() + ${params.dateDueDays}, 
                      getDate(), 
                      2, 
                      null, 
                      null, 
                      null, 
                      ${params.subcontractorId}, 
                      null`; // ContactTypeId
  
  /* the VALUES up until here are (from top to bottom): 
  dateDue, 
  timeStamp, 
  tasksPriorityId: Normal, 
  isRead: false, 
  completedDate, 
  completedByUserId, 
  subcontractorId, 
  ContactTypeId */

	if(params.isWaitingTask) {
    query += `,
                      ${params.isWaitingTask}`;	
  }
		

	if(params.isRemediation) {
    query += `,
                      ${params.isRemediation}`;		
  }
		

	if(params.hiringClientId) {
    query += `,
                      ${params.hiringClientId}`;	
  }
		

	if(params.step) {
    query += `,
                      ${params.step}`;	
  }
		

	if(params.WorkflowTypeId) {
    query += `,
                      ${params.WorkflowTypeId}`;	
  }
		

  query += `); `;
  
  // console.log('params = ', JSON.stringify(params))
  // console.log('query = ', query);
  // tasksQuery # 11

	return query;
}

exports.generateGetLastWFTaskQuery = function(hc_sc_pair, step, wf) {

	// modifyByUserId = null and enteredByUserId = null means created by wf

	return ` SELECT TOP 1 id, name, description, assignedToUserId, dateDue, completedDate FROM Tasks 
					WHERE subContractorId = ${hc_sc_pair.subcontractorId}
					AND (HiringClientId = ${hc_sc_pair.hiringClientId} OR HiringClientId is null)
					AND wfStepIndex = ${step}
					AND WorkflowTypeId = ${wf.workflowType.id}
          AND isWaitingTask = 1
          AND usedTask = 0
					ORDER BY id DESC `;
}

exports.generateGetLastWFRemediationTaskQuery = function(hiringClientId, subcontractorId) {

	// modifyByUserId = null and enteredByUserId = null means created by WF

	return ` SELECT TOP 1 id, name, description, assignedToUserId, dateDue FROM Tasks 
								WHERE assetTypeId = 1 
								AND assetId = ${hiringClientId} 
								AND subContractorId = ${subcontractorId} 
								AND modifyByUserId IS null
								AND enteredByUserId IS null
								AND isWaitingTask = 1
								AND isRemediation = 1
								ORDER BY id DESC `;
}
