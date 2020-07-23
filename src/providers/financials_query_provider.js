const { writeLog } = require('./../utils')

// Get Scorecardconcepts query by HC
exports.generateScorecardConceptsQuery = function (submissionId) {
	return `SELECT scv.id, scv.scorecardConceptId, sc.name, scv.value, scv.color
			FROM ScorecardConceptsValues scv,
			Scorecardconcepts sc
			WHERE scv.submissionId = ${submissionId}
			AND scv.scorecardConceptId = sc.id
			ORDER BY scv.id ASC`;
}

// Get all accounts for a particular HC based on sumission Id
exports.generateGetAccountsBySubmissionIdQuery = function (submissionId) {
	return `SELECT id, groupId, name FROM Accounts WHERE hiringClientId IN
				(SELECT hiringClientId FROM SavedForms WHERE id = ${submissionId}) `;
}

// Get EMRs values
exports.getEMRValuesQuery = function (submissionId) {
	return ` SELECT   v.id, v.value, 0 as [index], c.name
		FROM    SavedFormFieldsValues v,
		        FormsSectionsFields f,
		        zCommonFields c
		WHERE   v.FormSectionFieldId = f.Id
		AND     f.CommonFieldID = 1
		AND     v.SavedFormId = ${submissionId}
		AND     c.id = 1
		UNION
		SELECT   v.id, v.value, 1 as [index], c.name
		FROM    SavedFormFieldsValues v,
		        FormsSectionsFields f,
		        zCommonFields c
		WHERE   v.FormSectionFieldId = f.Id
		AND     f.CommonFieldID = 2
		AND     v.SavedFormId = ${submissionId}
		AND     c.id = 2
		UNION
		SELECT   v.id, v.value, 2 as [index], c.name
		FROM    SavedFormFieldsValues v,
		        FormsSectionsFields f,
		        zCommonFields c
		WHERE   v.FormSectionFieldId = f.Id
		AND     f.CommonFieldID = 3
		AND     v.SavedFormId = ${submissionId}
		AND     c.id = 3 `;
}


// Get basic type accounts (Type 2 = Basic accounts, 3 = Avg project and 4 = Avg Volume)
exports.generateGetBasicAccountsBySubmissionIdQuery = function (submissionId, typeId) {
	return `SELECT av.id, av.AccountId, a.name, av.value, av.AdjustmentValue, av.AdjustmentFactor, a.orderIndex
			FROM AccountsValues av, Accounts a WHERE av.AccountId IN
			    (SELECT id FROM Accounts WHERE hiringClientId IN
			    		(SELECT hiringClientId FROM SavedForms WHERE id = ${submissionId})
			    AND accountTypeId = ${typeId})
			AND av.AccountId = a.id
			AND av.savedFormId = ${submissionId} `;
}


// Generate basic type accounts (Type 2 = Basic accounts)
exports.generateGetBasicAccounts = function (submissionId, accountTypeId) {
	return `INSERT INTO  AccountsValues (SavedFormId,AccountId,Value,TimeStamp,AdjustmentValue ,AdjustmentFactor)
						SELECT ${submissionId}, id, 0, getDate(), 0,  0
						FROM Accounts
						WHERE hiringClientId IN
						(SELECT hiringClientId FROM SavedForms WHERE id = ${submissionId})
						AND accountTypeId = ${accountTypeId} `;
}



// Get all companies types and their associated tax rate
exports.generateGetCompaniesTypesQuery = function () {
	return `SELECT id, name, taxRate FROM CompaniesTypes `;
}

// Get all turn over rates
exports.generateGetTurnOverRatesQuery = function () {
	return `SELECT id, name, value FROM TurnOverRates `;
}

