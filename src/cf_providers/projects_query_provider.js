exports.generateGetRoleIsHLQuery = function (userId) {

	return `SELECT IsCFRole, IsHLRole, IsINRole, IsAMRole FROM Roles WHERE id IN (SELECT roleId FROM Users WHERE id = ${userId})`;
}


exports.generateProjectsDetailQuery = function (queryParams) {
	console.log('params', queryParams);

	let projectId = queryParams.projectId;

	let query = ` SELECT
					PR.id,
					PR.Name name,
					PR.description,
					PR.number,
					PR.manager,
					PR.address1,
					PR.address2,
					PR.city,
					PR.state,
					PR.zipCode,
					PR.owner,
					PR.statusId,
					PS.status,
					PR.hiringClientId as holderId,
					HC.name as holderName,
					(SELECT 'yes' FROM UsersProjects_Favorites PF WHERE PF.ProjectId = PR.id) AS favorite,
					PR.CFTrackingNumber,
					PR.CFCountryId,
					(SELECT name FROM Countries WHERE id = PR.CFCountryId) AS CountryName,
					PR.CFContactName,
					PR.CFContactPhone,
					PR.CFNote,
					PR.timeStamp,
					PRS.RequirementSetID,
					RS.Name AS RequirementSetName,
					PR.Archived AS archived
					`;

	query += `FROM Projects PR
						LEFT JOIN UsersProjects_Favorites PF ON PF.projectId = PR.Id
						LEFT JOIN HiringClients HC ON PR.HiringClientId = HC.Id
						LEFT JOIN ProjectStatus PS ON PR.StatusId = PS.Id
						LEFT JOIN ProjectRequirementSets PRS ON PRS.ProjectID = PR.Id
						LEFT JOIN RequirementSets RS ON RS.Id = PRS.RequirementSetID
						WHERE 1=1
						 `;

	if (projectId)
		query += ` AND PR.id = ${projectId} `;

	console.log('QUERY', query);
	return query;
}


