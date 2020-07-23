const moment = require('moment');

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
	return moment(testDay).format("YYYY-MM-DD HH:mm:ss");
}

exports.moveDateToWorkingDays = function(testDate) {
	return _moveDateToWorkingDays(testDate);
}

exports.generateTasksContactsTypesQuery = function() {
  // tasksQuery # 3
	return `SELECT id, type FROM TasksContactsTypes `;
}

exports.generateTasksStatusQuery = function() {
  // tasksQuery # 4
	return `SELECT id, status FROM TaskStatus `;
}

exports.generateTasksTypesQuery = function() {
  // tasksQuery # 5
	return `SELECT id, type FROM TaskTypes WHERE system='cf'`;
}

exports.generateAssetsTypesStatusQuery = function() {
  // tasksQuery # 6
	return `SELECT id, type FROM TasksAssetTypes WHERE system='cf' `;
}

exports.generatePrioritiesStatusQuery = function() {
  // tasksQuery # 7
	return `SELECT id, name FROM TasksPriorities ORDER BY Name ASC `;
}

exports.generateTasksQuery = function(queryParams) {
	let whereClause = null;

	const holderContactSubQuery = `select top 1 trim(FirstName) FirstName, 
		trim(LastName) LastName, 
		trim(PhoneNumber) phoneNumber, 
		trim(MobileNumber) mobileNumber, 
		trim(EmailAddress) emailAddress,
		'Holder Contact' contactType
	from HolderContacts, Contacts
		where Contacts.ContactID = HolderContacts.ContactID
		and HolderID = T.HolderId for json auto`;

	const insuredContactSubQuery = `select trim(ContactFullName) FirstName, 
		'' LastName,
		trim(ContactPhone) phoneNumber,
		'Insured Contact' contactType
	from SubContractors
		where Id = T.InsuredId for json auto`;

	const certificateAgencySubQuery = `select Name FirstName, 
		'' LastName, 
		MainPhone phoneNumber, 
		'' mobileNumber, 
		MainEmail emailAddress, 
		'Agency' contactType
	from CertificateOfInsurance COI
		inner join Agencies A on COI.AgencyId = A.AgencyId
	where COI.DocumentId = T.DocumentId  for json auto`;

	const certificateAgentSubQuery = `select FirstName, 
		LastName, 
		phoneNumber, 
		mobileNumber, 
		emailAddress, 
		'Agent' contactType
		from CertificateOfInsurance COI
			inner join Agents A on COI.AgentId= A.AgentID
		where COI.DocumentId = T.DocumentId  for json auto`;

	let query = `SELECT T.id, T.name, T.description, 
								T.typeId, 
								(SELECT type FROM TaskTypes WHERE id = T.typeId) type,
								T.statusId, 
								(SELECT status FROM TaskStatus WHERE id = T.statusId) status,
								T.assetId, 
								T.assetTypeId, 
								(SELECT type FROM TasksAssetTypes WHERE id = T.assetTypeId) assetType,
								T.enteredDate, 
								T.enteredByUserId,
								(SELECT firstname + ' ' lastName FROM USERS WHERE id = T.enteredByUserId) enteredByUser,
								T.modifiedDate, 
								T.modifyByUserId, 
								(SELECT firstname + ' ' lastName FROM USERS WHERE id = T.modifyByUserId) modifyByUser,
								T.assignedToUserId, 
								(SELECT firstname + ' ' lastName FROM USERS WHERE id = T.assignedToUserId) assignedToUser,
								T.assignedToRoleId, 
								(SELECT name FROM Roles WHERE id = T.assignedToRoleId) assignedToRole,
								T.dateDue,
								T.dateDue dueDate,
								T.tasksPriorityId,
                T.ContactTypeId,
                T.HiringClientId,
								ISNULL( (SELECT type FROM TasksContactsTypes WHERE id = T.ContactTypeId), '' ) contactType,
								(SELECT name FROM TasksPriorities WHERE id = T.tasksPriorityId) tasksPriority,
                ISNULL( (SELECT name FROM hiringClients WHERE id = T.HiringClientId), '' ) hiringClient,
								ISNULL( (SELECT name FROM SubContractors WHERE id = T.AssetId AND T.assetTypeId = 2), '' ) + ISNULL( (SELECT name FROM SubContractors WHERE id = T.subcontractorId AND T.assetTypeId <> 2), '' ) subcontractor,
								subcontractorId,
								 T.HolderId,
								 HC.Name holderName,
								 T.DocumentId,
								 T.ProjectId,
								 P.Name projectName,
								 P.Number projectNumber,
								 T.InsuredId,
								 S.Name insuredName,
								 T.DepartmentId,
								 T.ProjectInsuredId,
								 (select ProjectInsuredID from ProjectsInsureds where InsuredID = t.ProjectInsuredId and ProjectID = T.ProjectId) 'certificateId',
								 (${holderContactSubQuery}) holderContact,
								 (${insuredContactSubQuery}) insuredContact,
								 (${certificateAgencySubQuery}) agencyContact,
								 (${certificateAgentSubQuery}) agentContact,
								 T.originalComment`;

	if(queryParams.getTotalCount == true) {
		query = `SELECT COUNT(*) totalCount `;
	}

	if(queryParams.getUrgentTasksCount == true) {
		query = `SELECT COUNT(*) urgentTasks `;
	}

	if(queryParams.getUnsassignedTasks == true) {
		query = `SELECT COUNT(*) unassigned `;
	}

	if(queryParams.getUrgentUnsassignedTasks == true) {
		query = `SELECT COUNT(*) urgentUnassigned `;
	}

	query += ` FROM Tasks T `;
	query += ` LEFT JOIN TaskTypes TT ON TT.id = T.typeId`;
	query += ` LEFT JOIN Projects P on T.ProjectId = P.Id`;
	query += ` LEFT JOIN HiringClients HC on T.HolderId = HC.Id`;
	query += ` LEFT JOIN SubContractors S on T.InsuredId = S.Id`;

	whereClause = ` WHERE 1 = 1 `;

	if(queryParams.getUrgentTasksCount == true) {
		whereClause = ` WHERE tasksPriorityId = 1 `;
	}

	if(queryParams.getUnsassignedTasks == true) {
		whereClause = ` WHERE assignedToUserId is null `;
	}

	if(queryParams.getUrgentUnsassignedTasks == true) {
		whereClause = ` WHERE assignedToUserId is null AND tasksPriorityId = 1 `;
	}

	whereClause += ` AND TT.System = 'cf' `;

	if(queryParams.contactTypeId) {
		whereClause += ` AND T.ContactTypeId = ${queryParams.contactTypeId} `;
	}

	if(queryParams.taskId) {
		whereClause += ` AND T.Id = ${queryParams.taskId} `;
	}

	if(queryParams.typeId) {
		whereClause += ` AND T.TypeId = ${queryParams.typeId} `;
	}

	// Specific status overrides a general search
	if (queryParams.notStatusId && !queryParams.statusId) {
		whereClause += ` AND T.StatusId != ${queryParams.notStatusId} `;
	}

	if(queryParams.statusId) {
		whereClause += ` AND T.StatusId = ${queryParams.statusId} `;
	}

	if(queryParams.subcontractorId) {
		whereClause += ` AND T.subcontractorId = ${queryParams.subcontractorId} `;
	}

	if(queryParams.hiringClientId) {
		whereClause += ` AND T.HiringClientId = ${queryParams.hiringClientId} `;
	}
	if(queryParams.holderId) {
		whereClause += ` AND T.HolderId = ${queryParams.holderId} `;
	}

	if(queryParams.insuredId) {
		whereClause += ` AND T.InsuredId = ${queryParams.insuredId} `;
	}

	if(queryParams.holderId) {
		whereClause += ` AND T.HolderId = ${queryParams.holderId} `;
	}

	if(queryParams.insuredId) {
		whereClause += ` AND T.InsuredId = ${queryParams.insuredId} `;
	}

	if(queryParams.projectId) {
		whereClause += ` AND T.ProjectId = ${queryParams.projectId} `;
	}

	if(queryParams.assetId) {
		whereClause += ` AND T.AssetId = ${queryParams.assetId} `;
	}

	if(queryParams.assetTypeId) {
		whereClause += ` AND T.assetTypeId = ${queryParams.assetTypeId} `;
	}

	if(queryParams.assignedToRoleId) {
		whereClause += ` AND T.assignedToRoleId = ${queryParams.assignedToRoleId} `;
	}

	if(queryParams.assignedToUserId) {
		whereClause += ` AND (T.assignedToUserId = ${queryParams.assignedToUserId} OR 
											T.assignedToRoleId = (SELECT CFRoleId FROM Users WHERE id = ${queryParams.assignedToUserId}))  `;
	}

	if (queryParams.searchTerm) {
		whereClause += ` AND (T.Name LIKE '%${queryParams.searchTerm}%' OR T.Description LIKE '%${queryParams.searchTerm}%' OR P.Name LIKE '%${queryParams.searchTerm}%')`;
	}

	if (queryParams.dateDue) {
		whereClause += ` AND T.dateDue <= '${queryParams.dateDue} 23:59:59.000' `;
	}

	if (queryParams.dateFrom && queryParams.dateTo) {
		whereClause += ` AND T.dateDue between '${queryParams.dateFrom} 23:59:59.000' and '${queryParams.dateTo} 23:59:59.000' `;
	}

	if (queryParams.enteredDate) {
		whereClause += ` AND DAY(T.enteredDate) = DAY('${queryParams.enteredDate}') 
										 AND MONTH(T.enteredDate) = MONTH('${queryParams.enteredDate}')
										 AND YEAR(T.enteredDate) = YEAR('${queryParams.enteredDate}')
										 AND T.enteredDate >= '${queryParams.enteredDate}' `;
	}

	if (queryParams.modifiedDate) {
		whereClause += ` AND DAY(T.modifiedDate) = DAY('${queryParams.modifiedDate}') 
										 AND MONTH(T.modifiedDate) = MONTH('${queryParams.modifiedDate}')
										 AND YEAR(T.modifiedDate) = YEAR('${queryParams.modifiedDate}')
										 AND T.modifiedDate >= '${queryParams.modifiedDate}' `;
	}

	if (queryParams.name) {
		whereClause += ` AND T.Name LIKE '%${queryParams.name}%'`;
	}

	if (queryParams.holderKeyword) {
		whereClause += ` AND HC.Name LIKE '%${queryParams.holderKeyword}%'`;
	}

	if (queryParams.insuredKeyword) {
		whereClause += ` AND S.Name LIKE '%${queryParams.insuredKeyword}%'`;
	}

	if (queryParams.tasksPriorityId) {
		whereClause += ` AND T.tasksPriorityId = ${queryParams.tasksPriorityId}`;
	}

	if (queryParams.departmentId) {
		whereClause += ` AND T.DepartmentId = ${queryParams.departmentId}`;
	}

	if (queryParams.unassigned) {
		whereClause += ` AND T.assignedToUserId is null`;
	}

	// whereClause += ` AND assetTypeId <> 3 `;

	if(whereClause) {
		query += whereClause;
	}

	if(queryParams.getTotalCount == false && queryParams.getUrgentTasksCount == false && queryParams.getUnsassignedTasks == false && queryParams.getUrgentUnsassignedTasks == false) {
		if(queryParams.orderBy) {

			if (queryParams.orderBy === 'default') {
				query +=  ` ORDER BY dateDue DESC, tasksPriorityId ASC`;
			} else {
				query +=  ` ORDER BY ${queryParams.orderBy}`;
				if(queryParams.orderDirection) {
					query +=  ` ${queryParams.orderDirection}`;
				}
			}
		}
		else {
			query +=  ` ORDER BY id ASC`;
		}
	}

	if(queryParams.pageSize && queryParams.getTotalCount == false && queryParams.getUrgentTasksCount == false && queryParams.getUnsassignedTasks == false && queryParams.getUrgentUnsassignedTasks == false) {
		let pageSize = queryParams.pageSize;
		let pageNumber = queryParams.pageNumber;
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}
   
  // console.log('QUERY:',query);
	return query;
}

