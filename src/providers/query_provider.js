
exports.generateFormsQuery = function (params) {
	let whereClause = null;
	let orderClause = null;

	if (params.formId) {
		let formId = params.formId;

		whereClause = ` WHERE F.Id = ${formId} AND U.Id = F.CreatorUserId `;
	}
	else if (params.userId) {
		let userId = params.userId;

		whereClause = ` WHERE F.UserID = ${userId} AND U.Id = F.CreatorUserId `;
	}
	else if (params.formCreatorId) {
		let formCreatorId = params.formCreatorId;
		whereClause = ` WHERE F.CreatorUserId = ${formCreatorId} AND U.Id = F.CreatorUserId `;
	}
	else if (params.searchTerm) {
		let searchTerm = params.searchTerm;

		whereClause = ` WHERE (U.FirstName LIKE '%${searchTerm}%' OR U.LastName LIKE '%${searchTerm}%' OR F.Name LIKE '%${searchTerm}%') AND U.Id = F.CreatorUserId `;
	}
	else {
		whereClause = ` WHERE U.Id = F.CreatorUserId `;
	}

	if (params.searchByCreator) {
		whereClause += ` AND F.CreatorUserId =  ${params.searchByCreator} `;
	}

	if (params.searchBySentTo) {
		whereClause += ` AND F.Id in ((SELECT FormId FROM SavedForms WHERE SubContractorId = ${params.searchBySentTo})) `;
	}

	if (params.justFormData != 'true') {
		whereClause += ` AND F.Id = FS.FormId `;
	}

	if (params.hiringClientId) {
		whereClause += ` AND F.hiringClientId = ${params.hiringClientId} `;
	}

	let query = `SELECT F.Id F_Id, F.Name F_Name, F.Description F_Description, F.DateCreated F_DateCreated, F.SubcontractorFee F_SubcontractorFee,
				F.AccountDisplayTypeId F_AccountDisplayTypeId, U.FirstName U_FirstName, U.LastName U_LastName, F.IsComplete F_IsComplete,
				 U.FirstName + ' ' + U.LastName creatorFullName, F.HiringClientId F_HiringClientId,
				 (select STRING_AGG (DAF.DiscreteAccountsId, ',') from DiscreteAccounts_Forms DAF  where DAF.FormId= F.Id ) as selected`;


	if (params.justFormData != 'true') {
		query += ` ,FS.Id FS_ID, FS.InternalName FS_InternalName, FS.Title FS_Title, FS.PositionIndex FS_PositionIndex,
				FSF.Id FSF_Id, FSF.InternalName FSF_InternalName, FSF.TypeId FFT_Id, FSF.ReferenceId FFT_ReferenceId, FSF.Caption FFT_Caption,
				FSF.ControlGroup FFT_ControlGroup, FSF.TriggerFieldName FFT_TriggerFieldName, FSF.IsConditional FFT_IsConditional,
				FSF.UrlTitle FFT_UrlTitle, FSF.UrlTarget FFT_UrlTarget,
				(SELECT FFT.NAME FROM FormFieldsTypes FFT WHERE FFT.ID = FSF.TypeId) FFT_Name,
				FSF.ColumnPos FSF_ColumnPos, FSF.RowPos FSF_RowPos, FSF.FieldLength FSF_FieldLength, FSF.ValueLength FSF_ValueLength,
				FSF.MinValue FSF_MinValue, FSF.MaxValue FSF_MaxValue, FSF.IsMandatory FSF_IsMandatory,
				FSF.HasBorder FSF_HasBorder,FSF.RowsCount FSF_RowsCount, FSF.DefaultValue FSF_DefaultValue `;
	}

	query += ` FROM Forms F, Users U `

	if (params.justFormData != 'true') {
		query += `, FormsSections FS LEFT JOIN FormsSectionsFields FSF ON FS.Id = FSF.FormSectionId `;
	}

	orderClause = ` ORDER BY F.Name ASC `;

	if (params.orderBy) {
		orderClause = ` ORDER BY ${params.orderBy}`;
		if (params.orderDirection) {
			orderClause += ` ${params.orderDirection}`;
		}

	}

	orderClause += `, F.Id ASC`

	if (params.justFormData != 'true') {
		orderClause += `, FS.PositionIndex ASC`
	}

	query += whereClause;
	query += orderClause;
	console.log('generateFormsQuery', query);
	return query;
}

exports.generateFormsFieldListQuery = function (referenceId) {
	return `SELECT query FROM FormFieldsLists WHERE id = ${referenceId} ORDER BY name`;
}

exports.generateFormFieldsListsQuery = function () {
	return `SELECT id, name, query FROM FormFieldsLists ORDER BY name`;
}

exports.generateScorecardsSourcesListQuery = function () {
	return `SELECT id, name FROM ScorecardsSources ORDER BY name`;
}

exports.generateCompaniesTypesListQuery = function () {
	return `SELECT id, name FROM CompaniesTypes ORDER BY name`;
}

exports.generateTurnOverRatesListQuery = function () {
	return `SELECT id, name FROM TurnOverRates ORDER BY name`;
}

exports.generateSavedFormsFieldsValuesQuery = function (params) {
	const query = `SELECT  sfv.id,
        sfv.savedFormId,
        sfv.formSectionFieldId,
        sfv.value,
        CASE
            WHEN fsf.typeId = 8 THEN 1
            ELSE 0
        END AS hasLink,
        (SELECT top  1 f.id FROM Files f WHERE f.payLoadId = sfv.SavedFormId AND sfv.value = f.name order by id desc) as fileId,
        (SELECT top  1 f.subcontractorId FROM Files f WHERE f.payLoadId = sfv.SavedFormId AND sfv.value = f.name order by id desc) as subcontractorId
FROM    SavedFormFieldsValues sfv, FormsSectionsFields fsf
WHERE   sfv.SavedFormId = ${params.savedFormId}
AND     sfv.formSectionFieldId = fsf.id `;

	// console.log('+' + '-'.repeat(20))
	// console.log('query = ', query)

	// console.log('+' + '-'.repeat(20))


	return query;
}

exports.generateGetFormsUsersQuery = function () {
	return `SELECT DISTINCT F.CreatorUserId, U.FirstName + ' ' + U.LastName FormCreator, R.Name RoleName
				FROM Forms F, Users U, Roles R
				WHERE U.Id = F.CreatorUserId AND R.Id = U.RoleId
				ORDER BY FormCreator ASC `;
}

exports.generateGetFormsSCSentToQuery = function () {
	return `SELECT DISTINCT Id, Name FROM SubContractors WHERE Id in
			(SELECT DISTINCT SubContractorId FROM SavedForms WHERE FormId in
			    (SELECT ID FROM Forms))
			ORDER By Name ASC `;
}

exports.generateValidateSavedFormQuery = function (params) {
	let query = `SELECT COUNT(*) found  FROM SavedForms
				 WHERE Id = ${params.savedFormId} AND
				 FormId = ${params.formId} AND
				 SubcontractorID = ${params.subcontractorId} `;

	if (params.hiringClientId) {
		query += ` AND hiringClientId = ${params.hiringClientId} `;
	}

	return query;
}

exports.generateFormCreatorsListQuery = function () {
	const query = ` SELECT  DISTINCT f.creatorUserId,
        		(SELECT firstName + ' ' + lastName FROM Users WHERE id = f.creatorUserId) creatorUserName
				FROM    SavedForms s,
        				Forms f
				WHERE   f.id = s.formId
				ORDER BY creatorUserName `;

	return query;
}