exports.generateProjectsQuery = function (queryParams) {
	// console.log('params', queryParams);


	let projectName = queryParams.projectName;
	let holderId = queryParams.holderId;
	let holderName = queryParams.holderName;
	let insuredId = queryParams.insuredId;
	let excludeUserId = queryParams.excludeUserId;
	let searchTerm = queryParams.searchTerm;
	let statusId = queryParams.statusId;
	let projectStatusId = queryParams.projectStatusId;
	let state = queryParams.state;
	let myList = queryParams.myList;
	let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let getTotalCount = queryParams.getTotalCount;
	let summary = queryParams.summary;

	let query = ` SELECT DISTINCT
					PR.id,
					PR.Name name,
					PR.description,
					PR.number,
					PR.manager,
					PR.address1,
					PR.address2,
					PR.city,
					PR.state,
					PR.zipCode,
					PR.owner,
					PR.statusId,
					PS.status,
					PR.hiringClientId as holderId,
					HC.name as holderName,
					(SELECT DISTINCT 'yes' FROM UsersProjects_Favorites PF WHERE PF.ProjectId = PR.id) AS mylist,					
					PR.System,
					PR.timeStamp,
					PR.Archived AS archived,
					(select count(1) from ProjectsInsureds where ComplianceStatusID in (1,15) and ProjectId = PR.id and Archived = 0) AS CompliantInsureds,
					(select count(1) from ProjectsInsureds where ComplianceStatusID in (3,4,5,6) and ProjectId = PR.id and Archived = 0) AS NonCompliantInsureds,
					(select count(1) from ProjectsInsureds where ComplianceStatusID = 2 and ProjectId = PR.id and Archived = 0) AS EscalatedInsureds,
					PRS.RequirementSetID AS requirementSetId `;

	if (summary) {
		query = `SELECT PR.id, PR.Name `;
	}

	if (getTotalCount == true) {
		query = `SELECT COUNT(*) totalCount `;
	}

	query += `FROM	Projects PR
						LEFT JOIN UsersProjects_Favorites PF ON PF.projectId = PR.Id
						LEFT JOIN HiringClients HC ON PR.HiringClientId = HC.Id
						LEFT JOIN ProjectStatus PS ON PR.StatusId = PS.Id
						LEFT JOIN ProjectRequirementSets PRS ON PRS.ProjectID = PR.Id
						WHERE 1=1
						 `;

	query += ` AND PR.System = 'cf' `;

	if (searchTerm)
		query += `  AND (PR.Name like '%${searchTerm}%' OR
										PR.Description like '%${searchTerm}%' OR
										PR.Number like '%${searchTerm}%' OR
										PR.Manager like '%${searchTerm}%' OR
										PR.Owner like '%${searchTerm}%' OR
										PR.Address1 like '%${searchTerm}%' OR
										PR.Address2 like '%${searchTerm}%') `;

	//my list 0 NA,1 favorites,2 no favorites
	console.log('parse', { myList });
	if (myList == '1')
		query += ` AND PF.UsersID IS NOT NULL `;
	if (myList == '2')
		query += ` AND PF.UsersID IS NULL `;

	if (projectName)
		query += ` AND PR.Name like '%${projectName}%' `;

	if (state)
		query += ` AND PR.State like '%${state}%' `;

	if (holderId)
		query += ` AND PR.HiringClientId = ${holderId} `;

	if (holderName)
		query += ` AND HC.name like '%${holderName}%' `;


	if (projectStatusId)
		query += ` AND PR.StatusId = ${projectStatusId} `;

	if (insuredId)
		query += ` AND PR.id in (select projectId from ProjectsInsureds where insuredId = ${insuredId}) `;

	if (excludeUserId)
		query += ` AND PR.id not in (select projectId from ProjectsInsureds where insuredId in (select usc.SubContractorId from Users_SubContractors usc
where usc.UserId = ${excludeUserId})) `;

	if (queryParams.isHLRole == true)
		query += ` AND  PR.HiringClientId IN (SELECT hiringClientId FROM Users_HiringClients WHERE userId = ${queryParams.loggedUserId})  `;

	if (typeof queryParams.archived !== 'undefined')
		query += ` AND PR.Archived = ${queryParams.archived} `;

	if (queryParams.emptyReqSets == 1) {
		query += ` AND PRS.RequirementSetID IS NULL `;
	}

	if (orderBy && getTotalCount == false) {
		query += ` ORDER BY ${orderBy} `;
		if (orderDirection) {
			query += ` ${orderDirection} `;
		}
	}
	else {
		if (getTotalCount == false)
			query += ` ORDER BY PR.timeStamp DESC `;
	}

	if (pageNumber && getTotalCount == false) {
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}
	console.log('generateProjectsQuery: ', query);
	return query;
}

exports.generateProjectInsertQuery = function (params) {

	let query = `INSERT INTO Projects
				( `;

	if (params.name)
		query += ` Name`;

	if (params.description)
		query += `, Description `;

	if (params.number)
		query += `, Number `;

	if (params.manager)
		query += `, Manager `;

	if (params.address1)
		query += `, Address1 `;

	if (params.address2)
		query += `, Address2 `;

	if (params.city)
		query += `, City `;

	if (params.state)
		query += `, State `;

	if (params.zipCode)
		query += `, ZipCode `;

	if (params.owner)
		query += `, Owner `;

	if (params.statusId)
		query += `, StatusId `;

	if (params.holderId)
		query += `, HiringClientId `;

	if (params.CFTrackingNumber)
		query += `, CFTrackingNumber `;
	if (params.CFCountryId)
		query += `, CFCountryId `;
	if (params.CFContactName)
		query += `, CFContactName `;
	if (params.CFContactPhone)
		query += `, CFContactPhone `;
	if (params.note)
		query += `, CFNote `;

	query += `, System `;

	query += `)
				VALUES
			  ( `;

	if (params.name)
		query += ` '${params.name}'`;

	if (params.description)
		query += ` , '${params.description}'`;

	if (params.number)
		query += ` , '${params.number}'`;

	if (params.manager)
		query += ` , '${params.manager}'`;

	if (params.address1)
		query += ` , '${params.address1}'`;

	if (params.address2)
		query += ` , '${params.address2}'`;

	if (params.city)
		query += ` , '${params.city}'`;

	if (params.state)
		query += ` , '${params.state}'`;

	if (params.zipCode)
		query += ` , '${params.zipCode}'`;

	if (params.owner)
		query += ` , '${params.owner}'`;

	if (params.statusId)
		query += ` , ${params.statusId}`;

	if (params.holderId)
		query += ` , ${params.holderId}`;

	if (params.CFTrackingNumber)
		query += ` , ${params.statusId} `;
	if (params.CFCountryId)
		query += ` , ${params.CFCountryId} `;
	if (params.CFContactName)
		query += ` , '${params.CFContactName}' `;
	if (params.CFContactPhone)
		query += ` , '${params.CFContactPhone}' `;
	if (params.note)
		query += `, '${params.note}' `;

	query += `, 'cf' `;

	query += `)`;
	console.log('QUERY', query);

	return query;
}

