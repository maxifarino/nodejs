const statusProvider = require('./status_query_provider');


exports.generateContactsTypesQuery = function () {
	// tasksQuery # 3
	return `SELECT id, description FROM ContactsTypes `;
}



exports.generateContactsQuery = function (params) {
	console.log('PARAMS', params);
	let whereClause = null;
	let fromClause = null;
	let orderClause = null;

	let query = `SELECT
		C.ContactID AS id,
		C.FirstName,
		C.LastName,
		C.phoneNumber,
		C.mobileNumber,
		C.emailAddress,
		C.typeId as contactTypeId,
		(SELECT Description FROM ContactsTypes WHERE id = C.typeId) AS contactType`

	if (!params.insuredId && !params.holderId) {
		query += `, IsNull(
			(select TOP 1 Name from SubContractors where id IN (
				select InsuredID from InsuredContacts where ContactID = C.ContactID
			))
			, IsNull(
				(select TOP 1 Name from HiringClients where id IN (
					select HolderID from HolderContacts where ContactID = C.ContactID
				))
				, '')
		) entity`;
		query += `, IsNull(
			(select TOP 1 'Insured' as Type from SubContractors where id IN (
				select InsuredID from InsuredContacts where ContactID = C.ContactID
			))
			, IsNull(
				(select TOP 1 'Holder' as Type from HiringClients where id IN (
					select HolderID from HolderContacts where ContactID = C.ContactID
				))
				, '')
		) entityType`;
	}

	if (params.summary) {
		query = `SELECT
				C.ContactID AS id,
				(C.FirstName + ' ' + C.LastName) AS name
		`;
	}

	if (!params.holderId && !params.insuredId) {
		query += `	FROM Contacts C `;
	}
	var whereArray = [];

	if (params.holderId) {
		query += ` ,HDC.HolderContactId`
		query += ` FROM Contacts C,
				HiringClients HC,
				HolderContacts HDC `;

		whereTerm = `(HC.id = ${params.holderId}
			AND HDC.HolderId = HC.Id
			AND C.ContactId = HDC.ContactId)`;
		whereArray.push(whereTerm);

		// TO remove all primary contacts
		whereTerm = `C.typeId IS NOT NULL`;
		whereArray.push(whereTerm);
	}

	if (params.insuredId) {
		query += ` ,IDC.InsuredContactId`
		query += ` FROM Contacts C,
				SubContractors SC,
				InsuredContacts IDC `;

		whereTerm = `(SC.id = ${params.insuredId}
		AND IDC.InsuredId = SC.Id
		AND C.ContactId = IDC.ContactId)`;
		whereArray.push(whereTerm);
	}

	if (params.typeId) {
		whereTerm = `C.typeId = ${params.typeId}`;
		whereArray.push(whereTerm);
	}
	if (params.firstNameTerm) {
		whereTerm = `C.firstName LIKE '%${params.firstNameTerm}%'`;
		whereArray.push(whereTerm);
	}
	if (params.lastNameTerm) {
		whereTerm = `C.lastName LIKE '%${params.lastNameTerm}%'`;
		whereArray.push(whereTerm);
	}

	if (whereArray.length) {
		whereClause = `WHERE `;
		whereClause += whereArray.join(' AND ');
	}


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
		orderClause = ` ORDER BY C.FirstName ASC `;
	}
	if (params.summary) orderClause = ` ORDER BY name ASC `;

	if (whereClause == '' || whereClause == null || whereClause == ' ') whereClause = ` WHERE 1 = 1`;

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



exports.generateContactInsertQuery = function (params) {
	let query = `

	INSERT INTO Contacts (`

	query += `firstName`;

	if (params.lastName)
		query += `, lastName`;
	if (params.phoneNumber)
		query += `, phoneNumber`;
	if (params.mobileNumber)
		query += `, mobileNumber`;
	if (params.emailAddress)
		query += `, emailAddress`;
	if (params.typeId)
		query += `, typeId`;

	query += `) VALUES (`;

	query += `'${params.firstName}'`;

	if (params.lastName)
		query += `, '${params.lastName}'`;
	if (params.phoneNumber)
		query += `, '${params.phoneNumber}'`;
	if (params.mobileNumber)
		query += `, '${params.mobileNumber}'`;
	if (params.emailAddress)
		query += `, '${params.emailAddress}'`;
	if (params.typeId)
		query += `, ${params.typeId}`;

	query += `)`;

	console.log('QUERY::', query);

	return query;
}

