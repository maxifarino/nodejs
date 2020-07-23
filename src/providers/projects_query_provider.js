
exports.generateProjectsQuery = function (queryParams) {

	let projectName = queryParams.projectName;
	let hiringClientId = queryParams.hiringClientId;
	let subcontractorId = queryParams.subcontractorId;
	let projectStatusId = queryParams.projectStatusId;
	let tradeId = queryParams.tradeId;
	let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let searchTerm = queryParams.searchTerm;
	let getTotalCount = queryParams.getTotalCount;

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
					PR.hiringClientId, 
					HC.name as hiringClientName,`;
	if (subcontractorId) {
		query += ` (SELECT ISNULL(sum(c.amount), 0) FROM Contracts C WHERE C.ProjectId = PR.id AND C.subcontractorId = ${subcontractorId}) contractsTotalAmount,
								   (SELECT ISNULL(count(*), 0) FROM Contracts C WHERE C.ProjectId = PR.id AND C.subcontractorId = ${subcontractorId}) contractsCount, `;
	}
	else {
		query += ` (SELECT ISNULL(sum(c.amount), 0) FROM Contracts C WHERE C.ProjectId = PR.id ) contractsTotalAmount,
								   (SELECT ISNULL(count(*), 0) FROM Contracts C WHERE C.ProjectId = PR.id ) contractsCount, `;
	}

	query += ` PR.System, PR.timeStamp `;

	if (getTotalCount == true) {
		query = `SELECT COUNT(*) totalCount `;
	}

	query += `FROM	Projects PR,
				        	ProjectStatus PS,
				        	HiringClients HC
						WHERE PR.StatusId = PS.Id
						AND   PR.HiringClientId = HC.Id `;

	query += ` AND PR.System = 'pq' `;

	if (searchTerm)
		query += ` AND (PR.Name like '%${searchTerm}%' OR
										PR.Description like '%${searchTerm}%' OR 
										PR.Number like '%${searchTerm}%' OR
										PR.Manager like '%${searchTerm}%' OR
										PR.Owner like '%${searchTerm}%' OR
										PR.Address1 like '%${searchTerm}%' OR
										PR.Address2 like '%${searchTerm}%') `;

	if (projectName)
		query += ` AND PR.Name like '%${projectName}%' `;

	if (hiringClientId)
		query += ` AND PR.HiringClientId = ${hiringClientId} `;

	if (projectStatusId)
		query += ` AND PR.StatusId = ${projectStatusId} `;

	if (tradeId)
		query += ` AND PR.id in (select projectId from Contracts where tradeId = ${tradeId}) `;

	if (subcontractorId)
		query += ` AND PR.id in (select projectId from Contracts where subcontractorId = ${subcontractorId}) `;

	if (queryParams.isHCRole == true)
		query += ` AND PR.HiringClientId IN (SELECT hiringClientId FROM Users_HiringClients WHERE userId = ${queryParams.loggedUserId})  `;

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

	if (params.hiringClientId)
		query += `, HiringClientId `;

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

	if (params.hiringClientId)
		query += ` , ${params.hiringClientId}`;

	query += `, 'pq' `;
	query += `)`;

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

	if (params.hiringClientId)
		query += `HiringClientId = '${params.hiringClientId}',`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.id}`;

	return query;
}

exports.generateProjectsStatusQuery = function () {

	return `SELECT id, status FROM ProjectStatus ORDER BY status ASC`;
}

exports.generateGetRoleIsHCQuery = function (userId) {

	return `SELECT isHCRole, isPrequalRole, IsSCRole FROM Roles WHERE id IN (SELECT roleId FROM Users WHERE id = ${userId})`;
}