exports.generateSubmissionsSubcontractorsQuery = function () {
	const query = ` SELECT  DISTINCT s.subContractorId,
			        sc.name subContractorName
					FROM    SavedForms s,
					        SubContractors sc
					WHERE   sc.id = s.subContractorId
					ORDER BY subContractorName `;

	return query;
}

exports.generateSavedFormsQuery = function (params) {
	let query = `SELECT  s.id,
        s.formId,
        f.name formName,
        s.userId submitterUserId,
        u.firstName + ' ' + u.lastName submitterUserName,
        s.subcontractorID,
        sc.name subcontractorName,
        s.hiringClientId,
        hc.name hiringClientName,
        CASE
            WHEN s.isComplete = 1 THEN 'Complete'
            ELSE 'Incomplete'
        END status,
        s.timeStamp submissionDate `;

	if (params.getTotalCount == true) {
		query = ` SELECT COUNT(*) totalCount `;
	}

	query +=
		`FROM    SavedForms s,
		        Forms f,
		        Users u,
		        HiringClients hc,
		        SubContractors sc
		WHERE   f.id = s.formId
		AND     u.id = s.userId
		AND     hc.id = s.hiringClientId
		AND     sc.id = s.subcontractorID `;

	// Filters
	if (params.subcontractorId) {
		query += ` AND     s.subcontractorId = ${params.subcontractorId} `;
	}

	if (params.formId) {
		query += ` AND     s.formId = ${params.formId} `;
	}

	if (params.hiringClientId) {
		query += ` AND     s.hiringClientId = ${params.hiringClientId} `;
	}

	if (params.creatorUserId) {
		query += ` AND     f.creatorUserId = ${params.creatorUserId} `;
	}

	if (params.savedFormId) {
		query += ` AND     s.id = ${params.savedFormId} `;
	}

	if (params.searchTerm) {
		query += ` AND     f.name like '%${params.searchTerm}%' `;
	}


	if (params.getTotalCount == false) {
		if (params.orderBy) {
			query += ` ORDER BY ${params.orderBy} `;
			if (params.orderDirection) {
				query += ` ${params.orderDirection} `;
			}
		}
		else {
			query += ` ORDER BY id ASC `;
		}
	}

	if (params.pageSize && params.getTotalCount == false) {
		query += ` OFFSET ${params.pageSize} * (${params.pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	// console.log('F0RM5 '.repeat(100))
	// console.log('params = ', params);
	// console.log(query);
	// console.log('F0RM5 '.repeat(100))

	console.log('generateSavedFormsQuery', query);
	return query;
}

exports.generateSavedFormsDatesQuery = function (params) {
	let query = `SELECT id, timestamp dateOfSubmission
							 FROM SavedForms
							 WHERE hiringClientId = ${params.hiringClientId}
							 AND subContractorId = ${params.subcontractorId}
							 ORDER BY timestamp DESC `;

	return query;
}

exports.generateSavedFormsDatesPrequalQuery = function (params) {
	let query = `SELECT id, dateOfPrequal
                            FROM SavedForms
                            WHERE hiringClientId = ${params.hiringClientId}
                            AND subContractorId = ${params.subcontractorId}
                            ORDER BY timestamp DESC `;

	return query;
}

exports.generateSavedFormInsertQuery = function (queryParams) {
	let query = `INSERT INTO SavedForms (FormId, UserId, SubcontractorID, HiringClientId)
		VALUES (${queryParams.formId}, ${queryParams.userId}, ${queryParams.subContractorId}, ${queryParams.hiringClientId})`;

	return query;
}

exports.generateSavedFormUpdateQuery = function (queryParams) {
	let query = `UPDATE SavedForms SET`;

	if (queryParams.isComplete) {
		let isComplete = (queryParams.isComplete == 'true') ? 1 : 0;
		query += ` IsComplete = ${isComplete},`
	}

	// Remove last comma
	query = query.slice(0, -1);

	query += ` WHERE Id = ${queryParams.savedFormId};`;
	if (queryParams.isComplete) {
		let isComplete = (queryParams.isComplete == 'true') ? 1 : 0;
		if (isComplete == 1) {
			query += ` DECLARE  @subcontractorId int;
				DECLARE  @hiringClientId int;
				SELECT  @subcontractorId = subcontractorId FROM SavedForms WHERE id = ${queryParams.savedFormId}
				SELECT  @hiringClientId = hiringClientId FROM SavedForms WHERE id = ${queryParams.savedFormId}
				UPDATE  Hiringclients_SubContractors SET SubcontractorStatusId = 5, WFStepIndex = 1, wfIterationCount = 0, wfIterationTimeStamp = getDate()
				WHERE   hiringClientid = @hiringClientId
				AND     subContractorId = @subcontractorId;

				UPDATE Tasks
				SET usedTask = 1
				WHERE subContractorId = @subcontractorId
					AND (HiringClientId = @hiringClientId OR HiringClientId IS NULL)
					AND wfStepIndex IS NOT NULL
					AND WorkflowTypeId IS NOT NULL
					AND isWaitingTask = 1
					AND usedTask = 0;

				EXEC spCovidCheckUpdateStatus ${queryParams.savedFormId}`; // Check if #covid19# field is on the form, if so set the SC status to Pending Covid-19 Update
		}
	}

	return query;
}

exports.generateInsertSavedFormFieldValuesQuery = function (params) {
	var query = `INSERT INTO SavedFormFieldsValues (SavedFormId, FormSectionFieldId, Value)
	VALUES`;
	for (let newValue of params) {
		query += ` (
		'${newValue.savedFormId}',
		'${newValue.formSectionFieldId}',
		'${newValue.savedValue}'
		),`;
	}

	// Remove last comma
	query = query.slice(0, -1);

	return query;
}

exports.generateSavedFormsFieldsValuesUpdateQuery = function (params) {
	let query = ``;
	for (let changedValue of params) {
		query += ` UPDATE SavedFormFieldsValues SET Value = '${changedValue.value}' WHERE Id = ${changedValue.id} `;
	}

	return query;
}

exports.generateSelectSavedFormFieldValuesQuery = function (params) {
	var query = `SELECT * FROM SavedFormFieldsValues
    WHERE SavedFormId = '${params.formId}'`;

	return query;
}

exports.generateFormInsertQuery = function (params) {
	let query = ``;

	if (params.id) {
		query = `UPDATE Forms SET`
		if (params.name)
			query += ` Name = '${params.name}',`;

		if (params.description)
			query += ` Description = '${params.description}',`;

		if (params.userId)
			query += ` UserId = ${params.userId},`;

		if (params.creatorUserId)
			query += ` CreatorUserId = ${params.creatorUserId},`;

		if (params.hiringClientId)
			query += ` HiringClientId = ${params.hiringClientId},`;

		if (params.isComplete)
			query += ` IsComplete = ${params.isComplete},`

		if (params.SubcontractorFee)
			query += ` SubcontractorFee = ${params.SubcontractorFee},`;

		query = query.slice(0, -1);

		query += ` WHERE Id = ${params.id}`;
	}
	else {
		query = `INSERT INTO Forms (Name`;
		if (params.description)
			query += `, Description`;
		if (params.userId)
			query += `, UserID`;
		if (params.creatorUserId)
			query += `, CreatorUserId`;
		if (params.hiringClientId)
			query += `, hiringClientId`;
		if (params.isComplete)
			query += `, isComplete`;
		if (params.SubcontractorFee)
			query += `, SubcontractorFee`;

		query += `)	VALUES (`;
		query += `'${params.name}'`;
		if (params.description)
			query += `, '${params.description}'`;
		if (params.userId)
			query += `, ${params.userId}`;
		if (params.creatorUserId)
			query += `, ${params.creatorUserId}`;
		if (params.hiringClientId)
			query += `, ${params.hiringClientId}`;
		if (params.isComplete)
			query += `, ${params.isComplete}`;
		if (params.SubcontractorFee)
			query += `, ${params.SubcontractorFee}`;

		query += `)`
	}
	console.log('query', query);
	return query;
}

exports.generateHC_UnlinkedUserQuery = function (params) {
	return `
		SELECT Id, UserFullName FROM
		(
			SELECT Id, FirstName + ' ' + LastName UserFullName
			FROM Users WHERE Id IN
			(select userId from Users_HiringClients WHERE HiringClientId in
			(select ParentHiringClientId from HiringClients where Id = ${params.hiringClientId}))
			UNION
			SELECT Id, FirstName + ' ' + LastName UserFullName
			FROM Users WHERE Id NOT IN
			(select userId from Users_HiringClients)
		) U
		ORDER BY UserFullName `;
}

exports.generateHCUpdateQuery = function (params) {
	let query = `
	DECLARE @baseHCUrl VARCHAR(200);
	SELECT @baseHCUrl = value FROM GlobalParameters WHERE id = 1;

	UPDATE HiringClients SET `;

	if (params.name)
		query += ` name = '${params.name}'`;

	if (params.parentHiringClientId)
		query += `, parentHiringClientId = ${params.parentHiringClientId}`;

	if (params.subdomain)
		query += `, registrationUrl = '${params.subdomain}' + @baseHCUrl`;

	if (params.country)
		query += `, country = '${params.country}'`;

	if (params.phone)
		query += `, phone = '${params.phone}'`;

	if (params.phone2)
		query += `, phone2 = '${params.phone2}'`;

	if (params.fax)
		query += `, fax = '${params.fax}'`;

	if (params.address1)
		query += `, address1 = '${params.address1}'`;

	if (params.address2)
		query += `, address2 = '${params.address2}'`;

	if (params.city)
		query += `, city = '${params.city}'`;

	if (params.state)
		query += `, state = '${params.state}'`;

	if (params.zipCode)
		query += `, zipCode = '${params.zipCode}'`;

	query += `, AllowApplications = ${params.allowApplications}`;
	query += `, AutoApproveApplications = ${params.autoApproveApplications}`;

	query += ` WHERE id = ${params.hiringClientId}`;

	console.log(query);

	return query;
}

exports.generateHCInsertQuery = function (params) {
	let query = `
	DECLARE @baseHCUrl VARCHAR(200);
	DECLARE @lastIdentity INT;
	SELECT @baseHCUrl = value FROM GlobalParameters WHERE id = 1;

	INSERT INTO HiringClients (`

	query += `Name`;

	if (params.parentHiringClientId)
		query += `, parentHiringClientId`;
	if (params.subdomain)
		query += `, registrationUrl`;
	if (params.country)
		query += `, country`;
	if (params.phone)
		query += `, phone`;
	if (params.phone2)
		query += `, phone2`;
	if (params.fax)
		query += `, fax`;
	if (params.address1)
		query += `, address1`;
	if (params.address2)
		query += `, address2`;
	if (params.city)
		query += `, city`;
	if (params.state)
		query += `, state`;
	if (params.zipCode)
		query += `, zipCode`;

	query += `) VALUES (`;

	query += `'${params.name}'`;

	if (params.parentHiringClientId)
		query += `, ${params.parentHiringClientId}`;
	if (params.subdomain)
		query += `, '${params.subdomain}' + @baseHCUrl`;
	if (params.country)
		query += `, '${params.country}'`;
	if (params.phone)
		query += `, '${params.phone}'`;
	if (params.phone2)
		query += `, '${params.phone2}'`;
	if (params.fax)
		query += `, '${params.fax}'`;
	if (params.address1)
		query += `, '${params.address1}'`;
	if (params.address2)
		query += `, '${params.address2}'`;
	if (params.city)
		query += `, '${params.city}'`;
	if (params.state)
		query += `, '${params.state}'`;
	if (params.zipCode)
		query += `, '${params.zipCode}'`;

	query += `);
			  SET @lastIdentity = (SELECT IDENT_CURRENT('HiringClients'));
			  INSERT INTO HiringClient_EnabledSystems VALUES (@lastIdentity, 0, 1);`;
	return query;
}

exports.generateFormsDeleteQuery = function (params) {
	let id = params.id;

	let query = `DELETE FormsSectionsFields WHERE FormSectionId in`;
	query += `(SELECT Id FROM FormsSections WHERE FormId = ${id});`;
	query += `DELETE FormsSections WHERE FormId = ${id};`;
	query += `DELETE Forms WHERE Id = ${id};`;

	return query;
}

exports.generateFormsSectionsDeleteQuery = function (params) {
	let query = `DELETE FormsSectionsFields WHERE FormSectionId = ${params.id};`;
	query += `DELETE FormsSections WHERE Id = ${params.id};`;

	return query;
}

exports.generateFormsSectionsFieldsDeleteQuery = function (params) {
	let id = params.id;

	let query = `DELETE FormsSectionsFields WHERE ID =${id}`;

	return query;
}

exports.generateFormsSectionsInsertQuery = function (params) {

	let id = params.id;
	let formId = params.formId;
	let sectionTitle = params.sectionTitle;
	let sectionPositionIndex = params.sectionPositionIndex;
	let sectionInternalName = params.sectionInternalName;

	if (!sectionInternalName) {
		sectionInternalName = 'Frm' + formId + '_Sec' + sectionPositionIndex;
	}

	let query = ``;

	if (id) {
		query = `UPDATE FormsSections SET`
		if (formId)
			query += ` FormId = '${formId}',`;

		if (sectionTitle)
			query += ` Title = '${sectionTitle}',`;

		if (sectionPositionIndex)
			query += ` PositionIndex = ${sectionPositionIndex},`;

		if (sectionInternalName)
			query += ` InternalName = '${sectionInternalName}',`;

		query = query.slice(0, -1);

		query += ` WHERE Id = ${params.id}`;
	}
	else {
		query = `INSERT INTO FormsSections (FormId, InternalName, Title, PositionIndex)
		VALUES `;

		query += `(${formId}, '${sectionInternalName}', '${sectionTitle}', ${sectionPositionIndex})`;
	}


	return query;
}

exports.generateFormsSectionsFieldsInsertQuery = function (params) {
	let id = params.id;
	let formSectionId = params.formSectionId;
	let internalName = params.internalName;
	let typeId = params.typeId;
	let defaultValue = params.defaultValue;
	let columnPos = params.columnPos;
	let rowPos = params.rowPos;
	let fieldLength = params.fieldLength;
	let valueLength = params.valueLength;
	let maxValue = params.maxValue;
	let minValue = params.minValue;
	let isMandatory = params.isMandatory;
	let rowsCount = params.rowsCount;
	let hasBorder = params.hasBorder;
	let referenceId = params.referenceId;
	let caption = params.caption;
	let controlGroup = params.controlGroup;
	let isConditional = params.isConditional;
	let triggerFieldName = params.triggerFieldName;
	let urlTitle = params.urlTitle;
	let urlTarget = params.urlTarget;

	let query = ``;

	if (id) {
		query = `UPDATE FormsSectionsFields SET`

		if (internalName)
			query += ` InternalName = '${internalName}',`;

		if (defaultValue)
			query += ` DefaultValue = '${defaultValue}',`;

		if (columnPos)
			query += ` ColumnPos = '${columnPos}',`;

		if (rowPos)
			query += ` RowPos = '${rowPos}',`;

		if (fieldLength)
			query += ` fieldLength = '${fieldLength}',`;

		if (valueLength)
			query += ` ValueLength = '${valueLength}',`;

		if (maxValue)
			query += ` MaxValue = '${maxValue}',`;

		if (minValue)
			query += ` MinValue = '${minValue}',`;

		if (isMandatory)
			query += ` IsMandatory = '${isMandatory}',`;

		if (rowsCount)
			query += ` RowsCount = '${rowsCount}',`;

		if (hasBorder)
			query += ` HasBorder = '${hasBorder}',`;

		if (referenceId)
			query += ` ReferenceId = '${referenceId}',`;

		if (caption)
			query += ` Caption = '${caption}',`;

		if (controlGroup)
			query += ` ControlGroup = '${controlGroup}',`;

		if (isConditional)
			query += ` IsConditional = '${isConditional}',`;

		if (triggerFieldName)
			query += ` TriggerFieldName = '${triggerFieldName}',`;

		if (urlTitle)
			query += ` UrlTitle = '${urlTitle}',`;

		if (urlTarget)
			query += ` UrlTarget = '${urlTarget}',`;

		query = query.slice(0, -1);

		query += ` WHERE Id = ${params.id}`;
	}
	else {
		query = `INSERT INTO FormsSectionsFields (FormSectionId, InternalName, TypeId`
		if (defaultValue)
			query += `, DefaultValue`;

		if (columnPos)
			query += `, ColumnPos`;

		if (rowPos)
			query += `, RowPos`;

		if (fieldLength)
			query += `, FieldLength`;

		if (valueLength)
			query += `, ValueLength`;

		if (maxValue)
			query += `, MaxValue`;

		if (minValue)
			query += `, MinValue`;

		if (isMandatory)
			query += `, IsMandatory`;

		if (rowsCount)
			query += `, RowsCount`;

		if (hasBorder)
			query += `, HasBorder`;

		if (referenceId)
			query += `, ReferenceId`;

		if (caption)
			query += `, Caption`;

		if (controlGroup)
			query += `, ControlGroup`;

		if (isConditional)
			query += `, IsConditional`;

		if (triggerFieldName)
			query += `, TriggerFieldName`;

		if (urlTitle)
			query += `, UrlTitle`;

		if (urlTarget)
			query += `, UrlTarget`;

		query += `) VALUES (${formSectionId}, '${internalName}', ${typeId}`;

		if (defaultValue)
			query += `, '${defaultValue}'`;

		if (columnPos)
			query += `, ${columnPos}`;

		if (rowPos)
			query += `, ${rowPos}`;

		if (fieldLength)
			query += `, ${fieldLength}`;

		if (valueLength)
			query += `, ${valueLength}`;

		if (maxValue)
			query += `, ${maxValue}`;

		if (minValue)
			query += `, ${minValue}`;

		if (isMandatory)
			query += `, ${isMandatory}`;

		if (rowsCount)
			query += `, ${rowsCount}`;

		if (hasBorder)
			query += `, ${hasBorder}`;

		if (referenceId)
			query += `, ${referenceId}`;

		if (caption)
			query += `, '${caption}'`;

		if (controlGroup)
			query += `, '${controlGroup}'`;

		if (isConditional)
			query += `, '${isConditional}'`;

		if (triggerFieldName)
			query += `, '${triggerFieldName}'`;

		if (urlTitle)
			query += `, '${urlTitle}'`;

		if (urlTarget)
			query += `, '${urlTarget}'`;

		query += `) `;
	}

	// console.log(query);

	return query;
}

exports.generateUpdateHCnameQuery = function (queryParams) {
	const {
		hcId,
		newHCname
	} = queryParams
	const query = ` UPDATE	HiringClients
                  SET		  Name = '${newHCname}'
                  WHERE	  Id = ${hcId}`
	return query;
}

// exports.generateHiringClientSummaryQuery = function(hiringClientId, subcontractorId) {
//   const query = ` SELECT  h.name,
//                           h.subcontractorFee,
//                           s.name scName
//                   FROM	  HiringClients h, SubContractors s
//                   WHERE	  h.Id = ${hiringClientId}
//                   AND		  s.Id = ${subcontractorId}`
// 	return query
// }

exports.generateHiringClientSummaryWithFormFeesQuery = function (hiringClientId, subcontractorId) {
	const query = ` SELECT  h.name,
                          f.subcontractorFee,
													s.name scName
									FROM	  HiringClients h
									LEFT JOIN  Hiringclients_SubContractors sc ON h.id = sc.hiringclientId
									LEFT JOIN SubContractors s ON s.id = sc.subcontractorId
									LEFT JOIN Forms f ON f.id = sc.FormId
                  WHERE	  h.Id = ${hiringClientId}
                  AND		  s.Id = ${subcontractorId}`
	return query
}

exports.generateHiringClientDetailQuery = function (params) {
	let query = `SELECT
									HC.id,
									HC.name,
									HC.parentHiringClientId,
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
					    		HC.subcontractFeeRegMsg,
					    		HC.subcontractFeeRenewMsg,
									HC.timeStamp,
									HC.CFHolderStatusId,
									HC.CFSourceHolderNumber,
									HC.CFAccountManagerId,
									HC.CFPortalURL,
									HC.AllowApplications,
									HC.AutoApproveApplications,
									(SELECT firstName + ' ' + lastName FROM Users WHERE id = HC.CFAccountManagerId) CFAccountManagerName,
									(SELECT value FROM GlobalParameters WHERE id = 1) baseHCUrl,
					    		(SELECT name FROM HiringClients WHERE id = HC.parentHiringClientId) parentName  `;
	// HC.subcontractorFee,

	if (params.subcontractorId)
		query += ` ,(SELECT name FROM SubContractors WHERE id = ${subcontractorId}) scName, `;

	if (params.hiringClientId) {
		query += ` 	,(SELECT REPLACE(HC.registrationUrl,(SELECT value FROM GlobalParameters WHERE id = 1),'')) subdomain,
						(SELECT TOP 1 id FROM Users WHERE id IN
							(SELECT top 1 userId FROM Users_HiringClients WHERE HiringClientId = ${params.hiringClientId} AND isContact = 1)
							) contactId `;

		query += `, (SELECT TOP 1 firstName + ' ' + lastName FROM Users WHERE id in
									(SELECT TOP 1 userId FROM Users_HiringClients WHERE hiringClientId = ${params.hiringClientId} AND isContact = 1)
								) contactName`;
	}

	query += ` FROM HiringClients HC `;

	if (params.hiringClientName) {
		query += `WHERE HC.Name = '${params.hiringClientName}'`;
	}
	else {
		if (params.hiringClientId)
			query += `WHERE HC.Id = ${params.hiringClientId}`;
	}
	// console.log('QUERY', query);
	return query;
}

exports.generateHiringClientsForSCQuery = function (params) {
	let query = ` SELECT
	    HC.id,
	    HC.name,
	    HC.registrationUrl,
	    HC.country,
	    HC.phone,
	    HC.state,
		IsNull( (select top 1 firstName + ' ' + lastname
			from users where id in
			(select userId from Users_HiringClients where hiringClientId = HC.Id AND isContact = 1)), '' ) contactName
	FROM HiringClients HC
	WHERE ${params.userId} IN (SELECT userId FROM Users_SubContractors WHERE subcontractorId = ${params.subcontractorId})
	AND HC.id IN (SELECT hiringClientId FROM Hiringclients_SubContractors WHERE subcontractorID = ${params.subcontractorId})`;

	let orderClause = ' ';

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

	if (orderClause) {
		query += orderClause
	}

	if (params.pagination && params.getTotalCount == false) {
		let pageSize = params.pagination.pageSize
		let pageNumber = params.pagination.pageNumber
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	// console.log(query);

	return query;
}

exports.generateHiringClientsQuery = function (params) {
	let whereClause = null;
	let fromClause = null;
	let orderClause = null;

	let query = `SELECT  DISTINCT
						HC.id,
		        HC.name,
		        HC.registrationUrl,
		        HC.country,
		        HC.phone,
						HC.state,
						HC.AllowApplications,
						HC.AutoApproveApplications,
						(SELECT Name FROM HiringClients WHERE id = HC.ParentHiringClientId) AS ParentHiringClient,
						IsNull( (select top 1 firstName + ' ' + lastname from users where id in
							(select userId from Users_HiringClients where hiringClientId = HC.Id AND isContact = 1)), '' ) contactName `;

	if (params.summary) {
		query = `SELECT  HC.id, HC.name `;
	}

	// TODO: Maybe CF Roles are not needed here
	const canSeeAllHC = [1, 2, 5, 8];

	if (canSeeAllHC.includes(params.roleId) || canSeeAllHC.includes(params.CFRoleId)) {
		query += `	FROM  HiringClients HC `;

		if (params.system) {
			query += `	INNER JOIN HiringClient_EnabledSystems ES ON HC.Id = ES.HiringClientId `;
		}
	}
	else {
		// query += `FROM HiringClients HC,
		// 		Users_HiringClients UC,
		// 		Users U `;
		query += `
				FROM HiringClients HC
				LEFT JOIN Users_HiringClients UC ON HC.id = UC.HiringClientId
				LEFT JOIN Users U ON U.id = UC.UserId
		`;

		if (params.system) {
			query += `	INNER JOIN HiringClient_EnabledSystems ES ON HC.Id = ES.HiringClientId `;
		}
	}
	console.log('userid', params.userId);
	console.log('roleId', params.roleId, (params.roleId === null || typeof params.roleId == 'undefined'));
	console.log('CFRoleId', params.CFRoleId, (params.CFRoleId === null || typeof params.CFRoleId == 'undefined'));

	if (params.userId && (
		(!canSeeAllHC.includes(params.roleId) && (params.CFRoleId === null || typeof params.CFRoleId == 'undefined'))
		||
		((params.roleId === null || typeof params.roleId == 'undefined') && !canSeeAllHC.includes(params.CFRoleId)))
	) {
		console.log('WHERE for PQ role & CF role not internal user and userId');
		whereClause = `WHERE UC.UserId = ${params.userId}
			AND UC.HiringClientId = HC.Id
			AND U.Id = UC.UserId `;

		if (params.searchTerm && !params.onlyHolderParents) {
			whereClause += ` AND
				(
					HC.Id in (
						select hiringClientId from Users_HiringClients where userId in (
							select id from Users where (firstName + ' ' + lastname) like '%${params.searchTerm}%'
						)
					) OR
					HC.Phone LIKE '%${params.searchTerm}%' OR
					HC.State LIKE '%${params.searchTerm}%'
				`;
			if (typeof params.nameTerm === 'undefined') whereClause += `OR HC.Name LIKE '%${params.searchTerm}%'`
			whereClause += `)`;

		}
		if (params.nameTerm) {
			whereClause += ` AND
					HC.Name LIKE '%${params.nameTerm}%'
				`;
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
							select hiringClientId from Users_HiringClients where userId in (
								select id from Users where (firstName + ' ' + lastname) like '%${params.contactNameTerm}%'
							)
						)
				)`;

		}
	}

	if (canSeeAllHC.includes(params.roleId) || canSeeAllHC.includes(params.CFRoleId)) {
		var whereArray = [];
		var whereTerm = null;

		if (params.searchTerm && !params.onlyHolderParents) {
			whereTerm = `
				(
					HC.Id in (
						select hiringClientId from Users_HiringClients where userId in (
							select id from Users where (firstName + ' ' + lastname) like '%${params.searchTerm}%'
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
			whereTerm = `HC.Name LIKE '%${params.nameTerm}%'`;
			whereArray.push(whereTerm);
		}
		if (params.contactNameTerm) {
			whereTerm = `
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
						select hiringClientId from Users_HiringClients where userId in (
							select id from Users where (firstName + ' ' + lastname) like '%${params.contactNameTerm}%'
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

	if (params.onlyParents) {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` HC.ParentHiringClientId IS NULL `;
	}

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

	if (params.system == 'pq') {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` pqEnabled = 1 `
	} else if (params.system == 'cf') {
		whereClause = whereClause === null ? `WHERE ` : ` ${whereClause} AND `;
		whereClause += ` cfEnabled = 1 `
	}

	//pqEnabled = 1 or cfEnabled = 1

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

	if (whereClause == '' || whereClause == null || whereClause == ' ') whereClause = ` WHERE 1 = 1`;

	if (params.subcontractorId) {
		if (params.userId) {
			whereClause += `
				AND HC.id IN (
					SELECT	HiringClientId
					FROM	Hiringclients_SubContractors
					WHERE	SubContractorId in (
							SELECT	SubContractorId
							FROM	Users_SubContractors
							WHERE	UserId = ${params.userId}
					)
					OR
					subcontractorID = ${params.subcontractorId}
				)
			`;
		} else {
			whereClause += ` AND HC.id IN (SELECT hiringClientId FROM Hiringclients_SubContractors WHERE subcontractorID = ${params.subcontractorId}) `;
		}
	}

	query += whereClause;

	if (orderClause) {
		query += orderClause
	}

	if (params.pagination && params.getTotalCount == false) {
		let pageSize = params.pagination.pageSize
		let pageNumber = params.pagination.pageNumber
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	// console.log('HCs '.repeat(100))
	//  console.log('getHiringClientsQuery::',query);
	return query;
}

exports.generateHiringClientsCountQuery = function () {
	let query = `SELECT COUNT(*) Count FROM HiringClients`;

	return query;
}

exports.generateHiringClientUpdateUserRelationsQuery = function (queryParams) {
	let query = `DELETE FROM Users_HiringClients WHERE UserId = ${queryParams.userId} `;

	query += `INSERT INTO Users_HiringClients (
		UserId,
		HiringClientId)
	VALUES `;

	for (let hiringClientId of queryParams.hiringClientIds) {
		query += `(${queryParams.userId}, ${hiringClientId}),`;
	}

	// remove last comma.
	query = query.slice(0, -1);

	// console.log('u*s*e*r*s*h*i*r*i*n*g*c*l*i*e*n*t*s'.repeat(5))
	// console.log('queryParams = ', queryParams)
	// console.log(query)
	// console.log('u*s*e*r*s*h*i*r*i*n*g*c*l*i*e*n*t*s'.repeat(5))

	return query;
}

exports.generateEmailInsertQuery = function (params) {
	let query = `INSERT INTO Messages (TemplateId, FromName, FromAddress, ToName, ToAddress, RecipientId, MessageTrackingId `;

	if (params.hiringClientId)
		query += `, hiringClientId `;

	if (params.subcontractorId)
		query += `, subcontractorId `;

	if (params.wfGenerated)
		query += `, wfGenerated `;

	query += `)
	VALUES ('${params.templateId}', '${params.from}', '${params.from}', '${params.name}', '${params.to}', 1, '${params.messageTrackingId}' `;

	if (params.hiringClientId)
		query += `, ${params.hiringClientId} `;

	if (params.subcontractorId)
		query += `, ${params.subcontractorId} `;

	if (params.wfGenerated)
		query += `, ${params.wfGenerated} `;

	query += `)`;

	// console.log('EMAIL SAVED INTO DB '.repeat(20))
	// console.log('\n')
	// console.log('query = ', query)
	// console.log('params = ', params)

	return query;
}

exports.generateEmailTemplateQuery = function (templateName) {
	let query = `SELECT * FROM MessagesTemplates MT
		WHERE MT.TemplateName = '${templateName}'
		AND MT.ReplacedTemplateId IS NULL`

	return query;
}

exports.generateWebhookInsertQuery = function (params) {
	let query = ''
	query += 'INSERT INTO MessageEvents (';
	query += 'MessageId,';
	query += 'EventTypeId,';
	query += 'Recipient,';
	query += 'Domain,';
	query += 'Ip,';
	query += 'Country,';
	query += 'Region,';
	query += 'City,';
	query += 'UserAgent,';
	query += 'DeviceType,';
	query += 'ClientType,';
	query += 'ClientName,';
	query += 'ClientOs,';
	query += 'CampaignId,';
	query += 'CampaignName,';
	query += 'Tag,';
	query += 'MailingList,';
	query += 'CustomVariables,';
	query += 'EventTimeStamp,';
	query += 'URL,';
	query += 'MessageHeaders,';
	query += 'Bounce_Code,';
	query += 'Bounce_Error,';
	query += 'Bounce_Notification,';
	query += 'Dropped_Code,';
	query += 'Dropped_Description';
	query += ')';
	query += 'VALUES (';
	query += `(SELECT Id FROM Messages WHERE MessageTrackingId = '${params["message-id"]}'),`;
	query += `(SELECT Id FROM EventTypes WHERE Description = '${params.event}'),`;
	query += (params["recipient"] ? `'${params["recipient"]}',` : `NULL, `);
	query += (params["domain"] ? `'${params["domain"]}',` : `NULL, `);
	query += (params["ip"] ? `'${params["ip"]}',` : `NULL, `);
	query += (params["country"] ? `'${params["country"]}',` : `NULL, `);
	query += (params["region"] ? `'${params["region"]}',` : `NULL, `);
	query += (params["city"] ? `'${params["city"]}',` : `NULL, `);
	query += (params["user-agent"] ? `'${params["user-agent"]}',` : `NULL, `);
	query += (params["device-type"] ? `'${params["device-type"]}',` : `NULL, `);
	query += (params["client-type"] ? `'${params["client-type"]}',` : `NULL, `);
	query += (params["client-name"] ? `'${params["client-name"]}',` : `NULL, `);
	query += (params["client-os"] ? `'${params["client-os"]}',` : `NULL, `);
	query += (params["campaign-id"] ? `'${params["campaign-id"]}',` : `NULL, `);
	query += (params["campaign-name"] ? `'${params["campaign-name"]}',` : `NULL, `);
	query += (params["tag"] ? `'${params["tag"]}',` : `NULL, `);
	query += (params["mailing-list"] ? `'${params["mailing-list"]}',` : `NULL, `);
	query += (params["custom-variables"] ? `'${params["custom-variables"]}',` : `NULL, `);
	query += (params["timestamp"] ? `'${params["timestamp"]}',` : `NULL, `);
	query += (params["url"] ? `'${params["url"]}',` : `NULL, `);
	query += (params["message-headers"] ? `'${params["message-headers"]}',` : `NULL, `);
	query += (params["bounce_code"] ? `'${params["bounce_code"]}',` : `NULL, `);
	query += (params["bounce_error"] ? `'${params["bounce_error"]}',` : `NULL, `);
	query += (params["bounce_notification"] ? `'${params["bounce_notification"]}',` : `NULL, `);
	query += (params["dropped_code"] ? `'${params["dropped_code"]}',` : `NULL, `);
	query += (params["dropped_code"] ? `'${params["dropped_description"]}')` : `NULL)`);

	return query;
}

exports.generatePlaceholdersQuery = function (system = 'pq') {

	if (system != 'pq' && system != 'cf') system = 'pq'

	const querySelect = `SELECT id, placeholder FROM MessageTemplatesPlaceholders`
	const queryWhere = `system = '${system}' or system is null`;
	const queryOrder = `ORDER BY placeholder`;
	const query = `${querySelect} where ${queryWhere} ${queryOrder}`;
	return query;
}

exports.generateCommunicationTypesQuery = function () {
	return `SELECT id, description FROM CommunicationTypes ORDER BY description ASC `;
}

exports.generateTemplateActivitiesQuery = function () {
	return `SELECT id, name FROM TemplateActivities ORDER BY name ASC `;
}

exports.generateTemplatesQuery = function (params) {
	let whereClause = ' WHERE U.Id = T.UserId ';
	let orderClause = `ORDER BY T.Id `;
	let selectClause = `SELECT T.Id, T.TemplateName, T.Subject, T.bodyHTML, T.BodyText, T.ReplacedTemplateId, T.TemplateActivityId, T.CommunicationTypeId, T.FromAddress, T.HiringClientId, T.TimeStamp, U.FirstName + ' ' + U.LastName TemplateCreator `
	let fromClause = `FROM MessagesTemplates T, Users U `
	let query = ''

	if (params.templateId) {
		let templateId = params.templateId;

		whereClause = ` AND T.Id = ${templateId} `;
	}
	else if (params.CommunicationTypeId) {
		let CommunicationTypeId = params.CommunicationTypeId;

		whereClause = ` AND T.CommunicationTypeId = ${CommunicationTypeId} `;
	}
	else if (params.hiringClientId) {
		let hiringClientId = params.hiringClientId;

		selectClause += `,THC.TemplateId `;
		fromClause += `,Template_HiringClients THC `

		whereClause += ` AND THC.HiringClientId = ${hiringClientId}
			AND T.Id = THC.TemplateId `;
	}
	else if (params.searchTerm) {
		let searchTerm = params.searchTerm;

		whereClause += ` AND (T.TemplateName LIKE '%${searchTerm}%' OR T.Subject LIKE '%${searchTerm}%' OR T.BodyText LIKE '%${searchTerm}%') `;
	}

	query += selectClause;
	query += fromClause;

	if (whereClause) {
		query += whereClause;
	}

	if (params.orderBy) {
		orderClause = ` ORDER BY ${params.orderBy} `;
		if (params.orderDirection) {
			orderClause += ` ${params.orderDirection} `;
		}
	}

	query += orderClause;

	if (params.pagination && params.getTotalCount == false) {
		let pageSize = params.pagination.pageSize
		let pageNumber = params.pagination.pageNumber
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	// console.log('T*E*M*P*L*A*T*E*S'.repeat(20))
	// console.log('params = ', params)
	// console.log(query)
	// console.log('T*E*M*P*L*A*T*E*S'.repeat(20))

	return query;

}

exports.generateTemplatesInsertQuery = function (template) {
	let query = `DECLARE @TemplateId numeric(38,0) `
	query += `INSERT INTO MessagesTemplates (TemplateName, Subject, BodyHTML, BodyText, TemplateActivityId, CommunicationTypeId, FromAddress, HiringClientId, UserId)
		VALUES ('${template.templateName}', '${template.subject}', '${template.bodyHTML}', '${template.bodyText}', ${template.templateActivityId},
		${template.communicationTypeId}, '${template.fromAddress}',  ${template.ownerId}, ${template.userId})`;

	query += `SET @TemplateId = SCOPE_IDENTITY() `;

	query += `INSERT INTO Template_HiringClients (TemplateId, HiringClientId)
		VALUES (@TemplateId, ${template.ownerId})`;

	return query;
}

exports.generateTemplatesUpdateQuery = function (template) {
	let query = ` UPDATE MessagesTemplates
	SET`;

	if (template.templateName) {
		query += ` TemplateName = '${template.templateName}',`;
	}

	if (template.subject) {
		query += ` Subject = '${template.subject}',`;
	}

	if (template.bodyHTML) {
		query += ` BodyHTML = '${template.bodyHTML}',`;
	}

	if (template.bodyText) {
		query += ` BodyText = '${template.bodyText}',`;
	}

	if (template.templateActivityId) {
		query += ` TemplateActivityId = ${template.templateActivityId},`;
	}

	if (template.communicationTypeId) {
		query += ` CommunicationTypeId = ${template.communicationTypeId},`;
	}

	if (template.fromAddress) {
		query += ` FromAddress = '${template.fromAddress}',`;
	}

	if (template.ownerId) {
		query += ` HiringClientId = ${template.ownerId}`;
	}

	query += ` WHERE Id = ${template.templateId}; `;

	return query;
}

exports.generateLanguagesDataQuery = function () {
	let query = `SELECT L.Id L_Id, L.name L_Name, L.HiringCustomerId L_HCId, L.IsDefault L_IsDefault,
		D.LanguageId D_LanguageId, D.KeyId D_KeyId, D.Value D_Value,
		LK.Id LK_Id, LK.KeyName LK_Key
		FROM Languages L,
		Dictionaries D,
		LanguageKeys LK
		WHERE D.LanguageId = L.Id
		AND LK.Id = D.KeyId
		ORDER BY L.Id asc`

	return query;
}

exports.generateLanguageQuery = function (queryParams) {
	let query = '';
	if (queryParams.hiringClientId) {
		query += `SELECT L.Id L_Id, L.Name L_Name, L.HiringCustomerId L_HiringCustomerId, L.IsDefault L_IsDefault
			FROM Languages L
			WHERE L.HiringCustomerId = ${queryParams.hiringClientId}`;
	}
	else if (queryParams.subContractorId) {
		query += `SELECT HCSC.HiringClientId HCSC_HCId, HCSC.SubContractorId HCSC_SCId,
			HC.Id HC_ID,
			L.Id L_Id, L.Name L_Name, L.HiringCustomerId L_HiringCustomerId, L.IsDefault L_IsDefault
			FROM HiringClients_SubContractors HCSC,
			HiringClients HC,
			Languages L
			WHERE HCSC.SubContractorId = ${queryParams.subContractorId}
			AND HC.Id = HCSC.HiringClientId
			AND L.Id = HC.Id`
	}

	return query;
}

exports.generateDictionariesQuery = function (queryParams) {
	let query = `SELECT L.Id L_Id, L.Name L_Name, L.HiringCustomerId L_HiringCustomerId,
		D.LanguageId D_LanguageId, D.KeyId D_KeyId, D.Value D_Value
		FROM Languages L,
		Dictionaries D
		WHERE L.Id = ${queryParams.languageId}
		AND D.LanguageId = L.Id`;

	return query;
}

exports.generateLanguageKeysQuery = function (queryParams) {
	let query = `SELECT  D.KeyId KeyId,
		        D.Value DefaultValue,
		        (SELECT Value FROM Dictionaries `;
	if (queryParams.languageId)
		query += `WHERE LanguageId = ${queryParams.languageId} `;
	else
		query += `WHERE LanguageId in (select id from Languages where HiringCustomerId = ${queryParams.hiringClientId}) `;

	query += `AND KeyId = D.KeyId) Value
					FROM Languages L,
					Dictionaries D
					WHERE L.IsDefault = 1
					AND D.LanguageId = L.Id `;

	return query;
}

exports.generateLanguageInsertQuery = function (queryParams) {
	let dictionaries = queryParams.dictionaries
	let languageId = dictionaries[0].L_Id;
	let hiringClientId = queryParams.hiringClientId;
	let languageName = dictionaries[0].L_Name;

	if (queryParams.newLanguageName) {
		languageName = queryParams.newLanguageName;
	}

	let query = `DECLARE @NewLanguageId numeric(38,0) `
	query += `INSERT INTO Languages (Name, HiringCustomerId, IsDefault)
		VALUES ('${languageName}', ${hiringClientId}, 0) `;

	query += `SET @NewLanguageId = SCOPE_IDENTITY() `

	query += `INSERT INTO Dictionaries (LanguageId, KeyId, Value)
		VALUES `;

	for (let entry of dictionaries) {
		query += `(@NewLanguageId, ${entry.D_KeyId}, '${entry.D_Value}'),`
	}

	// remove last comma.
	query = query.slice(0, -1);

	return query;
}

exports.generateLanguageValuesUpdateQuery = function (queryParams) {
	let query = ``;
	languageId = queryParams.languageId;

	for (let entry of queryParams.dictionary) {
		query += ` UPDATE Dictionaries
		SET Value = '${entry.value}'
		WHERE LanguageId = ${languageId}
		AND KeyId = ${entry.keyId}`
	}

	return query;
}

exports.generateAccountValuesQuery = function (queryParams) {
	let query = `SELECT AV.id, AV.savedFormId, AV.accountId, AV.value
		FROM AccountValues AV`;

	if (queryParams.savedFormId && queryParams.accountId) {
		query += ` WHERE AV.SavedFormId = ${queryParams.savedFormId}
		AND AV.AccountId = ${queryParams.accountId}`;
	}
	else if (queryParams.savedFormId) {
		query += ` WHERE AV.SavedFormId = ${queryParams.savedFormId}`;
	}
	else {
		query += ` WHERE AV.AccountId = ${queryParams.accountId}`;
	}

	return query;
}

exports.generateAccountValueInsertQuery = function (queryParams) {
	let query = `INSERT INTO AccountValues (SavedFormId, AccountId, Value, TimeStamp)
		VALUES (
		${queryParams.savedFormId},
		${queryParams.accountId},
		${queryParams.value}
		)`;

	return query;
}

exports.generateAccountInsertQuery = function (queryParams) {
	let query = `INSERT INTO Accounts (GroupId, HiringClientId, Name, AccountTypeId)
		VALUES (
		${queryParams.groupId},
		${queryParams.hiringClientId},
		'${queryParams.name}',
		${queryParams.accountTypeId}
		)`;

	return query;
}

exports.generateRoleByUserQuery = function (queryParams) {
	return `select roleId, CFRoleId from Users where id = ${queryParams.userId}`;
}

exports.generateFunctionAuthorizationQuery = function (queryParams) {
	let query = ` SELECT RF.RoleId, RF.FunctionId, U.RoleId, U.Id
		FROM Roles_Functions RF,
		Users U
		WHERE U.Id = ${queryParams.userId}
		AND RF.RoleId = U.RoleId
		AND RF.FunctionId = ${queryParams.functionId}`;

	return query;
}

exports.generateAccountsQuery = function (queryParams) {
	let whereClause = null;
	let query = `SELECT A.id, A.groupId, A.hiringClientId, A.name FROM Accounts A`;

	if (queryParams.accountId) {
		whereClause = ` WHERE A.Id = ${queryParams.accountId} `;
	}
	else if (queryParams.groupId) {
		whereClause = ` WHERE A.GroupId = ${queryParams.groupId} `;
	}
	else if (queryParams.hiringClientId) {
		whereClause = ` WHERE A.HiringClientId = ${queryParams.hiringClientId} `;
	}

	if (whereClause) {
		query += whereClause
	}

	query += ' ORDER BY A.Id ASC'

	if (queryParams.pagination) {
		let pageSize = queryParams.pagination.pageSize;
		let pageNumber = queryParams.pagination.pageNumber;
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	return query;
}

exports.generateAccountUpdateQuery = function (queryParams) {
	let query = `UPDATE Accounts SET
		GroupId = ${queryParams.groupId},
		HiringClientId = ${queryParams.hiringClientId},
		Name = '${queryParams.name}'
		WHERE Id = ${queryParams.accountId}`;

	return query;
}

exports.generateAccountValuesUpdateQuery = function (queryParams) {
	let query = `DELETE FROM AccountValues WHERE SavedFormId = ${queryParams.savedFormId}
	INSERT INTO AccountValues (SavedFormId, AccountId, Value, AdjustmentValue, AdjustmentFactor)
	VALUES`;

	for (let accountValue of queryParams.accountValues) {
		query += ` (${queryParams.savedFormId}, ${accountValue.accountId}, ${accountValue.adjustmentValue}, ${accountValue.adjustmentFactor}),`;
	}

	// remove last comma.
	query = query.slice(0, -1);

	return query;
}

exports.generateInsertSavedFormQuery = function (params) {
	console.log('params', params);
	var query = `INSERT INTO SavedForms (FormId,UserId,SubcontractorID,HiringClientId,IsComplete)
	VALUES (
		'${params.formId}',
		'${params.userId}',
		'${params.subcontractorId}',
		'${params.hiringClientId}',
		0
	)`;

	return query;
}


// Get USA States
exports.generateUSAStatesQuery = function () {

	return `SELECT Id, Name, ShortName FROM States ORDER BY Name ASC`;
}

// Get all countries states/provinces
exports.generateAllCountriesStatesQuery = function () {
	return `
		SELECT id, name, shortName FROM States;
		SELECT id, name, shortName FROM Canadian_Provinces_and_Territories;
	`;
}

exports.generateHCCloneConfigsQuery = function (hiringClientId) {
	return query = ` EXEC spCloneWF ${hiringClientId};
                   EXEC spCloneFinancialsRules 1, ${hiringClientId};
                   EXEC spCloneTrades 1, ${hiringClientId}; `;
}

exports.generateTimeZonesQuery = function () {
	return `SELECT id, value, description FROM TimeZones ORDER BY id ASC`;
}

exports.generateTitlesQuery = function () {
	return `SELECT id, title FROM Titles ORDER BY id ASC`;
}

exports.generateTradesQuery = function (hiringClientId) {
	return `SELECT id, value, Description FROM Trades WHERE hiringClientId = ${hiringClientId} ORDER BY orderIndex ASC`;
}

exports.generateCountriesQuery = function (generateCountriesQuery) {
	return `SELECT id, name FROM Countries ORDER BY id ASC`;
}

exports.generateDiscreetAccountsQuery = function () {
	return `SELECT * FROM DiscreteAccounts`;
}

exports.generateFormsHiddenScorecardsFieldsQuery = function (formsIds) {
	let query = 'SELECT sf.Id id, sf.FieldName name FROM ScorecardsFields sf;';

	if (formsIds) {
		query += `SELECT sf.Id id, sf.FieldName name, shf.FormId formId FROM ScorecardsFields sf INNER JOIN ScorecardsHiddenFields shf ON sf.Id = shf.ScorecardFieldId WHERE shf.FormId IN (${formsIds});`;
	}

	return query;
}

exports.getSubmissionsByFormIdQuery = function (params) {
	console.log('parama', params);
	let query = `SELECT  s.id,
        s.formId,
        f.name formName,
        s.userId submitterUserId,
        u.firstName + ' ' + u.lastName submitterUserName,
        s.subcontractorID,
        sc.name subcontractorName,
        s.hiringClientId,
        hc.name hiringClientName,
        CASE
            WHEN s.isComplete = 1 THEN 'Complete'
            ELSE 'Incomplete'
        END status,
        s.timeStamp submissionDate `;

	if (params.getTotalCount == true) {
		query = ` SELECT COUNT(*) totalCount `;
	}

	query +=
		`FROM    SavedForms s,
		        Forms f,
		        Users u,
		        HiringClients hc,
		        SubContractors sc
		WHERE   f.id = s.formId
		AND     u.id = s.userId
		AND     hc.id = s.hiringClientId
		AND     sc.id = s.subcontractorID
		AND     s.isComplete = 1 `;


	if (params.hcId) {
		query += ` AND  s.hiringClientId =${params.hcId} `;
	}

	if (params.subContractorIdSelected) {
		query += ` AND  s.SubcontractorID = ${params.subContractorIdSelected} `;
	}

	query += ` AND (s.isCopied is null or s.isCopied=0)`;
	query += ` AND (DATEDIFF(day,s.dateOfPrequal,GETDATE())<180) `;

	if (params.getTotalCount == false) {
		if (params.orderBy) {
			query += ` ORDER BY ${params.orderBy} `;
			if (params.orderDirection) {
				query += ` ${params.orderDirection} `;
			}
		}
		else {
			query += ` ORDER BY id ASC `;
		}
	}

	if (params.pageSize) {
		query += ` ORDER BY id ASC OFFSET ${params.pageSize} * (${params.pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	console.log('getSubmissionsByFormId', query);
	return query;
}

exports.checkRolePermissions = (params) => {
	return `select RF.RoleId from Roles_Functions RF
	inner join Functions F on RF.FunctionId = F.Id
	where lower(F.Name) = lower('${params.functionName}')
	and (RF.RoleId = (select RoleID from Users where Id = ${params.userId}) or RF.RoleId = (select CFRoleId from Users where Id = ${params.userId}) )`
}