exports.generateContactUpdateQuery = function (params) {
	let query = `

	UPDATE Contacts SET `;

	if (params.firstName)
		query += ` firstName = '${params.firstName}'`;

	if (params.lastName)
		query += `, lastName = '${params.lastName}'`;

	if (params.phoneNumber)
		query += `, phoneNumber = '${params.phoneNumber}'`;

	if (params.mobileNumber)
		query += `, mobileNumber = '${params.mobileNumber}'`;

	if (params.emailAddress)
		query += `, emailAddress = '${params.emailAddress}'`;

	if (params.typeId)
		query += `, typeId = ${params.typeId}`;

	query += ` WHERE contactId = ${params.contactId}`;

	console.log('QUERY::', query);

	return query;
}


exports.generateHolderContactInsertQuery = function (params) {
	let query = `
	DECLARE @exists INT;
	SELECT @exists = COUNT(*) 
	FROM HolderContacts 
	WHERE HolderId = ${params.holderId} 
	AND ContactId = ${params.contactId}
	
	IF @exists = 0
	BEGIN
				INSERT INTO HolderContacts (HolderId, ContactId) VALUES ( `;
	query += params.holderId + `, `;
	query += params.contactId + `);  
	END `;

	console.log('QUERY::', query);

	return query;
}



exports.generateInsuredContactInsertQuery = function (params) {
	let query = `
	DECLARE @exists INT;
	SELECT @exists = COUNT(*) 
	FROM InsuredContacts 
	WHERE InsuredId = ${params.insuredId} 
	AND ContactId = ${params.contactId}
	
	IF @exists = 0
	BEGIN
				INSERT INTO InsuredContacts (InsuredId, ContactId) VALUES ( `;
	query += params.insuredId + `, `;
	query += params.contactId + `);  
	END `;
	console.log('QUERY::', query);

	return query;
}


exports.generateHolderContactUnlinkQuery = function (queryParams) {
	let query = `DELETE FROM HolderContacts WHERE ContactId = ${queryParams.contactId} AND HolderId= ${queryParams.holderId}`;
	console.log('QUERY::', query);

	return query;
}

exports.generateInsuredContactUnlinkQuery = function (queryParams) {
	let query = `DELETE FROM InsuredContacts WHERE ContactId = ${queryParams.contactId} AND InsuredId= ${queryParams.insuredId}`;
	console.log('QUERY::', query);

	return query;
}

exports.generateGetCertificateByInsuredId = function (parameter) {

	let query = `SELECT 
	pin.ProjectInsuredID as ProjectInsuredID,
	pin.ProjectID,
	pin.InsuredID,
	ctl.CertificateID,
	coi.DocumentId,
	ct.Code,
	d.FileName,
	'' as 'UrlFile',
	(select MainEmail from Agencies where AgencyId=(
		select AgencyId from CertificateOfInsurance where CertificateId=ctl.CertificateID and DocumentId=coi.DocumentId
		)) as EmailProcedure,
	d.DocumentStatusId,
	ds.DocumentStatus,
	(select MainEmail from SubContractors where Id=pin.InsuredID) AS EmailInsured,
	pin.ComplianceStatusID 
	FROM ProjectsInsureds pin
	LEFT JOIN Coverages_TopLayers ctl on pin.projectInsuredId=ctl.projectInsuredId 
	LEFT JOIN CertificateOfInsurance coi on coi.projectId=pin.projectId 
	AND coi.insuredId=pin.InsuredID AND ctl.certificateId=coi.certificateId
	LEFT JOIN CoveragesTypes ct on ct.CoverageTypeID=ctl.CoverageTypeID   
	LEFT JOIN Documents d on d.DocumentId=coi.DocumentId
	LEFT JOIN DocumentStatus ds on ds.DocumentStatusID=d.DocumentStatusID
	where pin.ProjectInsuredID=${parameter.projectInsuredId}`;

	return query;
}

