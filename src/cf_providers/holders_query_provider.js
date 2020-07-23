
exports.generateHolderInsertQuery = function (params) {
	let query = `
	DECLARE @baseHCUrl VARCHAR(200);
	DECLARE @lastIdentity INT;
	SELECT @baseHCUrl = value FROM GlobalParameters WHERE id = 1;

	INSERT INTO HiringClients (`

	query += `Name`;

	if (params.parentHolderID)
		query += `, parentHiringClientId`;
	if (params.subdomain)
		query += `, registrationUrl`;
	if (params.country)
		query += `, country`;
	if (params.phoneNumber)
		query += `, phone`;
	if (params.address1)
		query += `, address1`;
	if (params.address2)
		query += `, address2`;
	if (params.city)
		query += `, city`;
	if (params.state)
		query += `, state`;
	if (params.postalCode)
		query += `, zipCode`;

	if (params.holderStatusId)
		query += `, CFHolderStatusiId`;
	if (params.sourceHolderNumber)
		query += `, CFSourceHolderNumber`;
	if (params.accountManagerId)
		query += `, CFAccountManagerId`;

	if (params.portalURL)
		query += `, CFPortalURL`;
	if (params.intOfficeID)
		query += `, CFIntOfficeID`;
	if (params.initialFee)
		query += `, CFInitialFee`;
	if (params.initialCredits)
		query += `, CFInitialCredits`;
	if (params.addlFee)
		query += `, CFAddlFee`;
	if (params.addlCredits)
		query += `, CFAddlCredits`;

	if (params.department)
		query += `, Department`;

	query += `) VALUES (`;

	query += `'${params.holderName}'`;

	if (params.parentHolderID)
		query += `, ${params.parentHolderID}`;
	if (params.subdomain)
		query += `, '${params.subdomain}' + @baseHCUrl`;
	if (params.country)
		query += `, '${params.country}'`;
	if (params.phoneNumber)
		query += `, '${params.phoneNumber}'`;
	if (params.address1)
		query += `, '${params.address1}'`;
	if (params.address2)
		query += `, '${params.address2}'`;
	if (params.city)
		query += `, '${params.city}'`;
	if (params.state)
		query += `, '${params.state}'`;
	if (params.postalCode)
		query += `, '${params.postalCode}'`;

	if (params.holderStatusId)
		query += `, '${params.holderStatusId}'`
	if (params.sourceHolderNumber)
		query += `, '${params.sourceHolderNumber}'`
	if (params.accountManagerId)
		query += `, '${params.accountManagerId}'`

	if (params.portalURL)
		query += `, '${params.portalURL}'`;
	if (params.intOfficeID)
		query += `, ${params.intOfficeID}`;
	if (params.initialFee)
		query += `, ${params.initialFee}`;
	if (params.initialCredits)
		query += `, ${params.initialCredits}`;
	if (params.addlFee)
		query += `, ${params.addlFee}`;
	if (params.addlCredits)
		query += `, ${params.addlCredits}`;
	if (params.department)
		query += `, '${params.department}'`;

	query += `);
			  SET @lastIdentity = (SELECT IDENT_CURRENT('HiringClients'));
			  INSERT INTO HiringClient_EnabledSystems VALUES (@lastIdentity, 1, 0);`;
	console.log('INSER query', query);
	return query;
}

exports.generateHolderUpdateQuery = function (params) {
	let query = `
	DECLARE @baseHCUrl VARCHAR(200);
	SELECT @baseHCUrl = value FROM GlobalParameters WHERE id = 1;

	UPDATE HiringClients SET `;

	if (params.holderName)
		query += ` name = '${params.holderName}'`;

	if (params.parentHolderID)
		query += `, parentHiringClientId = ${params.parentHolderID}`;

	if (params.subdomain)
		query += `, registrationUrl = '${params.subdomain}' + @baseHCUrl`;

	if (params.country)
		query += `, country = '${params.country}'`;

	if (params.phoneNumber)
		query += `, phone = '${params.phoneNumber}'`;

	if (params.address1)
		query += `, address1 = '${params.address1}'`;

	if (params.address2)
		query += `, address2 = '${params.address2}'`;

	if (params.city)
		query += `, city = '${params.city}'`;

	if (params.state)
		query += `, state = '${params.state}'`;

	if (params.postalCode)
		query += `, zipCode = '${params.postalCode}'`;

	if (params.holderStatusId)
		query += `, CFHolderStatusId = '${params.holderStatusId}'`;
	if (params.sourceHolderNumber)
		query += `, CFSourceHolderNumber = '${params.sourceHolderNumber}'`;
	if (typeof params.accountManagerId !== 'undefined')
		query += `, CFAccountManagerId = '${params.accountManagerId}'`;
	if (params.portalURL)
		query += `, CFPortalURL = '${params.portalURL}'`;
	if (params.intOfficeID)
		query += `, CFIntOfficeID = '${params.intOfficeID}'`;
	if (params.initialFee)
		query += `, CFInitialFee = '${params.initialFee}'`;
	if (params.initialCredits)
		query += `, CFInitialCredits = '${params.initialCredits}'`;
	if (params.addlFee)
		query += `, CFAddlFee = '${params.addlFee}'`;
	if (params.addlCredits)
		query += `, CFAddlCredits = '${params.addlCredits}'`;


	if (typeof params.department !== 'undefined')
		query += `, Department='${params.department}'`;

	query += ` WHERE id = ${params.holderId}`;

	console.log('QUERY::', query);
	return query;
}