// Get qualifications criterias
exports.generateGetQualificationsCriteriaQuery = function (subcontractorId, hiringClientId) {
	return `
		DECLARE @tradeRisk INT;
		DECLARE @tradeRiskId INT;

		SELECT @tradeRiskId = tradeRiskId FROM Trades WHERE id IN (SELECT tradeId FROM Hiringclients_SubContractors WHERE SubContractorId = ${subcontractorId} AND HiringClientId = ${hiringClientId});
		SELECT @tradeRisk = tradeRisk FROM zTradeRisk WHERE id = @tradeRiskId;

		SELECT  id, scorecardConceptId, minValue, maxValue, minValueIncluded, maxValueIncluded, color
		FROM    QualificationCriterias
		WHERE   hiringClientId = ${hiringClientId}
		AND     ISNULL(minTradeRisk, 0) <= @tradeRisk
		AND     ISNULL(maxTradeRisk, 100) >= @tradeRisk
		ORDER BY scorecardConceptId, id ASC;
	`;
}

// Get tie rating criterias
exports.generateGetTieRatingCriteriaQuery = function (savedFormId) {
	return `SELECT  tier, minGreenFlagsCount, maxRedFlagsCount
			FROM    TierRatingsCriterias
			WHERE   hiringClientId = (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
			ORDER BY tier `;
}

// Get avg projects or volume amounts
exports.generateGetscAvgProjectsQuery = function (savedFormId, accountTypeId) {
	return `SELECT  av.accountId, av.value, a.name
			FROM    AccountsValues av, Accounts a
			WHERE   av.accountId = a.id
			AND     a.accountTypeId = ${accountTypeId}
			AND     av.savedFormId = ${savedFormId}
			ORDER BY accountId ASC `;
}

// Get Project Limit Coefficients
exports.generateGetProjectLimitCoefficientsQuery = function (hiringClientId) {
	return `SELECT  tierRating, singleProjectLimitPercentage, singleProjectPercentageAverageAnnualRevenue, aggregateProjectLimitWorkingCapitalMultiplier, aggregateProjectAverageAnnualRevenue
			FROM    zProjectLimitCoefficients
			WHERE   hiringClientId = ${hiringClientId}`;
}

// Get Project Limit Coefficients
exports.generateGetMaxAggregateProjectLimitQuery = function (hiringClientId, financialStatementTypeId) {
	return `SELECT  maxAggregateProjectLimit
			FROM    zMaxAggregateProjectLimit
			WHERE   hiringClientId = ${hiringClientId}
			AND     financialStatementTypeID = ${financialStatementTypeId}`;
}

// Query to update a particular scorecard concept by name and HC id
exports.generateSCConceptsUpdateQuery = function (hiringClientId, submissionId, conceptId, value, numericValue, color) {
	let filteredValue = value;
	let filteredNumericValue = numericValue;

	if (conceptId != 9 && conceptId != 10 && conceptId != 11 && conceptId != 12 && conceptId != 2 && conceptId != 7 && conceptId != 8) {
		if (isNaN(value)) {
			filteredValue = '';
			filteredNumericValue = 0;
		}
	}

	if (conceptId == 9 || conceptId == 10 || conceptId == 11 || conceptId == 12) {
		return ' ';
	}

	return `
		SELECT @exists = count(*) FROM ScorecardConceptsValues WHERE submissionId = ${submissionId} AND scorecardConceptId = ${conceptId};
		IF @exists = 0
		BEGIN
		        INSERT INTO ScorecardConceptsValues
		         (HiringClientId,ScorecardConceptId,Value,Color,NumericValue,submissionId)
		         VALUES (${hiringClientId}, ${conceptId}, '${filteredValue}', ${color}, ${filteredNumericValue}, ${submissionId})
		END
		ELSE
		BEGIN
		        update ScorecardConceptsValues
		        set value = '${filteredValue}',
		        numericValue = ${filteredNumericValue},
		        color = ${color}
		        where submissionId = ${submissionId}
		        and scorecardConceptId = ${conceptId};
		END;
	`;
}

