exports.generateInsuredsQuery = (params) => {
	let query = `SELECT
		SC.Id	
		, SC.Name AS InsuredName
		, SC.CFLegalName AS LegalName
		, SC.TaxID
		, SC.Address
		, SC.CFAddress2 AS Address2
		, SC.City
		, SC.State
		, SC.ZipCode AS PostalCode
		, SC.CountryID
		, SC.ContactFullName AS ContactName
		, SC.ContactPhone
		, SC.CFContactFax AS ContactFax
		, SC.MainEmail AS ContactEmail
		, SC.CFInsuredDescription AS InsuredDescription
		, (case when SC.Archive is null then 0 else SC.Archive end) as archive
		, HCS.HiringClientId
		,( 
			SELECT STRING_AGG(CAST(SCS.Status AS NVARCHAR(MAX)), '|') WITHIN GROUP (ORDER BY SCS.TimeStamp)
				FROM dbo.SubcontractorsStatus SCS 
				INNER JOIN dbo.Hiringclients_Subcontractors HCS 
				ON HCS.SubContractorId = SC.Id
				WHERE SCS.Id = HCS.SubcontractorStatusID
			) AS Status
		, ( 
				SELECT STRING_AGG(
					CAST(CONCAT_WS('|', PR.Id, PR.Name)
					AS NVARCHAR(MAX)), ','
				)
				FROM dbo.Projects PR 
				INNER JOIN dbo.ProjectsInsureds PRI ON PRI.InsuredID = SC.Id
				WHERE PR.Id = PRI.ProjectID
			) AS ProjectName
		, ( 
			SELECT STRING_AGG(
				CAST(CONCAT_WS('|', HC.Id, HC.Name)
				AS NVARCHAR(MAX)), ','
			) WITHIN GROUP (ORDER BY HC.Id) 
			FROM dbo.Hiringclients HC
			WHERE HC.Id = HCS.HiringClientId
		) AS HolderName`;
	
	if (params.holderName) {
			query += `
				, HC.Id AS HcId
				, HC.Name`;
	}
	
	if (params.projectName) {
		query += `
			, PR.Id AS PrId
			, PR.Name`;
	}

	query += ` FROM dbo.SubContractors SC
		INNER JOIN dbo.Hiringclients_Subcontractors HCS ON HCS.SubContractorId = SC.Id `;
		
	if (params.holderName) {
		query += `			
			INNER JOIN dbo.Hiringclients HC ON HC.Id = HCS.HiringClientId `;
	}

	if (params.projectName) {
		query += `
			INNER JOIN dbo.ProjectsInsureds PRI ON PRI.InsuredID = SC.Id
			INNER JOIN dbo.Projects PR ON PR.Id = PRI.ProjectID `;
	}
	
	query += ` WHERE 1 = 1 `;

	if (params.insuredId)
		query += ` AND SC.Id = ${params.insuredId}`;
	if (params.insuredName)
		query += ` AND SC.Name LIKE '%${params.insuredName}%'`;
	if (params.holderName)
		query += ` AND HC.Name LIKE '%${params.holderName}%'`;
	if (params.projectName)
		query += ` AND PR.Name LIKE '%${params.projectName}%'`;
	if (params.stateId)
		query += ` AND SC.State like '%${params.stateId}%'`;
	if (params.archive) {
		if (params.archive === '0') {
			query += ` AND (SC.Archive IS NULL OR SC.Archive = 0)`;
		} else {
			query += ` AND SC.Archive = 1`;
		}
	}

	query += ` GROUP BY SC.Id 
	, SC.Name
	, SC.CFLegalName
	, SC.TaxID
	, SC.Address
	, SC.CFAddress2
	, SC.City
	, SC.State
	, SC.ZipCode
	, SC.CountryID
	, SC.ContactFullName
	, SC.ContactPhone
	, SC.CFContactFax
	, SC.MainEmail
	, SC.CFInsuredDescription
	, SC.Archive
	, HCS.HiringClientId `;

	if (params.holderName) {
		query += `
			, HC.Id
			, HC.Name`;
	}
	if (params.projectName) {
		query += `
			, PR.Id
			, PR.Name`;
	}	

	if (params.orderBy) {
		if (!params.orderBy === 'holderName' || !params.orderBy === 'projectName') {
			params.orderBy = '1';
		}

		query += ` ORDER BY ${params.orderBy} `;
		
		if (params.orderDirection) {
			query += ` ${params.orderDirection}`;
		}
	}

	if (params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	console.log('generateInsuredsQuery: ', query);
	return query;
}

exports.generateInsuredsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.SubContractors (
		Name
		, CFLegalName
		, TaxID
		, Address
		, CFAddress2
		, City
		, State
		, ZipCode
		, CountryID
		, ContactFullName
		, ContactPhone
		, CFContactFax
		, MainEmail
		, CFInsuredDescription
		, Archive
	) VALUES (
		'${params.insuredName}'
		,'${params.legalName}'
		,'${params.taxId}'
		,'${params.address1}'
		,'${params.address2}'
		,'${params.city}'
		,'${params.stateId}'
		,'${params.postalCode}'
		,${params.countryId || 0}
		,'${params.contactName}'
		,'${params.contactPhone}'
		,'${params.contactFax}'
		,'${params.contactEmail}'
		,'${params.insuredDescription}'
		, 0
	)`;
	//console.log(query)
	return query;
}

exports.generateInsuredsUpdateQuery = (params) => {

	let query = `UPDATE dbo.SubContractors SET `;

	if (params.insuredName)
		query += `Name = '${params.insuredName}',`;
	if (params.legalName)
		query += `CFLegalName = '${params.legalName}',`;
	if (params.taxId)
		query += `TaxID = '${params.taxId}',`;
	if (params.address1)
		query += `Address = '${params.address1}',`;
	if (params.address2)
		query += `CFAddress2 = '${params.address2}',`;
	if (params.city)
		query += `City = '${params.city}',`;
	if (params.stateId)
		query += `State = '${params.stateId}',`;
	if (params.postalCode)
		query += `ZipCode = '${params.postalCode}',`;
	if (params.countryId)
		query += `CountryID = ${params.countryId},`;
	if (params.contactName)
		query += `ContactFullName = '${params.contactName}',`;
	if (params.contactPhone)
		query += `ContactPhone = '${params.contactPhone}',`;
	if (params.contactFax)
		query += `CFContactFax = '${params.contactFax}',`;
	if (params.contactEmail)
		query += `MainEmail = '${params.contactEmail}',`;
	if (params.insuredDescription)
		query += `CFInsuredDescription = '${params.insuredDescription}',`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.insuredId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateInsuredsDeleteQuery = (params) => {

	let query = `DELETE dbo.SubContractors WHERE Id = ${params.insuredId}`;

	return query;
}

exports.generateInsuredArchiveQuery = (params) => {
	let query = `update dbo.SubContractors set Archive=${params.status} WHERE Id = ${params.insuredId}`;

	return query;
}

exports.generateInsuredsShallowQuery = (params) => {

	let query = `SELECT 
		SC.Id	
		, SC.Name AS InsuredName
	 	, SC.CFLegalName AS LegalName
		, SC.TaxID
		, SC.Address
		, SC.CFAddress2 AS Address2
		, SC.City
		, SC.State
		, SC.ZipCode AS PostalCode
		, SC.CountryID
		, SC.ContactFullName AS ContactName
		, SC.ContactPhone
		, SC.CFContactFax AS ContactFax
		, SC.MainEmail AS ContactEmail
		, SC.CFInsuredDescription AS InsuredDescription
		, PRI.ProjectInsuredID
		FROM dbo.SubContractors SC
		INNER JOIN dbo.ProjectsInsureds PRI ON PRI.InsuredID = SC.Id
		WHERE 1=1`;

	if (params.insuredId)
		query += ` AND SC.Id = ${params.insuredId}`;
	if (params.insuredName)
		query += ` AND SC.Name LIKE '%${params.insuredName}%'`;
	if (params.projectId)
		query += ` AND PRI.ProjectID = ${params.projectId}`;

	if (params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;

		if (params.orderDirection) {
			query += ` ${params.orderDirection}`;
		}
	}

	if (params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	console.log('QUERY', query);
	return query;
}


// Hiringclients_SubContractors
exports.generateInsuredsByHolderQuery = (params) => {
	let query = `SELECT 
		SC.Id	
		, SC.Name AS InsuredName
	 	, SC.CFLegalName AS LegalName
		, SC.TaxID
		, SC.Address
		, SC.CFAddress2 AS Address2
		, SC.City
		, SC.State
		, SC.ZipCode AS PostalCode
		, SC.CountryID
		, SC.ContactFullName AS ContactName
		, SC.ContactPhone
		, SC.CFContactFax AS ContactFax
		, SC.MainEmail AS ContactEmail
		, SC.CFInsuredDescription AS InsuredDescription
		FROM dbo.SubContractors SC
		INNER JOIN dbo.Hiringclients_SubContractors HS ON HS.SubContractorId = SC.Id
		WHERE 1=1`;

	if (params.insuredName)
		query += ` AND SC.Name LIKE '%${params.insuredName}%'`;
	if (params.holderId)
		query += ` AND HS.HiringClientId = ${params.holderId}`;

	console.log('generateInsuredsByHolderQuery: ', query);
	return query;
}

exports.generateInsuredHoldersDeleteQuery = (params) => {
	let query = `DELETE dbo.Hiringclients_SubContractors WHERE SubContractorId = ${params.insuredId}`;
	return query;
}

exports.generateAssociateInsuredToHolderQuery = (params) => {
	let query = `INSERT INTO dbo.Hiringclients_SubContractors (
		HiringClientId
		, SubContractorId
		, SubContractorStatusID
		, TimeStamp
	) VALUES (
		${params.holderId}
		, ${params.insuredId}
		, 4
		, getDate()
	)`;
	console.log('generateAssociateInsuredToHolderQuery: ', query);
	return query;
}