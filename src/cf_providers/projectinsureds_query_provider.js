exports.generateProjectInsuredsInsertQuery = (params) => {
	
	let query = `INSERT INTO dbo.ProjectsInsureds (
		ProjectID
		, InsuredID
		, ProjectInsuredStatusID
		, SourceSystemID
		, ComplianceStatusID
		, ComplianceStartDate
		, ComplianceEndDate
		, DateFirstCompliant
		, LastComplianceCheckDate
		, LastComplianceChangeDate
		, CustomerUniqueId
  )	VALUES (
		${params.projectId}
		, ${params.insuredId}
		, ${params.projectInsuredStatusId || 0}
		,'${params.sourceSystemId || 0}'
		, ${params.complianceStatusId || 0}
		,${params.complianceStartDate || null}
		,${params.complianceEndDate || null}
		,${params.dateFirstCompliant || null}
		,${params.lastComplianceCheckDate || null}
		,${params.lastComplianceChangeDate || null}
		,${params.customerUniqueId || null}
  )`;
	//console.log(query)
	return query;
}

exports.generateProjectInsuredsQuery = (params) => {
	
	let query = `SELECT
		PI.ComplianceEndDate,
		PI.ComplianceStartDate,
		PI.ComplianceStatusID,
		PCS.StatusName AS ComplianceStatusName,
		PI.CustomerUniqueId,
		PI.DateFirstCompliant,
		PI.LastComplianceChangeDate,
		PI.LastComplianceCheckDate,
		PI.ProjectID,
		PR.Name AS ProjectName,
		PR.Number AS ProjectNumber,
		PR.State AS ProjectState,
		PR.City,
		PI.ProjectInsuredStatusID,
		PI.ProjectInsuredID,
		PI.InsuredID,
		PI.Archived as Archived,
		PI.Exempt,
		SC.Name AS InsuredName,
		SC.State AS InsuredState,
		(SELECT TOP 1 'yes' FROM UsersProjects_Favorites PF WHERE PF.ProjectId = PR.id) AS mylist,
		HC.Id AS HolderID,
		HC.Name AS HolderName,
		PR.System,
    CONVERT(VARCHAR(64), HashBytes('SHA2_256', 
			CONCAT(
				CAST(PI.ProjectInsuredID AS VARCHAR(10)),
				CAST(PI.ProjectID AS VARCHAR(10)),
				CAST(PI.InsuredID AS VARCHAR(10))
			)
		), 2) AS CertUploadHash,
		(SELECT TOP 1 DocumentId FROM CertificateOfInsurance COI WHERE COI.ProjectId = PI.ProjectID AND COI.InsuredId = PI.InsuredID ORDER BY COI.Created DESC) AS DocumentId,
		PRS.RequirementSetID,
		(SELECT TOP 1 CertificateID FROM dbo.Coverages_TopLayers WHERE ProjectInsuredID = PI.ProjectInsuredID) AS HasCertificate,
		(
			SELECT COALESCE(count(D2.DocumentStatusID), 0)
			FROM dbo.Documents D2
			INNER JOIN dbo.CertificateOfInsurance COI2
			ON COI2.DocumentId = D2.DocumentID
			WHERE D2.ProjectId = PI.ProjectID
			AND	(D2.DocumentStatusID = 11 OR D2.DocumentStatusID = 14)
		) AS HasProcessedDocuments
		FROM dbo.ProjectsInsureds PI
		INNER JOIN dbo.SubContractors SC ON SC.id = PI.InsuredID
		INNER JOIN dbo.Projects PR ON PR.id = PI.ProjectID
		INNER JOIN dbo.HiringClients HC ON HC.id = PR.HiringClientID
		LEFT JOIN ProjectInsured_ComplianceStatus PCS ON PCS.ProjectInsuredComplianceStatusId = PI.ComplianceStatusID
		LEFT JOIN UsersProjects_Favorites PF ON PF.projectId = PR.Id
		LEFT JOIN dbo.ProjectRequirementSets PRS ON PRS.ProjectID = PR.Id
		WHERE 1 = 1`;

	query += ` AND PR.System = 'cf' `;

	if (params.projectInsuredId)
		query += ` AND PI.ProjectInsuredID = ${params.projectInsuredId}`;
	if (params.insuredId)
		query += ` AND PI.InsuredID = ${params.insuredId}`;
	if (params.projectId)
		query += ` AND PR.id = ${params.projectId}`;
	if (params.complianceStatusId)
		query += ` AND PI.ComplianceStatusID = ${params.complianceStatusId}`;
	if (params.insuredName)
		query += ` AND SC.Name LIKE '%${params.insuredName}%'`;
	if (params.projectName)
		query += ` AND PR.Name LIKE '%${params.projectName}%'`;

	if (params.holderName)
		query += ` AND HC.Name LIKE '%${params.holderName}%'`;
	if (params.insuredState)
		query += ` AND SC.State LIKE '%${params.insuredState}%'`;
	if (params.projectState)
		query += ` AND PR.State LIKE '%${params.projectState}%'`;

	if (params.mylist == '1')
		query += ` AND PF.UserId IS NOT NULL `;
	if (params.mylist == '2')
		query += ` AND PF.UserId IS NULL `;

	if (params.keywordName) {
		query += `  AND (SC.Name like '%${params.keywordName}%'  OR
							 PR.Name like '%${params.keywordName}%' OR
							 HC.Name like '%${params.keywordName}%') `;
	}

	if (params.archived)
		query += `  AND PI.Archived= ${params.archived} `;

	if (params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		if (params.orderDirection) {
			query += ` ${params.orderDirection} `;
		}
	}

	if (params.pageSize && !params.getTotalCount && !params.getOne) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	console.log('generateProjectInsuredsQuery: ', query);
	return query;
}