// Query to update a particular submission with the tier rating and the other 2 main paramters
exports.generateSCSubmissionTierUpdateQuery = function (submissionId, scorecardMainParameters) {
	let tieRating = scorecardMainParameters.tieRating;
	let singleProjectLimit = scorecardMainParameters.singleProjectLimit;
	let aggregateProjectExposure = scorecardMainParameters.aggregateProjectExposure;
	let adjustedWorkingCapital = scorecardMainParameters.adjustedWorkingCapital;

	let query = `UPDATE SavedForms SET tieRating = ${tieRating} `;
	query += `, singleProjectLimit = ${singleProjectLimit} `;
	query += `, aggregateProjectExposure = ${aggregateProjectExposure} `;
	query += adjustedWorkingCapital ? `, adjustedWorkingCapital = ${adjustedWorkingCapital} ` : '';
	query += ` WHERE id = ${submissionId}; `;

	// console.log('tierRating in query = ', query)
	// writeLog('tierRating in query = ', query)

	return query;
}



// Get Scorecardconcepts query by HC
exports.generateScorecardSCDataQuery = function (submissionId) {
	let query = `
  DECLARE   @currentHiringClientID  int;
  DECLARE   @renewalDays            int;
  DECLARE   @renewalMonths          int;

  SELECT    @currentHiringClientID  = HiringClientID,
            @renewalDays            = value,
            @renewalMonths           = months

  FROM      SavedForms sf

  INNER JOIN TurnOVerRates t ON sf.TurnOverRateID = t.id

  WHERE     sf.ID = ${submissionId};

  SELECT    s.name                            AS subcontractorName,
            s.id                              AS subcontractorId,
            tr.Description                    AS tradeName,
            sf.dateOfPrequal                  AS dateOfPrequal,
            sf.dateOfRenewal                  AS dateOfRenewal,
            sf.TimeStamp                      AS dateOfSubmission,
            dateOfFinancialStatement          AS dateOfFinancialStatement,
            dateOfFinancialStatementPrepared  AS dateOfFinancialStatementPrepared,
            @currentHiringClientID            AS hiringClientId,
            sf.Commentary                     AS commentary,
            sf.AnalysisTypeId                 AS analysisTypeId,
            sf.financialStatementTypeID       AS financialStatementTypeId,
            sf.IsComplete                     AS isComplete,
            sf.FinIsComplete                  AS finIsComplete,
            ss.id                             AS scorecardSourceId,
            ss.name                           AS scorecardSource,
            ct.name                           AS companyType,
            sf.CompanyTypeId                  AS companyTypeId,
            tor.id                            AS turnOverRateId,
            tor.name                          AS turnOverRate,
            @renewalDays                      AS turnOverDays,
            @renewalMonths                    AS turnOverMonths,
            sf.tieRating                      AS tieRating,
            sf.singleProjectLimit             AS singleProjectLimit,
						sf.aggregateProjectExposure       AS aggregateProjectExposure,
						sf.adjustedWorkingCapital         AS adjustedWorkingCapital,
            av.value                          AS NSLvalue,
            av.AdjustmentValue                AS NSLadjustmentvalue,
            av.AdjustmentFactor               AS NSLadjustmentfactor

  FROM      SavedForms sf

  LEFT OUTER JOIN ScorecardsSources ss  ON sf.ScorecardSourceId = ss.Id
  LEFT OUTER JOIN CompaniesTypes ct     ON sf.CompanyTypeId = ct.Id
  INNER JOIN TurnOverRates tor          ON sf.TurnOverRateId = tor.Id
  INNER JOIN Subcontractors s           ON sf.SubcontractorID = s.id
  LEFT OUTER JOIN Trades tr             ON (SELECT TradeId FROM Hiringclients_SubContractors WHERE HiringClientId = @currentHiringClientID AND SubContractorId = s.id) = tr.Id
  LEFT OUTER JOIN AccountsValues av     ON sf.id = av.SavedFormId
         AND av.AccountId in (  SELECT  ID
                                FROM    Accounts
                                WHERE   HiringClientID  = @currentHiringClientID
                                        AND name        = 'Nevada Single Project Limit'
                              )

  WHERE  sf.id = ${submissionId}; `;

	return query
}