exports.generateGetDeficiencesByInsuredId = function (parameter) {

	let query = `SELECT *
				 FROM vw_MasterCoverageAttributesStatus
				 WHERE ProjectInsuredID = ${parameter.projectInsuredId}
				 ORDER BY RuleGroupID, RuleID`;

	return query;
}

exports.generateUpdateToggledeficiences = function (parameters) {
	const { projectInsuredDeficiencyId, deficiencesStatusId } = parameters;
	let query = `UPDATE ProjectInsuredDeficiencies SET DeficiencyStatusID=${deficiencesStatusId} WHERE ProjectInsuredDeficiencyID=${projectInsuredDeficiencyId}`;
	return query;
}

exports.generateGetUserQuery = function () {
	let query = `SELECT u.Id,u.FirstName+' '+u.LastName as Name FROM Users u INNER JOIN Roles r on r.Id=u.RoleID WHERE u.CFRoleId IN (8,13,12,10,20)`;
	return query;
}

exports.generateGetProjectInsuredQuery = function (param) {
	let query = `SELECT
	HC.Id AS HolderId, 
	HC.Name AS HolderName,
	PR.Id as ProjectId,
	PR.Number AS ProjectNumber,
	PR.Name AS ProjectName,
	SC.Id as InsuredId,
	SC.Name AS InsuredName,
	RS.Name AS RequirementSetName,
	RS.id as RequirementSetId   
	FROM ProjectsInsureds PI
	INNER JOIN Projects PR ON PR.id = PI.ProjectID
	INNER JOIN HiringClients HC on HC.Id=PR.HiringClientId
	INNER JOIN SubContractors SC ON SC.id = PI.InsuredID
	LEFT JOIN ProjectRequirementSets PRS ON PRS.ProjectID = PR.Id
	LEFT JOIN RequirementSets RS on RS.Id=PRS.RequirementSetId
	WHERE PI.projectInsuredID=${param}`;
	return query;
}

exports.getSaveWaiveQuery = (waive, def) => {
	let query = ``

	query += `INSERT INTO WaiversDeficiencies (
		ProjectInsuredDefiencyId
		, WaiverStartDate
		, WaiverSetBy
		, ApprovedBy
		, note			
		, WaiverEndDate
	) VALUES (
		${def.ProjectInsuredDeficiencyID}
		,'${waive.waiverStartDate}'
		,${waive.waiverSetBy}
		,${waive.approvedBy}
		,'${waive.note}'`;
	query += (waive.waiverEndDate) ? `,'${waive.waiverEndDate}'` : ', NULL';
	query += ');';
		
	query += ` UPDATE ProjectInsuredDeficiencies SET 
				DeficiencyStatusID=2 
				WHERE ProjectInsuredDeficiencyID=${def.ProjectInsuredDeficiencyID};`


	console.log('generateSaveWaiversDeficienciesQuery: ', query)
	return query
}

exports.generateUndoWaiversDeficienciesQuery = function (projectInsuredDeficiencyId) {
	let query = `DELETE WaiversDeficiencies WHERE ProjectInsuredDefiencyId=${projectInsuredDeficiencyId};`;
	query += `UPDATE ProjectInsuredDeficiencies SET DeficiencyStatusID=0 WHERE ProjectInsuredDeficiencyID=${projectInsuredDeficiencyId};`
	console.log('generateUndoWaiversDeficienciesQuery: ', query);	
	return query;
}

exports.generateConfirmDeficienciesQuery = (projectInsuredDeficiencyId) => {
	let query = `UPDATE ProjectInsuredDeficiencies 
			SET DeficiencyStatusID = 1 
			WHERE ProjectInsuredDeficiencyID=${projectInsuredDeficiencyId}`
	console.log('generateConfirmdeficienciesQuery: ', query);	
	return query;
}

exports.generateUpdateProcedureEmailQuery = function (parameters) {
	let query = `UPDATE Agencies SET MainEmail='${parameters.email}' where AgencyId=(
		select AgencyId from [dbo].[CertificateOfInsurance] where CertificateId=${parameters.certificateId} and DocumentId=${parameters.documentId}
		)`;

	console.log('generateUpdateProcedureEmailQuery:::', query);
	return query;
}