exports.generateProjectInsuredsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.ProjectsInsureds (
		ProjectID
		, InsuredID
		, ProjectInsuredStatusID
		, SourceSystemID
		, ComplianceStatusID
		, ComplianceStartDate
		, ComplianceEndDate
		, DateFirstCompliant
		, LastComplianceCheckDate
		, LastComplianceChangeDate
		, CustomerUniqueId
  )	VALUES (
		${params.projectId}
		, ${params.insuredId}
		, ${params.projectInsuredStatusId || 0}
		,'${params.sourceSystemId || 0}'
		, ${params.complianceStatusId || 0}
		,${params.complianceStartDate || null}
		,${params.complianceEndDate || null}
		,${params.dateFirstCompliant || null}
		,${params.lastComplianceCheckDate || null}
		,${params.lastComplianceChangeDate || null}
		,${params.customerUniqueId || null}
  )`;
	//console.log(query)
	return query;
}

exports.generateProjectInsuredsSummaryQuery = (params) => {

	let query = `SELECT
		PI.ProjectInsuredID,
		PI.ProjectID,
		PI.InsuredID,
		SC.Name AS InsuredName
		FROM dbo.ProjectsInsureds PI
		INNER JOIN dbo.SubContractors SC ON SC.id = PI.InsuredID
		WHERE 1 = 1`;

	if (params.insuredId)
		query += ` AND PI.InsuredID = ${params.insuredId}`;
	if (params.projectId)
		query += ` AND PI.ProjectID = ${params.projectId}`;

	console.log('generateProjectInsuredsSummaryQuery: ', query);
	return query;
}


exports.generateProjectInsuredsUpdateQuery = (params) => {
	console.log('generateProjectInsuredsUpdateQuery', params);
	let query = `UPDATE dbo.ProjectsInsureds SET `;

	if (params.projectInsuredStatusId)
		query += `ProjectInsuredStatusID = ${params.projectInsuredStatusId},`;

	if (params.sourceSystemId)
		query += `SourceSystemID = '${params.sourceSystemId}',`;

	if (params.complianceStatusId)
		query += `ComplianceStatusID = ${params.complianceStatusId},`;

	if (params.complianceStartDate)
		query += `ComplianceStartDate = '${params.complianceStartDate}',`;

	if (params.complianceEndDate)
		query += `ComplianceEndDate = '${params.complianceEndDate}',`;

	if (params.dateFirstCompliant)
		query += `DateFirstCompliant = '${params.dateFirstCompliant}',`;

	if (params.lastComplianceCheckDate)
		query += `LastComplianceCheckDate = '${params.lastComplianceCheckDate}',`;

	if (params.lastComplianceChangeDate)
		query += `LastComplianceChangeDate = '${params.lastComplianceChangeDate}',`;

	if (params.customerUniqueId)
		query += `CustomerUniqueId = ${params.customerUniqueId},`;

	if (params.lastComplianceStatusId)
		query += `LastComplianceStatusID = '${params.lastComplianceStatusId}',`;
		

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE ProjectInsuredID = ${params.projectInsuredId}`;

	console.log('QUERY', query);
	return query;
}