exports.generateGetParentsQuery = function (parentId) {
	const query = `SELECT HC.Id, HC.ParentHiringClientId FROM HiringClients HC WHERE HC.ParentHiringClientId =${parentId}`;
	console.log('query ', query);
	return query;
}

exports.getHoldersByIds = function (ids) {
	const query = `
		SELECT  HC.id,
							HC.name,
							HC.registrationUrl,
							HC.country,
							HC.phone,
							HC.state,
							HC.CFPortalURL AS portalURL,
							HC.ParentHiringClientId,
							(SELECT Name FROM HiringClients WHERE id = HC.ParentHiringClientId) AS parentHolder,
							IsNull(
								(select top 1 firstName + ' ' + lastname from Contacts where ContactID in
									(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
								)
								,''
							) contactName,
							IsNull(
								(select top 1 ContactID from Contacts where ContactID in
									(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
								)
								,''
							) contactId 	FROM  HiringClients HC WHERE HC.id IN (${ids.toString()}) ORDER BY name ASC OFFSET 10 * (1 - 1) ROWS FETCH NEXT 10 ROWS ONLY
	`;
	console.log('query ', query);
	return query;
}

exports.generateHoldersQuery = function (params) {
	let whereClause = null;
	let fromClause = null;
	let orderClause = null;
	const holderAccessRoles = [1,8,12,13,14,15]; // TODO this information should be retrieved from Roles_Functions, not hardcoded

	let query = `SELECT  HC.id,
		        HC.name,
		        HC.registrationUrl,
		        HC.country,
		        HC.phone,
						HC.state,
						HC.CFPortalURL AS portalURL,
						HC.ParentHiringClientId,
						(case when HC.Archive is null then 0 else HC.Archive end) as archive,	
						(SELECT Name FROM HiringClients WHERE id = HC.ParentHiringClientId) AS parentHolder,
						IsNull( 
							(select top 1 firstName + ' ' + lastname from Contacts where ContactID in
								(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
							) 
							,''
						) contactName,
						IsNull( 
							(select top 1 ContactID from Contacts where ContactID in
								(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
							) 
							,''
						) contactId `;

	if (params.summary) {
		query = `SELECT  HC.id, HC.name `;
	}
	console.log('query summary', query);

	if (holderAccessRoles.includes(params.roleId)  || holderAccessRoles.includes(params.CFRoleId)) {
		query += `	FROM  HiringClients HC
					INNER JOIN HiringClient_EnabledSystems ES ON HC.Id = ES.HiringClientId `;

	}
	else {
		query += `FROM HiringClients HC,
				Users_HiringClients UC,
				Users U `;
	}
	console.log('userid', params.userId);
	console.log('roleId', params.roleId, (params.roleId === null || typeof params.roleId == 'undefined'));
	console.log('CFRoleId', params.CFRoleId, (params.CFRoleId === null || typeof params.CFRoleId == 'undefined'));

	if (params.userId && (
		(params.roleId != 1 && (params.CFRoleId === null || typeof params.CFRoleId == 'undefined'))
		||
		((params.roleId === null || typeof params.roleId == 'undefined') && params.CFRoleId != 8))
	) {

		whereClause = `WHERE UC.UserId = ${params.userId}
			AND UC.HiringClientId = HC.Id
			AND U.Id = UC.UserId`;

		if (params.searchTerm && !params.onlyHolderParents) {
			whereClause += ` AND
				(
					HC.Phone LIKE '%${params.searchTerm}%' OR
					HC.State LIKE '%${params.searchTerm}%'
				`;
			if (typeof params.nameTerm === 'undefined') whereClause += `OR HC.Name LIKE '%${params.searchTerm}%'`
			whereClause += `)`;

		}

		if (params.nameTerm) {
			whereClause += ` AND HC.Name LIKE '%${params.nameTerm}%'`;
		}

		if (params.archive) {
			whereClause += params.archive == 0 ? ` AND HC.Archive=${params.archive} OR HC.Archive IS NULL` : ` AND HC.Archive=${params.archive}`;
		}

		if (params.contactNameTerm) {
			whereClause += ` AND
				(
						HC.Id in (
							select HiringClientId from Projects where id IN (
								select ProjectID from ProjectsInsureds where InsuredID IN (
									select InsuredID from InsuredContacts where ContactID IN (
										select ContactID from Contacts where (FirstName + ' ' + LastName) like '%${params.contactNameTerm}%'
									)
								)
							)
						)
						OR
						HC.Id in (
							select holderId from HolderContacts where contactId in (
								select id from Contacts where (firstName + ' ' + lastname) like '%${params.contactNameTerm}%' AND (TypeId = 3 OR TypeId is null)
							)
						)
				)`;

		}
	}
	if (holderAccessRoles.includes(params.roleId) || holderAccessRoles.includes(params.CFRoleId)) {
		var whereArray = [];
		var whereTerm = null;

		if (params.searchTerm && !params.onlyHolderParents) {
			whereTerm = `
				(
					HC.Id in (
						select holderId from HolderContacts where contactId in (
							select ContactID from Contacts where (firstName + ' ' + lastname) like '%${params.searchTerm}%' AND TypeId = 3
						)
					) OR
					HC.Phone LIKE '%${params.searchTerm}%' OR
					HC.State LIKE '%${params.searchTerm}%'
				`;
			if (typeof params.nameTerm === 'undefined') whereTerm += `OR HC.Name LIKE '%${params.searchTerm}%'`
			whereTerm += `)`;
			whereArray.push(whereTerm);
		}
		if (params.nameTerm) {
			whereTerm = `HC.Name LIKE '%${params.nameTerm}%' `;
			whereArray.push(whereTerm);
		}

		if (params.archive) {
			whereTerm = params.archive == 0 ? `(HC.Archive=${params.archive} OR HC.Archive IS NULL)` : `HC.Archive=${params.archive}`;
			whereArray.push(whereTerm);
		}

		if (params.contactNameTerm) {
			whereTerm = `
				(
					HC.Id in (
						select DISTINCT HiringClientId from Projects where id IN (
							select ProjectID from ProjectsInsureds where InsuredID IN (
								select InsuredID from InsuredContacts where ContactID IN (
									select ContactID from Contacts where (FirstName + ' ' + LastName) like '%${params.contactNameTerm}%'
								)
							)
						)
					)
					OR
					HC.Id in (
						select holderId from HolderContacts where contactId in (
							select ContactID from Contacts where (firstName + ' ' + lastname) like '%${params.contactNameTerm}%' 
						)
					)					
				)`;
			whereArray.push(whereTerm);
		}

		if (whereArray.length) {
			whereClause = `WHERE `;
			whereClause += whereArray.join(' AND ');
		}
	}

	// if(params.onlyParents) {
	// 	whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
	// 	whereClause += ` HC.ParentHiringClientId IS NULL `;
	// }

	if (params.onlyHolderParents) {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` HC.ParentHiringClientId IS NULL `;
	}

	if (params.excludeHolderId) {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` HC.id != ${params.excludeHolderId} `;
	}

	if (params.filterTerm) {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` HC.Name LIKE '%${params.filterTerm}%' `
	}

	/*if (params.archive) {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` HC.Archive=${params.archive} `
	}*/


	if (params.orderBy) {
		orderClause = ` ORDER BY ${params.orderBy}`

		if (params.orderDirection) {
			orderClause += ` ${params.orderDirection}`;
		}
		else {
			orderClause += ' ASC';
		}
	}
	else {
		orderClause = ` ORDER BY HC.Name ASC `;
	}

	if ( (holderAccessRoles.includes(params.roleId) || holderAccessRoles.includes(params.CFRoleId)) && (whereClause == '' || whereClause == null || whereClause == ' ')) {
		whereClause = ` WHERE cfEnabled = 1`
	} else {
		whereClause += ` and cfEnabled = 1`
	}

	if (params.subcontractorId)
		whereClause += ` AND HC.id IN (SELECT hiringClientId FROM Hiringclients_SubContractors WHERE subcontractorID = ${params.subcontractorId}) `;

	query += whereClause;

	if (orderClause) {
		query += orderClause
	}

	if (params.pagination && params.getTotalCount == false) {
		let pageSize = params.pagination.pageSize
		let pageNumber = params.pagination.pageNumber
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	console.log('QUERY::', query);

	return query;
}

exports.generateHolderDetailQuery = function (params) {
	let query = `SELECT
								HC.id,
								HC.name,
								HC.parentHiringClientId AS parentId,
								HC.registrationUrl,
								HC.country,
								HC.phone,
								HC.address1,
					    		HC.address2,
					    		HC.city,
					    		HC.state,
					    		HC.zipCode,
					    		HC.phone2,
					    		HC.fax,
								HC.timeStamp,
								HC.PortalHomepageText,
								HC.PortalFaqText,
								HC.CFHolderStatusId AS holderStatusId,
								HC.CFSourceHolderNumber AS sourceHolderNumber,
								HC.CFAccountManagerId AS accountManagerId,
								HC.CFPortalURL AS portalURL,
								HC.CFIntOfficeID AS intOfficeID,
								HC.CFInitialFee AS initialFee,
								HC.CFInitialCredits AS initialCredits,
								HC.CFAddlFee AS addlFee,
								HC.CFAddlCredits AS addlCredits,
								(SELECT firstName + ' ' + lastName FROM Users WHERE id = HC.CFAccountManagerId) accountManagerName,
								(SELECT value FROM GlobalParameters WHERE id = 1) baseHCUrl,
								(SELECT name FROM HiringClients WHERE id = HC.parentHiringClientId) parentName,
								(SELECT distinct count(PR.id) FROM	Projects PR  where PR.Archived=1  AND PR.HiringClientId = ${params.holderId}) accountProjects,
								HC.Department as department  `;

	if (params.insuredId)
		query += ` ,(SELECT name FROM SubContractors WHERE id = ${insuredId}) scName `;

	if (params.holderId) {
		query += ` ,IsNull( 
									(select top 1 firstName + ' ' + lastname from Contacts where ContactID in
										(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
										ORDER BY ContactID ASC
									) 
									,''
								) contactName 
								,IsNull( 
									(select top 1 emailAddress from Contacts where ContactID in
										(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
										ORDER BY ContactID ASC
									) 
									,''
								) contactEmail
								,IsNull( 
									(select top 1 ContactID from Contacts where ContactID in
										(select contactId from HolderContacts where holderId = HC.Id) AND TypeId IS NULL
									) 
									,''
								) contactId
								`;
	}

	// if(params.hiringClientId) {
	// 	query += ` 	,(SELECT REPLACE(HC.registrationUrl,(SELECT value FROM GlobalParameters WHERE id = 1),'')) subdomain,
	// 					(SELECT TOP 1 id FROM Users WHERE id IN
	// 						(SELECT top 1 userId FROM Users_HiringClients WHERE HiringClientId = ${params.hiringClientId} AND isContact = 1)
	// 						) contactId `;

	// query += `, (SELECT TOP 1 firstName + ' ' + lastName FROM Users WHERE id in
	// 							(SELECT TOP 1 userId FROM Users_HiringClients WHERE hiringClientId = ${params.hiringClientId} AND isContact = 1)
	// 						) contactName`;
	// }

	query += ` FROM HiringClients HC `;

	if (params.holderName) {
		query += `WHERE HC.Name = '${params.holderName}'`;
	}
	else {
		if (params.holderId)
			query += `WHERE HC.Id = ${params.holderId}`;
	}
	console.log('QUERY', query);
	return query;
}

exports.generateHolderArchiveQuery = function (holderId, status) {
	let query = `update HiringClients set Archive='${status}' where Id='${holderId}'`;
	return query;
}

exports.generateGetHolderChildrenQuery = function (params) {
	const query = `
		WITH cte_org AS (
			SELECT       
					Id,
					Name,
					ParentHiringClientId
			FROM       
					dbo.HiringClients
			WHERE ParentHiringClientId IS NULL
			AND Id = ${params.holderId}
			UNION ALL
			SELECT 
					e.Id, 
					e.Name,
					e.ParentHiringClientId
			FROM 
					dbo.HiringClients e
					INNER JOIN cte_org o 
							ON o.Id = e.ParentHiringClientId
		)
		SELECT * FROM cte_org`;

	console.log('query ', query);
	return query;
}

exports.generateToggleHolderUserStatus = (holderId, userId) => {
	let updateFields = `Archived = ~Archived`;
	let updateQuery = `UPDATE dbo.Users_HiringClients SET ${updateFields}`;
	let updateWhere = `WHERE HiringClientId = ${holderId} AND UserId = ${userId}`;

	return `${updateQuery} ${updateWhere}`
};

exports.getHolderAccountManager = (holderId) => {
	const subQueryCFAdmin = `select Id from Roles where Name = 'CF Admin'`;
	const querySelect = `select CFAccountManagerId 'accountManager', Department 'department', (${subQueryCFAdmin}) 'CFadmin' from HiringClients`
	const queryWhere = `where Id = ${holderId}`

	const query =  `${querySelect} ${queryWhere}`
	return query;
}