exports.generateTaskInsertQuery = function(params) {
	let query = `DECLARE @TaskId numeric(38,0);
		INSERT INTO Tasks (
			Description
			, originalComment
			, TypeId
			, statusId
			, assetId 
			, assetTypeId
			, enteredDate 
			, modifiedDate
			, dateDue`;

	if (params.enteredByUserId) {
		query += `
			, enteredByUserId`;
	}
	if (params.modifyByUserId) {
		query += `
			, modifyByUserId`;
  }    
	if (params.assignedToUserId) {
		query += `
			, assignedToUserId`;
	} 
	if (params.assignedToRoleId) {
		query += `
			, assignedToRoleId`;
  }    
	if (params.tasksPriorityId) {
		query += `
			, tasksPriorityId`;
  }
	if (params.subcontractorId) {
		query += `
			, subcontractorId`;
  }
	if (params.hiringClientId) {
		query += `
			, HiringClientId`;
  }
	if (params.contactTypeId) {
		query += `
			, contactTypeId`
  }
	if (params.name) {
		query += `
			, name`
  }
	if (params.departmentId) {
		query += `
			, DepartmentId`
	}
	if (params.projectId) {
		query += `
			, ProjectId`
  }
	if (params.documentId) {
		query += `
			, DocumentId`
  }
	if (params.insuredId) {
		query += `
			, InsuredId`
  }
	if (params.holderId) {
		query += `
			, HolderId`
  }
	if (params.projectInsuredId) {
		query += `
			, ProjectInsuredId`
  }
                   
	query += `
		) VALUES (
		'${params.description}'
		,' ${params.description}'
		, ${params.typeId}`;
		
	if (params.statusId) {
		query += `, ${params.statusId}`;
  } else {
		query += `, ${params.typeId == 4 ? 1 : 3}`;
	}
	   
	if (params.assetId) {
		query += `, ${params.assetId}`;
	}
	
	if (params.assetTypeId) {
		query += `, ${params.assetTypeId}`;
	}
	    
	if (params.enteredDate) {
    query += `, ${params.enteredDate}`;
  } else {
		query += `, getdate(), getdate()`;
	}

	if (params.dateDue && params.dateDue != null) {
		const dateDue = _moveDateToWorkingDays(params.dateDue);
    query += `, '${dateDue}'`;
	} 
	else {
    query += `, getdate()`;
	}
	    
	if (params.enteredByUserId) {
    query += `, ${params.enteredByUserId}`;
	}

	if (params.modifyByUserId) {
    query += `, ${params.modifyByUserId}`;
	}

	if (params.assignedToUserId) {
    query += `, ${params.assignedToUserId}`;
	}

	if (params.assignedToRoleId) {
    query += `, ${params.assignedToRoleId}`;
	}	

	if (params.tasksPriorityId) {
    query += `, ${params.tasksPriorityId}`;
  } else {
    query += `, 1`;
	}
	
	if (params.subcontractorId) {
    query += `, ${params.subcontractorId}`;
	}	
  
	if (params.hiringClientId) {
    query += `, ${params.hiringClientId}`;
  }

	if (params.contactTypeId) {
    query += `, ${params.contactTypeId}`;
  }

	if (params.name) {
    query += `, '${params.name}'`;
  }

	if (params.departmentId) {
    query += `, ${params.departmentId}`;
  }

	if (params.projectId) {
    query += `, ${params.projectId}`;
  }

	if (params.documentId) {
    query += `, ${params.documentId}`;
  }

	if (params.insuredId) {
    query += `, ${params.insuredId}`;
  }

	if (params.holderId) {
    query += `, ${params.holderId}`;
  }

	if (params.projectInsuredId) {
    query += `, ${params.projectInsuredId}`;
  }

	query += `)`;

	if (params.enteredByUserId) {
		query +=`
			SET @TaskId = SCOPE_IDENTITY() 
				INSERT INTO   TasksHistory  (
					TaskId, 
					PreviousStatusId, 
					ChangedStatusId, 
					ChangedByUserId, 
					ChangedDate,
					contactType,
					comment
				)
				VALUES (
					@TaskId,
					1,
					1,
					${params.enteredByUserId},
					getDate(),
					${params.typeId},
					'${params.description}'
				); `;

	}
		
	console.log('generateTaskInsertQuery: ',query);
	return query;
}