exports.generateMostRecentSavedFormIdQuery = function (hcId, scId) {
	const query = `
    SELECT    TOP 1 Id
    FROM      SavedForms
    WHERE     SubcontractorID = ${scId}
    AND       HiringClientId = ${hcId}
    ORDER BY  TimeStamp DESC
  `
	return query
}

// Get scorecard accounts query by submission
exports.generateScorecardQuery = function (savedFormId) {
	let query = `
	SELECT  parentGroupId,
	        parentGroup,
	        groupId,
	        groupName,
	        accountId,
	        accountName,
	        value,
	        adjustment,
	        orderIndex,
			CASE
		        WHEN alwaysVisible = 1 THEN 'true'
	            ELSE 'false'
	        END as alwaysVisible,
	        (SELECT id FROM Tasks WHERE assetTypeId = 3 AND assetId = valueId AND typeId = 2) noteId,
	        (SELECT name FROM Tasks WHERE assetTypeId = 3 AND assetId = valueId AND typeId = 2) noteName,
	        (SELECT description FROM Tasks WHERE assetTypeId = 3 AND assetId = valueId AND typeId = 2) noteDescription,
	        (SELECT assignedToUserId FROM Tasks WHERE assetTypeId = 3 AND assetId = valueId AND typeId = 2) noteAssignedToUserId,
	        (SELECT assignedToRoleId FROM Tasks WHERE assetTypeId = 3 AND assetId = valueId AND typeId = 2) noteAssignedToRoleId,
	        (SELECT dateDue FROM Tasks WHERE assetTypeId = 3 AND assetId = valueId AND typeId = 2) noteDateDue
		FROM
		(
		SELECT
		        ag.accountGroupId parentGroupId,
		        (SELECT agp.name FROM AccountsGroups agp WHERE agp.id = ag.accountGroupId) parentGroup,
						ag.id groupId,
		        ag.name groupName,
		        a.id accountId,
		        a.name accountName,
		        a.alwaysVisible,
		        a.orderIndex,
		        (SELECT id FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}) valueId,
		        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) value,
		        ISNULL((SELECT CASE adjustmentValue
		                    WHEN NULL THEN value * adjustmentFactor
		                    ELSE ISNULL(adjustmentValue, 0)
		                END
		                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) adjustment
		FROM    AccountsGroups ag,
		        Accounts a
		WHERE   a.groupId = ag.id
		AND     a.accountTypeId = 1
		AND     ag.id = 3
		AND     a.hiringClientId IN (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
		UNION
		SELECT
		        ag.accountGroupId parentGroupId,
		        (SELECT agp.name FROM AccountsGroups agp WHERE agp.id = ag.accountGroupId) parentGroup,
				ag.id groupId,
		        ag.name groupName,
		        a.id accountId,
		        a.name accountName,
		        a.alwaysVisible,
		        a.orderIndex,
		        (SELECT id FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}) valueId,
		        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) value,
		        ISNULL((SELECT CASE adjustmentValue
		                    WHEN NULL THEN value * adjustmentFactor
		                    ELSE ISNULL(adjustmentValue, 0)
		                END
		                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) adjustment
		FROM    AccountsGroups ag,
		        Accounts a
		WHERE   a.groupId = ag.id
		AND     a.accountTypeId = 1
		AND     ag.id = 4
		AND     a.hiringClientId IN (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
		UNION
		SELECT
		        ag.accountGroupId parentGroupId,
		        (SELECT agp.name FROM AccountsGroups agp WHERE agp.id = ag.accountGroupId) parentGroup,
				ag.id groupId,
		        ag.name groupName,
		        a.id accountId,
		        a.name accountName,
		        a.alwaysVisible,
		        a.orderIndex,
		        (SELECT id FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}) valueId,
		        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) value,
		        ISNULL((SELECT CASE adjustmentValue
		                    WHEN NULL THEN value * adjustmentFactor
		                    ELSE ISNULL(adjustmentValue, 0)
		                END
		                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) adjustment
		FROM    AccountsGroups ag,
		        Accounts a
		WHERE   a.groupId = ag.id
		AND     a.accountTypeId = 1
		AND     ag.id = 5
		AND     a.hiringClientId IN (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
		UNION
		SELECT
		        ag.accountGroupId parentGroupId,
		        (SELECT agp.name FROM AccountsGroups agp WHERE agp.id = ag.accountGroupId) parentGroup,
				ag.id groupId,
		        ag.name groupName,
		        a.id accountId,
		        a.name accountName,
		        a.alwaysVisible,
		        a.orderIndex,
		        (SELECT id FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}) valueId,
		        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) value,
		        ISNULL((SELECT CASE adjustmentValue
		                    WHEN NULL THEN value * adjustmentFactor
		                    ELSE ISNULL(adjustmentValue, 0)
		                END
		                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) adjustment
		FROM    AccountsGroups ag,
		        Accounts a
		WHERE   a.groupId = ag.id
		AND     a.accountTypeId = 1
		AND     ag.id = 7
		AND     a.hiringClientId IN (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
		UNION
		SELECT
		        ag.accountGroupId parentGroupId,
		        (SELECT agp.name FROM AccountsGroups agp WHERE agp.id = ag.accountGroupId) parentGroup,
				ag.id groupId,
		        ag.name groupName,
		        a.id accountId,
		        a.name accountName,
		        a.alwaysVisible,
		        a.orderIndex,
		        (SELECT id FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}) valueId,
		        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) value,
		        ISNULL((SELECT CASE adjustmentValue
		                    WHEN NULL THEN value * adjustmentFactor
		                    ELSE ISNULL(adjustmentValue, 0)
		                END
		                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) adjustment
		FROM    AccountsGroups ag,
		        Accounts a
		WHERE   a.groupId = ag.id
		AND     a.accountTypeId = 1
		AND     ag.id = 8
		AND     a.hiringClientId IN (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
		UNION
		SELECT
		        ag.accountGroupId parentGroupId,
		        (SELECT agp.name FROM AccountsGroups agp WHERE agp.id = ag.accountGroupId) parentGroup,
				ag.id groupId,
		        ag.name groupName,
		        a.id accountId,
		        a.name accountName,
		        a.alwaysVisible,
		        a.orderIndex,
		        (SELECT id FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}) valueId,
		        ISNULL((SELECT ISNULL(value, 0.0) FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) value,
		        ISNULL((SELECT CASE adjustmentValue
		                    WHEN NULL THEN value * adjustmentFactor
		                    ELSE ISNULL(adjustmentValue, 0)
		                END
		                FROM AccountsValues av WHERE av.accountId = a.id AND av.savedFormId = ${savedFormId}), 0) adjustment
		FROM    AccountsGroups ag,
		        Accounts a
		WHERE   a.groupId = ag.id
		AND     a.accountTypeId = 1
		AND     ag.id = 9
		AND     a.hiringClientId IN (SELECT hiringClientId FROM SavedForms WHERE id = ${savedFormId})
		) D
		ORDER BY groupId, accountName`;

	// console.log(query);

	return query;
}

