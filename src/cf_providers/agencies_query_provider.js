exports.generateAgenciesQuery = (params) => {
	
	let query = `SELECT 
		*,
		CONCAT(Name,', ', City,', ', State) AS AgencyData
		FROM dbo.Agencies 
		WHERE 1=1`;
 	
	if(params.agencyId)
		query += ` AND AgencyId = ${params.agencyId}`;
	if(params.name)
    query += ` AND Name LIKE '%${params.name}%'`;
  if(params.city)
		query += ` AND City LIKE '%${params.city}%'`;
	if(params.state)
		query += ` AND State LIKE '%${params.state}%'`;
	if(params.zipCode)
		query += ` AND ZipCode LIKE '%${params.zipCode}%'`;	
	
	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateAgenciesQuery: ', query);
	return query;
}

exports.generateAgenciesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Agencies (
    Name
    , City
		, State
		, ZipCode
		, MainPhone
		, FaxNumber
		, MainEmail
		, Address
		, Country
	) VALUES (
    '${params.name}'
		,'${params.city}'
		,'${params.state}'
		,'${params.zipCode}'
		,'${params.mainPhone}'
		,'${params.faxNumber}'
		,'${params.mainEmail}'
		,'${params.address}'
		,'${params.country}'
	)`;
	
  //console.log(query)
	return query;
}

exports.generateAgenciesUpdateQuery = (params) => {

	let query = `UPDATE dbo.Agencies SET `;
	  
  if(params.name)
		query += `Name = '${params.name}',`;

	if(params.city)
    query += `City = '${params.city}',`;
    
	if(params.state)
		query += `State = '${params.state}',`;

	if(params.zipCode)
		query += `ZipCode = '${params.zipCode}',`;
	
	if(params.mainPhone)
		query += `MainPhone = '${params.mainPhone}',`;
	
	if(params.faxNumber)
		query += `FaxNumber = '${params.faxNumber}',`;
	
	if(params.mainEmail)
		query += `MainEmail = '${params.mainEmail}',`;

	if(params.address)
		query += `Address = '${params.address}',`;
	
	if(params.country)
		query += `Country = '${params.country}',`;

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE AgencyId = ${params.agencyId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateAgenciesDeleteQuery = (params) => {

	let query = `DELETE dbo.Agencies WHERE AgencyId = ${params.agencyId}`;
	//console.log(query)
	return query;
}

exports.generateInsuredAgenciesQuery = (params) => {	
	let query = `SELECT 
		A.AgencyId,
		A.Name,
		A.City,
		A.State,
		A.ZipCode,
		A.MainPhone,
		A.MainEmail,
		A.Address,
		A.Country,
		STRING_AGG(CAST(CT.[Code] AS NVARCHAR(MAX)), ',') WITHIN GROUP (ORDER BY CT.Code) AS CoverageAbbreviation,
		STRING_AGG(CAST(CONCAT_WS(' ', AG.FirstName, AG.LastName) AS NVARCHAR(MAX)), ',') AS AgentNames
	FROM dbo.Agencies A
	INNER JOIN dbo.CertificateOfInsurance CI ON CI.AgencyId = A.AgencyId
	INNER JOIN dbo.Coverages C ON C.CertificateID = CI.CertificateId
	INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = C.CoverageTypeID
	INNER JOIN dbo.ProjectInsureds_Coverages PIC ON PIC.CoverageID = C.CoverageID
	INNER JOIN dbo.ProjectsInsureds P ON P.ProjectInsuredID = PIC.ProjectInsuredID
	LEFT JOIN dbo.Agents AG ON AG.AgencyId = A.AgencyId AND AG.AgentID = CI.AgentId 
	WHERE 1=1`;
 	
	if(params.agencyId)
		query += ` AND A.AgencyId = ${params.agencyId}`;
	if(params.name)
    query += ` AND A.Name LIKE '%${params.name}%'`;
  if(params.city)
		query += ` AND A.City LIKE '%${params.city}%'`;
	if(params.state)
		query += ` AND A.State LIKE '%${params.state}%'`;
	if(params.zipCode)
		query += ` AND A.ZipCode LIKE '%${params.zipCode}%'`;	
	if(params.insuredId)
		query += ` AND P.InsuredID = ${params.insuredId}`;	
		
	query += ` GROUP BY
		A.AgencyId,
		A.Name,
		A.City,
		A.State,
		A.ZipCode,
		A.MainPhone,
		A.MainEmail,
		A.Address,
		A.Country`;
	
	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateInsuredAgenciesQuery: ', query);
	return query;
}