exports.generateProjectInsuredsDeleteQuery = (params) => {

	let query = `DELETE FROM dbo.ProjectsInsureds
    WHERE ProjectInsuredID = ${params.projectInsuredId}`;

	return query;
}

exports.checkIfProjectInsuredExists = (projectId, insuredId) => {

	let query = `SELECT 1 WHERE EXISTS (
								SELECT * from dbo.ProjectsInsureds
								WHERE ProjectID = ${projectId}
								AND InsuredId = ${insuredId})`;

	return query;
}

exports.archiveProjectInsuredsQueryUpdate = (params) => {

	let query = `UPDATE ProjectsInsureds SET Archived=${params.isCurrentArchived}
	WHERE ProjectInsuredID=${params.ProjectInsuredID}`;
	console.log('UPDATE ProjectsInsureds ', query);
	return query;
}

exports.countProjectsNonArchived = (insuredId) => {
	let query = ` select count(PR.id) as count
	FROM dbo.ProjectsInsureds PI
	INNER JOIN dbo.SubContractors SC ON SC.id = PI.InsuredID
	INNER JOIN dbo.Projects PR ON PR.id = PI.ProjectID
	INNER JOIN dbo.HiringClients HC ON HC.id = PR.HiringClientID
	LEFT JOIN ProjectInsured_ComplianceStatus PCS ON PCS.ProjectInsuredComplianceStatusId = PI.ComplianceStatusID       
	LEFT JOIN UsersProjects_Favorites PF ON PF.projectId = PR.Id
	WHERE 1 = 1 AND PR.System = 'cf'  AND PI.InsuredID = ${insuredId}  AND PI.Archived=0`;

	return query;
}

exports.exemptProjectInsuredsQueryUpdate = (params) => {
	let query = `UPDATE ProjectsInsureds 
		SET Exempt=${params.Exempt}
		WHERE ProjectInsuredID=${params.ProjectInsuredID}`;
	console.log('exemptProjectInsuredsQueryUpdate :', query);
	return query;
}

exports.checkIfProjectInsuredCertificateExists = (projectInsuredId, certificateId) => {
	let query = `SELECT 1 WHERE EXISTS (
		SELECT * FROM dbo.ProjectInsureds_CertificateOfInsurance
		WHERE ProjectInsuredID = ${projectInsuredId}
		AND CertificateID = ${certificateId}
	)`;
	return query;
}

exports.generateProjectInsuredsCertificateInsertQuery = (params) => {
	let query = `INSERT INTO dbo.ProjectInsureds_CertificateOfInsurance (
		ProjectInsuredID
		, CertificateID
  )	VALUES (
		${params.projectInsuredId}
		, ${params.certificateId}
  )`;
	//console.log('generateProjectInsuredsCertificateInsertQuery: ', query);
	return query;
}

exports.generateProjectInsuredsSimpleQuery = (params) => {

	let query = `SELECT * FROM dbo.ProjectsInsureds
    WHERE ProjectInsuredID = ${params.projectInsuredId}`;
	return query;
}