// Get Scorecard sources
exports.generateScorecardSourcesQuery = function () {
	return `SELECT id, name FROM ScorecardsSources WHERE id > 1 ORDER BY id `;
}

// Delete account value
exports.generateDeleteAccountValueQuery = function (savedFormId, accountId) {
	return `DELETE AccountsValues WHERE SavedFormId = ${savedFormId} and accountId = ${accountId}; `;
}

exports.generateUpdateAccountValueQuery = function (accountId, value) {
	return ` UPDATE AccountsValues set value = ${value} WHERE id = ${accountId}; `;
}

// Insert account value
exports.generateInsertAccountValueQuery = function (savedFormId, accountId, value, adjustmentValue, note, userId) {
	let query = `INSERT INTO AccountsValues (SavedFormId, accountId, value, adjustmentValue)
			VALUES (${savedFormId}, ${accountId}, ${value}, ${adjustmentValue}); `;

	if (note) {
		if (note.taskId == null || !note.taskId) {
			// New note
			query += `
			DECLARE @lastIdentity int;
			SELECT @lastIdentity = IDENT_CURRENT('AccountsValues');
			INSERT INTO Tasks
			(Name, Description, TypeId, statusId , assetId, assetTypeId,
			enteredDate, modifiedDate, modifyByUserId, enteredByUserId, dateDue`;

			if (note.assignedToUserId)
				query += `, assignedToUserId`;

			query += `, tasksPriorityId`;

			if (note.assignedToRoleId)
				query += `, assignedToRoleId`;

			query += `) VALUES (
				'${note.name}',
				'${note.description}' `;
			query += `, 2, 1, @lastIdentity, 3, getdate(), getdate()`;
			query += `, ${userId}`;
			query += `, ${userId}`;
			query += `, getdate()`;

			if (note.assignedToUserId) {
				query += `, ${note.assignedToUserId}`;
			}

			query += `, 2`;

			if (note.assignedToRoleId) {
				query += `, ${note.assignedToRoleId}); `;
			}
			else {
				query += `); `;
			}
		}
		else {
			// update note
			query += `UPDATE Tasks SET Name = '${note.name}', Description = '${note.description}' WHERE id = ${note.taskId}; `;
		}
	}

	return query;
}

