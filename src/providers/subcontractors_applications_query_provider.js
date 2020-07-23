exports.generateSCApplicationsQuery = (params) => {

	let query = `SELECT
		ApplicationID
		, AP.SubcontractorID
		, AP.HiringClientID
		, AP.[Timestamp]
		, AP.SubcontractorName
		, AP.Address
		, AP.City
		, AP.StateID
		, AP.ZipCode
		, AP.CountryID
		, AP.SubcontractorContactName
		, AP.SubcontractorContactPhone
		, AP.SubcontractorContactEmail
		, AP.SubcontractorTaxID
		, AP.HiringClientContactName
		, AP.HiringClientProject
		, AP.PreviousWorkedForHC
		, AP.GeneralComments
		, AP.PrimaryTrade
		, AP.Password
		, T.Description
		, HC_SC.FormID AS formId
		, AP.Password
	FROM dbo.Applications AP
	LEFT JOIN dbo.HiringClients_SubContractors HC_SC ON AP.SubcontractorID = HC_SC.SubcontractorID
	LEFT JOIN dbo.Trades T ON T.Id = AP.PrimaryTrade
	WHERE HC_SC.SubcontractorStatusID = 19 `;  // status: Applied

	if(params.hiringClientId)
		query += ` AND AP.HiringClientID = ${params.hiringClientId}`;

	if(params.scApplicationId)
		query += ` AND AP.ApplicationID = ${params.scApplicationId}`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;

		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	// if(params.pageSize && !params.getTotalCount) {
	// 	let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
	// 	query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	// }

	// console.log('QUERY', query);
	return query;
}

exports.generateSCApplicationsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Applications (
		SubcontractorID
		, HiringClientID
		, [Timestamp]
		, SubcontractorName
		, SubcontractorContactName
		, SubcontractorContactPhone
		, SubcontractorContactEmail
		, SubcontractorTaxID
		, HiringClientContactName
		, HiringClientProject
		, PreviousWorkedForHC
		, GeneralComments
		, PrimaryTrade
		, Address
		, City
		, StateID
		, ZipCode
		, CountryID
		, Password
	) VALUES (
		${params.scId}
		,${params.hcId}
		,getDate()
		,'${params.subcontractorName}'
		,'${params.subcontractorContactName}'
		,'${params.subcontractorContactPhone}'
		,'${params.subcontractorContactEmail}'
		,'${params.subcontractorTaxId}'
		,'${params.hiringClientContactName}'
		,'${params.hiringClientProject}'
		,${params.previousWorkedForHC || 0}
		,'${params.generalComments}'
		,${params.primaryTrade}
		,'${params.address}'
		,'${params.city}'
		,'${params.state}'
		,'${params.zipcode}'
		,${params.countryId}
		,'${params.passHashed}'
	)`;

	// console.log('QUERY', query);
	return query;
}

exports.generateSCApplicationsDeleteQuery = (params) => {

	let query = `DELETE dbo.Applications WHERE ApplicationID = ${params.scApplicationId}`;

	return query;
}

exports.generateCheckSCApplicationsQuery = (params) => {

	let query = `SELECT
		SC.Id AS SubcontractorId
		, HSC.HiringClientId
		FROM dbo.Subcontractors SC
		LEFT JOIN dbo.Hiringclients_SubContractors HSC
		ON HSC.SubContractorId = SC.Id
		WHERE 1=1`;

	if(params.subcontractorTaxId)
		query += ` AND SC.TaxId = '${params.subcontractorTaxId}'`;

	// console.log('QUERY', query);
	return query;
}

exports.generateGetHCConfigApplicationsQuery = (params) => {

	let query = `SELECT
		HC.AllowApplications
		, HC.AutoApproveApplications
		FROM dbo.Hiringclients HC
		WHERE 1=1`;

	if(params.hiringClientId)
		query += ` AND HC.Id = ${params.hiringClientId}`;

	// console.log('QUERY', query);
	return query;
}

exports.generateSCInsertQuery = (params) => {

	let query = `INSERT INTO dbo.SubContractors (
    Name
    , Address
    , City
    , State
    , ZipCode
    , MainEmail
    , TaxID
    , ContactFullName
		, ContactPhone
		, pqEnabled
	) VALUES (
    '${params.subcontractorName}'
    ,'${params.address}'
		,'${params.city}'
		,'${params.state}'
		,'${params.zipcode}'
    ,'${params.subcontractorContactEmail}'
    ,'${params.subcontractorTaxId}'
    ,'${params.subcontractorContactName}'
		,'${params.subcontractorContactPhone}'
		, 1
  )`;

	// console.log('QUERY', query);
	return query;
}

exports.generateSCHCInsertQuery = (params) => {
	// console.log("generateSCHCInsertQuery params =",params);

  const query = `
    DECLARE @exists INT;
    SELECT  @exists =   COUNT(*)
                        FROM    dbo.Hiringclients_SubContractors
	                      WHERE   HiringClientId  = ${params.hcId}
	                      AND     SubContractorId = ${params.scId}

    IF @exists = 0
	    BEGIN
		    INSERT INTO   dbo.Hiringclients_SubContractors (
                          HiringClientId
                        , SubContractorId
                        , SubcontractorStatusID
                        , TimeStamp
                        , FormID
                        ${params.hiringClientContactName ? `, HiringClientRequestorName` : ''}
												${params.hiringClientContactEmail ? `, HiringClientRequestorEmail` : ''}
												, TradeId
		                  ) VALUES (
                        ${params.hcId}
                        ,${params.scId}
                        ,${params.scStatusId}
                        ,getDate()
                        ,${params.formId}
                        ${params.hiringClientContactName ? `, '${params.hiringClientContactName}'` : ''}
												${params.hiringClientContactEmail ? `, '${params.hiringClientContactEmail}'` : ''}
												, ${params.primaryTrade}
                      )
	    END
	  ELSE
	    BEGIN
        UPDATE    dbo.Hiringclients_SubContractors
        SET       SubcontractorStatusID = ${params.scStatusId}
                , TimeStamp = getDate()
                ${params.hiringClientContactName ? `, HiringClientRequestorName = '${params.hiringClientContactName}'` : ''}
                ${params.hiringClientContactEmail ? `, HiringClientRequestorEmail = '${params.hiringClientContactEmail}'` : ''}
			  WHERE   HiringClientId = ${params.hcId}
			  AND     SubContractorId = ${params.scId}
	    END`;

	// console.log('generateSCHCInsertQuery = ', query);
	return query;
}



exports.generateSCApplicationsApproveQuery = (params) => {
	let status = 4; // Pending Submission
	// let applIDs = params.applIDs.join(',');
	// let query = `UPDATE Hiringclients_SubContractors SET subcontractorStatusID = ${status}, WFStepIndex = 1, wfIterationCount = 1, wfIterationTimeStamp = getDate()
	// 		WHERE HiringClientId = ${params.hcId} AND SubContractorId IN (
	// 			SELECT SubcontractorID FROM dbo.Applications WHERE ApplicationID in (${applIDs})
	// 		);`;
	let query = `UPDATE Hiringclients_SubContractors SET subcontractorStatusID = ${status}, WFStepIndex = 1, wfIterationCount = 1, wfIterationTimeStamp = getDate()
			WHERE HiringClientId = ${params.hcId} AND SubContractorId IN (
				SELECT SubcontractorID FROM dbo.Applications WHERE ApplicationID = ${params.applID}
			);`;

	// console.log('QUERY', query);
	return query;
}