exports.generateTaskUpdateQuery = function(queryParams, userId) {
	let query = `DECLARE 
	@PrevStatusId numeric(38, 0),
	@previousData varchar(max) = (select * from Tasks  where Id = ${queryParams.taskId} FOR JSON AUTO, INCLUDE_NULL_VALUES);
	UPDATE Tasks
	SET`;

	if(queryParams.name) {
		query += ` name = '${queryParams.name}',`;
	}

	if(queryParams.contactId) {
		query += ` lastContactId = '${queryParams.contactId}',`;
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

	if(queryParams.isRead) {
		query += ` isRead = '${queryParams.isRead}',`;
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
		(TaskId, 
		PreviousStatusId, 
		ChangedStatusId, 
		ChangedByUserId, 
		ChangedDate, 
		previousData, 
		contactUser, 
		comment, 
		contactType)
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
		getDate(),
		@previousData,
		'${queryParams.contactUser || ''}',
		'${queryParams.description}',
		'${queryParams.contactType || ''}'
		);
		
		`;

	if(queryParams.completed == true) {
		query +=  ` UPDATE Tasks SET statusId = 2, completedDate = getDate(), isRead=1, completedByUserId = ${queryParams.enteredByUserId} 
								WHERE id = ${queryParams.taskId}; `;
	}

  // console.log('task update: ',query);
  // tasksQuery # 2
	return query;
}

exports.generateTaskHistoryQuery = (queryParams) => {
	const userSubQuery = `(select concat(FirstName, ' ', LastName) from Users where Id = ChangedByUserId)`;
	const contactTypeSubQuery = `(select Type from TaskTypes where Id = contactType)`;

	const query = `
	select ChangedDate 'date',
		comment,
		${userSubQuery} 'userName',
		${contactTypeSubQuery} 'contactType',
		contactUser
	from TasksHistory where TaskId = ${queryParams.taskId}
	order by ChangedDate DESC;`;

	return query
}

exports.generateProjectHistoryQuery = (queryParams) => {
	const userSubQuery = `select concat(FirstName, ' ', LastName) from Users where Id = EnteredByUserId`;
	const contactTypeSubQuery = `select Type from TaskTypes where Id = TypeId`;
	const contactUserSubQuery = `select concat(FirstName, ' ', LastName) from contacts where ContactID = Tasks.lastContactId`
	const statusSubQuery = `select Status from TaskStatus where TaskStatus.Id = StatusId`;
	const whereSubQuery = `select distinct TaskId from TasksHistory where json_value(previousData, '$[0].ProjectId') = ${queryParams.projectId}`
	const query = `
	select
       EnteredDate 'date',
       Description 'summary',
       (${userSubQuery}) 'userName',
       (${contactTypeSubQuery}) 'contactType',
       (${statusSubQuery}) 'status',
       (${contactUserSubQuery}) 'contactUser'
       from Tasks
	where Id in (${whereSubQuery}) order by EnteredDate desc`;

	return query;
}

exports.generateCloseDocumentTasks = (documentId) => {
	return `select Id, TypeId from Tasks where DocumentId = ${documentId} and StatusId != 2`
}

exports.generateTaskTypeIdByName = (name) =>{
	const querySelect = `select Id from TaskTypes`;
	const queryWhere = `WHERE Type = '${name}' and system = 'cf'`

	return `${querySelect} ${queryWhere}`;
}