// Delete account value
exports.generateDeleteScorecardConceptValueQuery = function (savedFormId, scorecardConceptId) {
	return `DELETE ScorecardConceptsValues WHERE submissionId = ${savedFormId} and scorecardConceptId = ${scorecardConceptId}; `;
}

// Insert or update account value
exports.generateUpdateScorecardConceptValueQuery = function (hiringClientId, submissionId, scorecardConceptId, value, color, numericValue) {
	return ` SELECT @exists = count(*) FROM ScorecardConceptsValues WHERE submissionId = ${submissionId} AND scorecardConceptId = ${scorecardConceptId};
		IF @exists = 0
		BEGIN
		        INSERT INTO ScorecardConceptsValues
		         (HiringClientId,ScorecardConceptId,Value,Color,NumericValue,submissionId)
		         VALUES (${hiringClientId}, ${scorecardConceptId}, '${value}', ${color}, ${numericValue}, ${submissionId})
		END
		ELSE
		BEGIN
		        update ScorecardConceptsValues
		        set value = '${value}',
		        numericValue = ${numericValue},
		        color = ${color}
		        where submissionId = ${submissionId}
		        and scorecardConceptId = ${scorecardConceptId};
		END; `;
}





// Update submission values
exports.generateUpdateSubmissionValuesQuery = function (params) {
	let {
		savedFormId,
		scorecardSourceId,
		companyTypeId,
		dateOfFinancialStatement,
		dateOfFinancialStatementPrepared,
		dateOfPrequal,
		turnOverRateId,
		dateOfRenewal,
		analysisTypeId,
		financialStatementTypeId,
		commentary,
		finIsComplete
	} = params

	let query = `UPDATE SavedForms SET	`;

	if (dateOfFinancialStatement != null)
		query += ` dateOfFinancialStatement = '${dateOfFinancialStatement}', `

	if (dateOfFinancialStatementPrepared != null)
		query += ` dateOfFinancialStatementPrepared = '${dateOfFinancialStatementPrepared}', `
	else
		query += ` dateOfFinancialStatementPrepared = null, `

	if (dateOfPrequal != null)
		query += ` dateOfPrequal = '${dateOfPrequal}', `

	if (dateOfRenewal != null)
		query += ` dateOfRenewal = '${dateOfRenewal}', `

	query += ` scorecardSourceId = ${scorecardSourceId},
				    companyTypeId = ${companyTypeId},
				    turnOverRateId = ${turnOverRateId},
				    analysisTypeId = ${analysisTypeId}, `;

	if (commentary != null)
		query += ` commentary = '${commentary}', `;

	query += ` financialStatementTypeID = ${financialStatementTypeId} `;

	if (finIsComplete) {
		query += `, finIsComplete = ${finIsComplete}`;
		query += `, analysisCompleteDate = getDate()`;
		query += dateOfPrequal ? '' : `, dateOfPrequal = getDate()`;
	}

	query += ` WHERE id = ${savedFormId};`;

	// writeLog('SUBMISSION VALUES UPDATE '.repeat(10))
	// writeLog('params = ', params)
	// writeLog('query = ', query)

	return query;
}