exports.generateProjectUpdateQuery = function (params) {

	let query = `UPDATE Projects SET `;
	if (params.name)
		query += `Name = '${params.name}',`;

	if (params.description)
		query += `Description = '${params.description}',`;

	if (params.number)
		query += `Number = '${params.number}',`;

	if (params.manager)
		query += `Manager = '${params.manager}',`;

	if (params.address1)
		query += `Address1 = '${params.address1}',`;

	if (params.address2)
		query += `Address2 = '${params.address2}',`;

	if (params.city)
		query += `City = '${params.city}',`;

	if (params.state)
		query += `State = '${params.state}',`;

	if (params.zipCode)
		query += `ZipCode = '${params.zipCode}',`;

	if (params.owner)
		query += `Owner = '${params.owner}',`;

	if (params.statusId)
		query += `StatusId = '${params.statusId}',`;

	if (params.holderId)
		query += `HiringClientId = '${params.holderId}',`;


	if (params.CFTrackingNumber)
		query += `CFTrackingNumber = ${params.statusId},`;
	if (params.CFCountryId)
		query += `CFCountryId =  ${params.CFCountryId},`;
	if (params.CFContactName)
		query += `CFContactName =  '${params.CFContactName}',`;
	if (params.CFContactPhone)
		query += `CFContactPhone =  '${params.CFContactPhone}',`;
	if (params.note)
		query += `CFNote =  '${params.note}',`;
	if (typeof params.archived !== 'undefined')
		query += `Archived =  ${params.archived},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.id};`;

	// archive projectInsureds
	if (typeof params.archived !== 'undefined' && params.archived === 1) {
		query += `UPDATE ProjectsInsureds SET Archived=${params.archived}	WHERE ProjectID=${params.id};`;
		return query;
	}

	console.log('generateProjectUpdateQuery: ', query);
	return query;
}

exports.generateProjectsStatusQuery = function () {

	return `SELECT id, status FROM ProjectStatus ORDER BY status ASC`;
}

exports.generateGetRoleIsHCQuery = function (userId) {

	return `SELECT isHCRole, isPrequalRole, IsSCRole FROM Roles WHERE id IN (SELECT roleId FROM Users WHERE id = ${userId})`;
}

exports.generateAmountProjectNonArchiveQuery = function (holderId) {
	return `SELECT  count(PR.id) as total FROM	Projects PR  
	LEFT JOIN UsersProjects_Favorites PF ON PF.projectId = PR.Id
	LEFT JOIN HiringClients HC ON PR.HiringClientId = HC.Id
	LEFT JOIN ProjectStatus PS ON PR.StatusId = PS.Id
	LEFT JOIN ProjectRequirementSets PRS ON PRS.ProjectID = PR.Id						
	where PR.Archived=0 AND PR.HiringClientId = ${holderId} `;
}