exports.generateUpdateInsuredEmailQuery = function (parameters) {
	let query = `UPDATE SubContractors SET MainEmail='${parameters.email}' where Id=${parameters.insuredId}`;

	return query;
}

exports.generateRejectCertificate = function (deficiencyId) {
	return `UPDATE ProjectInsuredDeficiencies 
			SET DeficiencyStatusID = 3 
			WHERE ProjectInsuredDeficiencyID in (${deficiencyId});`;
}

exports.generateOnHoldCertificate = function (parameters) {
	let query = `UPDATE ProjectsInsureds SET LastComplianceStatusID=${parameters.lastStatus},ComplianceStatusID=${parameters.status} where projectInsuredID=${parameters.projectInsuredID}`;

	return query;
}

exports.generateRemoveOnHoldCertificate = function (parameters) {
	let query = `UPDATE ProjectsInsureds SET ComplianceStatusID=LastComplianceStatusID where projectInsuredID=${parameters.projectInsuredID}`;
	return query;
}

exports.generateUpdateDocumentStatus = function (projectInsuredID) {
	let query = `if not EXISTS(SELECT DocumentId FROM vw_MasterCoverageAttributesStatus where ProjectInsuredID = ${projectInsuredID} and DeficiencyStatusID = 0 and DeficiencyTypeID = 1)
	BEGIN
	update[dbo].[Documents] set DocumentStatusID = 11  where DocumentID in (
		SELECT 
		coi.DocumentId
	FROM ProjectsInsureds pin
	LEFT JOIN Coverages_TopLayers ctl on pin.projectInsuredId = ctl.projectInsuredId
	LEFT JOIN CertificateOfInsurance coi on coi.projectId = pin.projectId
	AND coi.insuredId = pin.InsuredID AND ctl.certificateId = coi.certificateId
	LEFT JOIN CoveragesTypes ct on ct.CoverageTypeID = ctl.CoverageTypeID
	LEFT JOIN Documents d on d.DocumentId = coi.DocumentId
	LEFT JOIN DocumentStatus ds on ds.DocumentStatusID = d.DocumentStatusID
	where pin.ProjectInsuredID = ${projectInsuredID}
   )
	END
	ELSE
	BEGIN
	update[dbo].[Documents] set DocumentStatusID = 14  where DocumentID in (
		SELECT 
		coi.DocumentId
	FROM ProjectsInsureds pin
	LEFT JOIN Coverages_TopLayers ctl on pin.projectInsuredId = ctl.projectInsuredId
	LEFT JOIN CertificateOfInsurance coi on coi.projectId = pin.projectId
	AND coi.insuredId = pin.InsuredID AND ctl.certificateId = coi.certificateId
	LEFT JOIN CoveragesTypes ct on ct.CoverageTypeID = ctl.CoverageTypeID
	LEFT JOIN Documents d on d.DocumentId = coi.DocumentId
	LEFT JOIN DocumentStatus ds on ds.DocumentStatusID = d.DocumentStatusID
	where pin.ProjectInsuredID = ${projectInsuredID})
	END`;

	console.log('generateUpdateDocumentStatus: ', query);
	return query;
}

exports.generateEscalateCertificateQuery = function (parameters) {
	let query = `UPDATE ProjectsInsureds SET ComplianceStatusID=2 where projectInsuredID=${parameters.projectInsuredId};`;

	parameters.deficiences.forEach(element => {
		query += statusProvider.generateCoveragesAttributesUpdateStatusQuery({ ...element, coverageAttributeStatusId: element.coverageAttributeStatusID, coverageStatusId: element.coverageAttributeStatusID });
	})

	console.log('generateEscalateCertificateQuery: ', query);
	return query;
}

exports.generateDeleteWaiversDeficienciesQuery = function (params) {
	let query = `DELETE WaiversDeficiencies  WHERE `;
	if (params.projectInsuredDefiencyId) query += `ProjectInsuredDefiencyId=${params.projectInsuredDefiencyId};`;
	if (params.projectInsuredDefiencyIds) query += `ProjectInsuredDefiencyId IN (${params.projectInsuredDefiencyIds});`;
	return query;
}