// Get manual scorecards values
exports.generateGetManualScorecardConceptsValuesQuery = function (submissionId) {
	return ` SELECT scorecardConceptId, numericValue value FROM ScorecardConceptsValues
					 WHERE submissionId = ${submissionId} AND ScorecardConceptId IN (9, 10, 11, 12); `;
}

// Get CreditHistoryEvaluation PossibleValues
exports.generateGetCreditHistoryEvaluationPossibleValuesQuery = function () {
	return `SELECT id, name, color FROM zCreditHistoryEvaluation ORDER BY sortIndex`;
}

// Get LegalEvaluation PossibleValues
exports.generateGetLegalEvaluationPossibleValuesQuery = function () {
	return `SELECT id, name, color FROM zLegalEvaluation ORDER BY sortIndex`;
}

// Get ReferenceEvaluation PossibleValues
exports.generateGetReferenceEvaluationPossibleValuesQuery = function () {
	return `SELECT id, name, color FROM zReferenceEvaluation ORDER BY sortIndex`;
}

// Get BankLineEvaluation PossibleValues
exports.generateGetBankLineEvaluationPossibleValuesQuery = function () {
	return `SELECT id, name, color FROM zBankLineEvaluation ORDER BY sortIndex`;
}

// Get BankLineEvaluation PossibleValues
exports.generateGetAnalysisTypePossibleValuesQuery = function () {
	return `SELECT id, name FROM zScorecard_AnalysisType ORDER BY DisplayOrder`;
}

// Get Financial Statement Types PossibleValues
exports.generateGetFinancialStatementTypesPossibleValuesQuery = function () {
	return `SELECT id, name FROM zFinancialStatementTypes`;
}

exports.generateGetDiscreteAccountsQuery = function (paramter) {
	return `select  DA.Id as accountId,DA.Name accountName,
	(select count(Id) from AccountGroupVisibilityByForm where FormId=${paramter} and AccountGroupId=DA.AccountgroupId) as exist,
	(select DAV.Id from DiscreteAccountsValues DAV where DAV.SavedFormId = ${paramter} and DAV.AccountId = DA.id)  as discreteValueId,
	IsNull((select DAV.AccountValue from DiscreteAccountsValues DAV where DAV.SavedFormId = ${paramter} and DAV.AccountId = DA.id), 0) AccountValue,
	DAO.Value Options,
	DAO.Color Color,
	DA.OrderIndex
	from DiscreteAccounts DA,
	AccountsGroups AG,
	DiscreteAccountsOptions DAO,
	DiscreteAccounts_Forms DAF
	where AG.AccountGroupId=DA.AccountgroupId
	AND DAF.FormId=(select FormId from SavedForms where Id=${paramter})
	AND DAF.DiscreteAccountsId=DA.Id
	AND DAO.AccountId=DA.Id
	AND AG.Id=15
	order by DA.OrderIndex, DA.Id`;
}