exports.generateSCApplicationsDeclineQuery = (params) => {
	let status = 20; // Applied – Rejected
	let applIDs = params.applIDs.join(',');
	let query = `UPDATE Hiringclients_SubContractors SET subcontractorStatusID = ${status}
			WHERE HiringClientId = ${params.hcId} AND SubContractorId IN (
				SELECT SubcontractorID FROM dbo.Applications WHERE ApplicationID in (${applIDs})
			);`;

	// console.log('QUERY', query);
	return query;
}

exports.generateCheckHCQuery = (params) => {

	let query = `SELECT Id, AllowApplications FROM dbo.HiringClients WHERE RegistrationUrl = '${params.registrationUrl}'`;
	// console.log('QUERY', query);
	return query;
}



exports.generateCheckUserApplicationsQuery = (params) => {

	let query = `SELECT
		U.Id AS UserId
		,USC.SubContractorId AS SubContractorId
		FROM dbo.Users U
		LEFT JOIN dbo.Users_SubContractors USC
		ON USC.SubContractorId = U.Id
		WHERE U.Mail = '${params.subcontractorContactEmail}'`;

	// console.log('QUERY', query);
	return query;
}


exports.generateUserSCInsertQuery = (params) => {
	// console.log("params", params);
	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.Users_SubContractors
	WHERE UserId = ${params.userId}
	AND SubContractorId = ${params.scId}
	IF @exists = 0
	BEGIN
		INSERT INTO dbo.Users_SubContractors (
			UserId
			, SubContractorId
			, TimeStamp
			, IsContact
		) VALUES (
			${params.userId}
			,${params.scId}
			,getDate()
			,1
		)
	END
	ELSE
	BEGIN
		UPDATE dbo.Users_SubContractors SET
			IsContact = 1
			, TimeStamp = getDate()
			WHERE UserId = ${params.userId}
			AND SubContractorId = ${params.scId}
	END`;

	// console.log('QUERY', query);
	return query;
}


exports.generateUserInsertQuery = (params) => {
	let RoleId = 4; // Subcontractor
	let FirstName = params.subcontractorContactName.split(" ")[0];
	let LastName = params.subcontractorContactName.split(" ")[1];
	let query = `
              INSERT INTO   Users (
                              FirstName,
                              LastName,
                              Mail,
                              RoleId,
                              IsEnabled,
                              Password,
                              Phone,
                              MustUpdateProfile
                            ) VALUES (
                              '${FirstName}',
                              '${LastName}',
                              '${params.subcontractorContactEmail}',
                              ${RoleId},
                              1,
                              '${params.passHashed}',
                              '${params.subcontractorContactPhone}',
                              1
                            )`;

	// console.log('QUERY', query);
	return query;
}


exports.generateInsertSavedFormQuery = function(params) {
	// console.log('params', params);
	let turnOverRateId = 3;

	var query = `INSERT INTO SavedForms (FormId,UserId,SubcontractorID,HiringClientId,IsComplete,TurnOverRateId)
	VALUES (
		'${params.formId}',
		'${params.userId}',
		'${params.subcontractorId}',
		'${params.hiringClientId}',
		0,
		'${turnOverRateId}'
	)`;
	// console.log("QUERY", query);
	return query;
}