// Insert or update account value
exports.generateUpdateDiscreteAccountQuery = function (savedFormId, accountId, value, note) {
	let query = `if exists (select Id from DiscreteAccountsValues where SavedFormId=${savedFormId} and AccountId=${accountId})
	begin
	 update DiscreteAccountsValues set AccountValue='${value}', TimeStamp=getdate() where SavedFormId=${savedFormId} and AccountId=${accountId};
	 select @lastIdentity=id from DiscreteAccountsValues where TimeStamp=(select MAX(TimeStamp) from DiscreteAccountsValues where SavedFormId=${savedFormId} and AccountId=${accountId});
	 end
	else
	begin
	insert  DiscreteAccountsValues (SavedFormId,AccountId,AccountValue) values (${savedFormId},${accountId},'${value}');
	select @lastIdentity=id from DiscreteAccountsValues where TimeStamp=(select MAX(TimeStamp) from DiscreteAccountsValues where SavedFormId=${savedFormId} and AccountId=${accountId});
	end;
	`;

	if (note) {

		query += `

		if exists (select Id from Tasks where Id=${note.taskId})
		begin
		 update Tasks set Name='${note.name}',Description='${note.description}' where Id=${note.taskId}
		end
		else
		begin
		 INSERT INTO Tasks
		 (Name, Description, TypeId, StatusId , AssetId, AssetTypeId,EnteredDate,ModifiedDate,DateDue,TasksPriorityId)
		 VALUES
		 ('${note.name}','${note.description}',2,2,@lastIdentity,2,getdate(),getdate(),getdate(),2)
		end;`;
	}

	return query;

}

exports.generetateSaveOrUpdateNoteDiscreteAccountQuery = function (note) {

	return `
	if exists (select Id from Tasks where Id=${note.taskId})
		begin
		 update Tasks set Name='${note.name}',Description='${note.description}' where Id=${note.taskId}
		end
		else
		begin
		 INSERT INTO Tasks
		 (Name, Description, TypeId, StatusId , AssetId, AssetTypeId,EnteredDate,ModifiedDate,DateDue,TasksPriorityId)
		 VALUES
		 ('${note.name}','${note.description}',2,2,${note.assignedToUserId},2,getdate(),getdate(),getdate(),2)
		end;
	`;
}

exports.generateGetTaskQuery = function (value) {
	return `select * from Tasks where AssetId in (${value})`;
}

exports.generateGetVisibilityDiscreteAccounts = function (FormId, accountGroupId) {
	return `  select count(Id) as exist from AccountGroupVisibilityByForm where FormId=${FormId} and AccountGroupId=${accountGroupId}`;
}

exports.generateGetFormDisplayTypeBySavedForm = function (savedFormId) {
	return `SELECT f.AccountDisplayTypeId FROM Forms f INNER JOIN SavedForms sf ON sf.FormId = f.Id WHERE sf.Id = ${savedFormId};`;
};

exports.generateGetFormHiddenScorecardFieldsBySavedForm = function (savedFormId) {
	return `SELECT shf.ScorecardFieldId id FROM ScorecardsHiddenFields shf INNER JOIN SavedForms sf ON sf.FormId = shf.FormId WHERE sf.Id = ${savedFormId};`;
};

exports.generateGetIsCovidFormBySavedForm = function (savedFormId) {
	return `
		SELECT COUNT(*) AS result
		FROM Forms
		WHERE Id IN (
			SELECT FormId FROM FormsSections WHERE Id IN (
				SELECT FormSectionId FROM FormsSectionsFields WHERE InternalName = '#covid19#'
			)
		)
		AND Id IN (SELECT FormId FROM SavedForms WHERE Id = ${savedFormId});
	`;
};
