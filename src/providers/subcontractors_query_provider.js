const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.generateSubcontractorsHeaderQuery = function (params) {
  const locationSelect = `
    (
      SELECT  sl.Address
      FROM    SubcontractorLocations sl
      WHERE   sl.SubcontractorID = ${params.subcontractorId}
      AND     sl.PrimaryLocation = 1
    ) address,
    (
      SELECT  sl.City
      FROM    SubcontractorLocations sl
      WHERE   sl.SubcontractorID = ${params.subcontractorId}
      AND     sl.PrimaryLocation = 1
    ) city,
    (
      SELECT  sl.State
      FROM    SubcontractorLocations sl
      WHERE   sl.SubcontractorID = ${params.subcontractorId}
      AND     sl.PrimaryLocation = 1
    ) state,
    (
      SELECT  sl.zipCode
      FROM    SubcontractorLocations sl
      WHERE   sl.SubcontractorID = ${params.subcontractorId}
      AND     sl.PrimaryLocation = 1
    ) zipCode,
    (
      SELECT  sl.Phone
      FROM    SubcontractorLocations sl
      WHERE   sl.SubcontractorID = ${params.subcontractorId}
      AND     sl.PrimaryLocation = 1
    ) phone`
  const query = `DECLARE @countSubmission INT;
  DECLARE @subcontractorId INT;
  DECLARE @hiringClientId INT;
  DECLARE @submissionId INT;
  SELECT  @subcontractorId = ${params.subcontractorId};
  SELECT  @hiringClientId = ${params.hiringClientId};
  SELECT  @countSubmission = 0;

  SELECT  @countSubmission = COUNT(*)
  FROM    SavedForms sf
  WHERE   sf.subcontractorID = @subcontractorId
  AND     sf.hiringClientId = @hiringClientId;

  SELECT  @submissionId = sf.id
  FROM    SavedForms sf
  WHERE		(
            @countSubmission > 1
            AND	  subcontractorID = @subcontractorID
            AND   sf.hiringClientId = @hiringClientId
            AND	  dateOfPrequal = (
                    SELECT  Max(sfi.dateOfPrequal)
                    FROM    SavedForms sfi
                    WHERE   sfi.subcontractorID = @subcontractorID
                    AND     sfi.hiringClientId = @hiringClientId
                  )
          )
  OR			(
            @countSubmission <= 1
            AND	subcontractorID = @subcontractorID
            AND sf.hiringClientId = @hiringClientId
          )

  IF @countSubmission > 0 AND @submissionId IS NOT NULL
  BEGIN
      SELECT  sfo.id savedFormId,
              (
                SELECT  s.name
                FROM    SubContractors s
                WHERE   s.id = sfo.subcontractorID
              ) name,
              ${locationSelect},
              (SELECT t.description FROM Hiringclients_SubContractors hs, Trades t WHERE hs.SubContractorId = sfo.subcontractorID AND hs.HiringClientId = sfo.HiringClientId AND t.id = hs.TradeId) trade,
              (SELECT ss.status FROM SubcontractorsStatus ss, Hiringclients_SubContractors hs WHERE hs.hiringClientId = sfo.hiringClientId AND hs.SubContractorId = sfo.subcontractorID AND hs.subcontractorStatusId = ss.id) subcontratorStatus,
              (SELECT hs.SubcontractorStatusId FROM Hiringclients_SubContractors hs WHERE hs.hiringClientId = sfo.hiringClientId AND hs.SubContractorId = sfo.subcontractorID ) subcontratorStatusId,
              (SELECT hs.OfficeLocation FROM Hiringclients_SubContractors hs WHERE hs.hiringClientId = sfo.hiringClientId AND hs.SubContractorId = sfo.subcontractorID ) OfficeLocation,
              sfo.dateOfPrequal,
              (SELECT CAST(t.id AS VARCHAR) + '-' + t.name FROM TierRatings t WHERE t.id IN (SELECT CASE WHEN sfsq.ManualTierId Is Null THEN sfsq.tieRating ELSE ManualTierId END FROM SavedForms sfsq WHERE sfsq.id = sfo.id)) tierRating,
              '$' + CAST(ROUND(singleProjectLimit, 0) AS VARCHAR) AS singleProjectLimit,
              '$' + CAST(ROUND(aggregateProjectExposure, 0) AS VARCHAR) as aggregateProjectExposure,
              (SELECT scv.value FROM ScorecardConceptsValues scv WHERE scorecardConceptid = 8 AND submissionId = @submissionId) profitability,
              (SELECT ct.name FROM CompaniesTypes ct WHERE ct.id = sfo.companyTypeId) companyType,
              (SELECT s.linkVisitedDate FROM SubContractors s WHERE s.id = sfo.subcontractorID ) linkVisitedDate,
              (SELECT s.contactFullName FROM SubContractors s WHERE s.id = sfo.subcontractorID ) contactFullName,
              (SELECT s.mainEmail FROM SubContractors s WHERE s.id = sfo.subcontractorID ) mainEmail,
              (SELECT s.enabled FROM SubContractors s WHERE s.id = sfo.subcontractorID ) enabled,
              sfo.FinIsComplete,
              (SELECT [option] FROM HiringClients WHERE Id = @hiringClientId) hcOption,
              (SELECT HiringClientRequestorName FROM Hiringclients_SubContractors WHERE HiringClientId = @hiringClientId AND SubContractorId = sfo.subcontractorID AND HiringClientId IN (SELECT Id FROM HiringClients WHERE [option] = 1)) requestorName,
              (SELECT HiringClientRequestorEmail FROM Hiringclients_SubContractors WHERE HiringClientId = @hiringClientId AND SubContractorId = sfo.subcontractorID AND HiringClientId IN (SELECT Id FROM HiringClients WHERE [option] = 1)) requestorEmail,
              (SELECT TemplateActivityId FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCactivityId,
              (SELECT Subject FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCSubject,
              (SELECT BodyHTML FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCBody,
              (SELECT FromAddress FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCFromAddress,
              (SELECT Id FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCtemplateId
      FROM    SavedForms sfo
      WHERE   sfo.id = @submissionId;
  END
  ELSE
  BEGIN
      SELECT  null savedFormId,
              s.name,
              ${locationSelect},
              (SELECT t.description FROM Hiringclients_SubContractors hs, Trades t WHERE hs.SubContractorId = @subcontractorId AND hs.HiringClientId = @hiringClientId AND t.id = hs.TradeId) trade,
              null dateOfPrequal,
              (SELECT ss.status FROM SubcontractorsStatus ss, Hiringclients_SubContractors hs WHERE hs.hiringClientId = @hiringClientId AND hs.SubContractorId = s.Id AND hs.subcontractorStatusId = ss.id) subcontratorStatus,
              (SELECT hs.SubcontractorStatusId FROM Hiringclients_SubContractors hs WHERE hs.hiringClientId = @hiringClientId AND hs.SubContractorId = s.Id ) subcontratorStatusId,
              (SELECT hs.OfficeLocation FROM Hiringclients_SubContractors hs WHERE hs.hiringClientId = @hiringClientId AND hs.SubContractorId = s.Id ) OfficeLocation,
              null tierRating,
              null singleProjectLimit,
              null aggregateProjectExposure,
              null profitability,
              null companyType,
              s.linkVisitedDate,
              s.contactFullName,
              s.mainEmail,
              s.enabled,
              null FinIsComplete,
              (SELECT [option] FROM HiringClients WHERE Id = @hiringClientId) hcOption,
              (SELECT HiringClientRequestorName FROM Hiringclients_SubContractors WHERE HiringClientId = @hiringClientId AND SubContractorId = @subcontractorID AND HiringClientId IN (SELECT Id FROM HiringClients WHERE [option] = 1)) requestorName,
              (SELECT HiringClientRequestorEmail FROM Hiringclients_SubContractors WHERE HiringClientId = @hiringClientId AND SubContractorId = @subcontractorID AND HiringClientId IN (SELECT Id FROM HiringClients WHERE [option] = 1)) requestorEmail,
              (SELECT TemplateActivityId FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCactivityId,
              (SELECT Subject FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCSubject,
              (SELECT BodyHTML FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCBody,
              (SELECT FromAddress FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCFromAddress,
              (SELECT Id FROM TemplatesMessagesToHiringClients WHERE HiringClientId = @hiringClientId) emailToHCtemplateId
      FROM    Subcontractors s
      WHERE   s.id = @subcontractorId;
  END  `;

  // console.log(JSON.stringify(params))
  // console.log(query);

  return query;
}

exports.generateUpdateSCnameQuery = (queryParams) => {
  const {
    scId,
    subName
  } = queryParams
  const query = ` UPDATE	SubContractors
                  SET		  Name = '${subName}'
                  WHERE	  Id = ${scId}`
  return query;
}

exports.generateSubContractorTieRatesQuery = function () {
  return `SELECT Id, Name FROM TierRatings ORDER BY Id ASC`;
}

exports.generateHiringClientsBySubContractorQuery = function(subcontractorId, currentUserId) {
  let query = `sp_GetHiringClientList ${currentUserId}, ${subcontractorId}`;

  return query;
}

exports.generateSubContractorsContactQuery = function (subcontractorId) {
  let query = `
    SELECT id,
      name,
      address,
      city,
      state,
      zipCode,
      mainEmail,
      timeStamp,
      contactFullName,
      contactPhone
    FROM SubContractors
    WHERE id = ${subcontractorId}
  `;

  return query;
}

exports.generateSubContractorsUserRelationsUpdateQuery = function (queryParams) {
  let query = `DELETE FROM Users_SubContractors WHERE UserId = ${queryParams.userId} `;

  query += `INSERT INTO Users_SubContractors (
    UserId,
    SubContractorId)
  VALUES `;

  for (let subContractorId of queryParams.subContractorIds) {
    query += `(${queryParams.userId}, ${subContractorId}),`;
  }

  // remove last comma.
  query = query.slice(0, -1);

  return query;
}

exports.generateFetchExistingUserQuery = function (user) {
  const query = `SELECT Id FROM Users WHERE Mail = '${user.email}'`
  return query
}

exports.generateFetchExistingSubcontractorQuery = function (subcontractor) {
  const query = `
    SELECT	SubcontractorId
    FROM	  Hiringclients_SubContractors
    WHERE	  SubContractorId = (
              SELECT	Id
              FROM	  SubContractors
              WHERE	  TaxID = '${subcontractor.taxId}'
            )
    AND		  HiringClientId = ${subcontractor.hiringClientId}`

  return query
}

exports.getFetchExistingSubcontractorFormQuery = function (subcontractor) {
  const query = `
    DECLARE	@FormId INT;

    SELECT	@FormId			              = FormId
    FROM	  Hiringclients_SubContractors
    WHERE	  SubContractorId           = ${subcontractor.id}
    AND		  HiringClientId	          = ${subcontractor.hiringClientId}

    IF @FormId > 0
      BEGIN
        SELECT @FormId FormId
      END
    ELSE
      BEGIN
        SELECT TOP 1  id
        AS			      FormId
        FROM		      Forms
        WHERE		      HiringClientID	= ${subcontractor.hiringClientId}
        AND			      isDefault		    = 1
      END`

  return query
}

exports.generateSubContractorsInsertQuery = function (subContractor) {

  let query = `INSERT INTO SubContractors (
    Name,
    Address,
    City,
    State,
    ZipCode,
    MainEmail,
    TaxID,
    ContactFullName,
    ContactPhone,
    pqEnabled
    ) VALUES (
    '${subContractor.companyName}',
    '',
    '',
    '',
    '',
    '${subContractor.mail}',
    '${subContractor.taxId}',
    '${subContractor.contactName}',
    '${subContractor.phone}',
    1
    ) `;

  return query;
}

exports.updateHC_SC_StatusByTaxId = function (hiringClientId, taxId, subcontractorStatusID, formId) {
  const shouldResetParams = subcontractorStatusID == 4 || subcontractorStatusID == 5 || subcontractorStatusID == 7
  let query = ` UPDATE  Hiringclients_SubContractors
                SET     FormID                = ${formId},
                        SubcontractorStatusID = ${subcontractorStatusID},
                        MustPay               = (
                                                SELECT	CASE
                                                          WHEN	SubcontractorFee > 0 THEN 1
                                                          ELSE	0
                                                        END AS	MustPay
                                                FROM	Forms
                                                WHERE	Id = ${formId}
                                              )`

  if (shouldResetParams) {
    query += `                                 ,
                        WFStepIndex         = 1,
                        wfIterationCount    = 1,
                        wfIterationTimeStamp = getDate()`
  }
  query += `
                WHERE   HiringClientId = ${hiringClientId}
                AND     SubContractorId IN (
                          SELECT TOP 1  Id
                          FROM          SubContractors
                          WHERE         TaxId = '${taxId}'
                        ) `

  return query;
}

exports.updateHC_SC_StatusById = function (hiringClientId, subcontractorId, subcontractorStatusID, formId) {
  // console.log('updateHC_SC_StatusById query: ')
  // console.log('hiringClientId = ', hiringClientId)
  // console.log('subcontractorId = ', subcontractorId)
  // console.log('subcontractorStatusID = ', subcontractorStatusID)
  // console.log('formId = ', formId)
  const shouldResetParams = subcontractorStatusID == 4 || subcontractorStatusID == 5 || subcontractorStatusID == 7
  let query = `
        UPDATE  Hiringclients_SubContractors
        SET     FormID                = ${formId},
                subcontractorStatusID = ${subcontractorStatusID}`

  if (formId > 0) {
    query += `,
                MustPay                = (
                                          SELECT	CASE
                                                    WHEN	SubcontractorFee > 0 THEN 1
                                                    ELSE	0
                                                  END AS	MustPay
                                          FROM	Forms
                                          WHERE	Id = ${formId}
                                        )`
  }

  if (shouldResetParams) {
    query += `,
                WFStepIndex            = 1,
                wfIterationCount       = 1,
                wfIterationTimeStamp = getDate()`
  }
  query += `
        WHERE
        HiringClientId                 = ${hiringClientId}
        AND SubContractorId            = ${subcontractorId} `;

  // console.log('query = ', query)

  return query;
}

exports.generateFetchSubcontractorsForPopoverQuery = (userId) => {
  const query = `
  SELECT		  name,
              id
  FROM		    SubContractors
  INNER JOIN	Users_SubContractors us
  ON          us.SubContractorId = id
  WHERE		    us.userId = ${userId}

  UNION

  SELECT		  s.name,
              s.id
  FROM		    Hiringclients_SubContractors
  INNER JOIN	SubContractors s
  ON          s.id = SubContractorId
  INNER JOIN  Users_HiringClients uh
  ON          uh.userId = ${userId}`
  return query
}

exports.generateSubContractorsQuery = function (params) {
  console.log('params', params);
  let whereClause = null;
  let fromClause = null;
  let orderClause = null;
  let fieldsClause = ``;

  let query = `SELECT `;

  let id = params.id;

  if (params.method === 'userId') {

    fromClause = ` FROM SubContractors SC `;

    whereClause = `WHERE (SC.id IN (SELECT us.subcontractorId FROM Users_SubContractors us WHERE us.userId = ${params.userId}) OR
                                    (1 IN (SELECT RoleId FROM Users WHERE Id = ${params.userId})) OR
                                    (2 IN (SELECT RoleId FROM Users WHERE Id = ${params.userId})) OR
                                    (3 IN (SELECT RoleId FROM Users WHERE Id = ${params.userId})) OR
                                    (5 IN (SELECT RoleId FROM Users WHERE Id = ${params.userId})) OR
                                    (6 IN (SELECT RoleId FROM Users WHERE Id = ${params.userId}))
                          ) `;

    if (params.searchTerm ||
      params.searchByHCId ||
      params.searchByStatusId ||
      params.searchByTradeId ||
      params.searchByTierRatingId ||
      params.searchByStateName ||
      params.searchByMaxSingleLimit ||
      params.searchByMaxAggregateLimit
    ) {

      let searchTerm = params.searchTerm;
      let searchByHCId = params.searchByHCId;
      let searchByStatusId = params.searchByStatusId;
      let searchByTradeId = params.searchByTradeId;
      let searchByTierRatingId = params.searchByTierRatingId;
      let searchByStateName = params.searchByStateName;
      let searchByMaxSingleLimit = params.searchByMaxSingleLimit;
      let searchByMaxAggregateLimit = params.searchByMaxAggregateLimit;

      if (searchTerm)
        whereClause += ` AND (SC.Name LIKE '%${searchTerm}%' OR SC.TaxID LIKE '%${searchTerm}%') `;

      if (searchByHCId && !searchByStatusId)
        whereClause += ` AND SC.Id IN (SELECT SubContractorId FROM Hiringclients_SubContractors WHERE HiringClientId = ${searchByHCId}) `;

      if (searchByStatusId)
        whereClause += ` AND SC.Id IN (SELECT SubcontractorId FROM Hiringclients_SubContractors WHERE HiringClientId = ${searchByHCId} and SubcontractorStatusId = ${searchByStatusId}) `;

      if (searchByStateName)
        whereClause += ` AND (SC.State LIKE '%${searchByStateName}%') `;

      if (searchByTradeId)
        // Check if one of the SC from the Hiringclients_Subcontractors has a relation where one of those trades id exists
        whereClause += ` AND (
          ((SELECT COUNT(*) FROM Hiringclients_SubContractors HS WHERE HS.SubContractorId = SC.Id AND HS.TradeId IN (SELECT id FROM Trades WHERE value IN (SELECT value FROM Trades WHERE id = ${searchByTradeId}))) > 0) OR
          ((SELECT COUNT(*) FROM Hiringclients_SubContractors HS WHERE HS.SubContractorId = SC.Id AND HS.SecondaryTradeId IN (SELECT id FROM Trades WHERE value IN (SELECT value FROM Trades WHERE id = ${searchByTradeId}))) > 0) OR
          ((SELECT COUNT(*) FROM Hiringclients_SubContractors HS WHERE HS.SubContractorId = SC.Id AND HS.TertiaryTradeId IN (SELECT id FROM Trades WHERE value IN (SELECT value FROM Trades WHERE id = ${searchByTradeId}))) > 0) OR
          ((SELECT COUNT(*) FROM Hiringclients_SubContractors HS WHERE HS.SubContractorId = SC.Id AND HS.QuaternaryTradeId IN (SELECT id FROM Trades WHERE value IN (SELECT value FROM Trades WHERE id = ${searchByTradeId}))) > 0) OR
          ((SELECT COUNT(*) FROM Hiringclients_SubContractors HS WHERE HS.SubContractorId = SC.Id AND HS.QuinaryTradeId IN (SELECT id FROM Trades WHERE value IN (SELECT value FROM Trades WHERE id = ${searchByTradeId}))) > 0)
        ) `;

      if (searchByTierRatingId)
        whereClause += ` AND ${searchByTierRatingId} IN (SELECT TieRating FROM savedForms WHERE id IN (SELECT TOP 1 id FROM SavedForms WHERE subcontractorId = SC.id ORDER BY id DESC)) `;

      if (id)
        whereClause += ` AND SC.id = ${id} `;

      if (searchByMaxSingleLimit)
        whereClause += ` AND ${searchByMaxSingleLimit} = ${searchByMaxSingleLimit} `;

      if (searchByMaxAggregateLimit)
        whereClause += ` AND ${searchByMaxAggregateLimit} = ${searchByMaxAggregateLimit} `;

    }


  } else if (params.method === 'list') {
    fromClause = ` FROM SubContractors SC `;
  }

  if (params.fields) {
    for (let i = 0; i < params.fields.length; i++) {
      fieldsClause += `SC.${params.fields[i]},`

      if (i === params.fields.length - 1) {
        fieldsClause = fieldsClause.slice(0, -1);
      }
    }
  }
  else {
    let searchByHCId = params.searchByHCId;

    fieldsClause = `SC.id, SC.name, SC.address, SC.city, SC.state, SC.zipCode, SC.mainEmail, SC.taxID, `;

    // Since trades were moved to the Hiringclients_SubContractors table, trades can only be get when the searchByHCId param is present
    if (searchByHCId) {
      fieldsClause += `
        (SELECT TradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId}) AS tradeId,
        (SELECT T.Value FROM Trades T WHERE T.Id = (SELECT TradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS mainTradeId,
        (SELECT T.Description FROM Trades T WHERE T.Id = (SELECT TradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS mainTrade,

        (SELECT SecondaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId}) AS SecondaryTradeId,
        (SELECT T.Value FROM Trades T WHERE T.Id = (SELECT SecondaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS secondTradeId,
        (SELECT T.Description FROM Trades T WHERE T.Id = (SELECT SecondaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS secondTrade,

        (SELECT TertiaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId}) AS TertiaryTradeId,
        (SELECT T.Value FROM Trades T WHERE T.Id = (SELECT TertiaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS tertTradeId,
        (SELECT T.Description FROM Trades T WHERE T.Id = (SELECT TertiaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS tertTrade,

        (SELECT QuaternaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId}) AS QuaternaryTradeId,
        (SELECT T.Value FROM Trades T WHERE T.Id = (SELECT QuaternaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS quatTradeId,
        (SELECT T.Description FROM Trades T WHERE T.Id = (SELECT QuaternaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS quatTrade,

        (SELECT QuinaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId}) AS quinaryTradeId,
        (SELECT T.Value FROM Trades T WHERE T.Id = (SELECT QuinaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS quinTradeId,
        (SELECT T.Description FROM Trades T WHERE T.Id = (SELECT QuinaryTradeId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.id AND HiringClientId = ${searchByHCId})) AS quinTrade,
      `;
    }

    if (!searchByHCId) {
      fieldsClause += `
      (SELECT Status FROM SubcontractorsStatus WHERE Id IN (SELECT TOP 1 SubcontractorStatusId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.Id)) AS status,
      ISNULL((SELECT id FROM TierRatings WHERE id IN (SELECT TOP 1 CASE WHEN ManualTierId Is Null THEN tieRating ELSE ManualTierId END FROM SavedForms WHERE subcontractorId = SC.id ORDER BY id DESC)), 5) tierId,
      ISNULL((SELECT name FROM TierRatings WHERE id IN (SELECT TOP 1 CASE WHEN ManualTierId Is Null THEN tieRating ELSE ManualTierId END  FROM SavedForms WHERE subcontractorId = SC.id ORDER BY id DESC)), 'Not rated') tierDesc,
      ISNULL((SELECT colorDesc FROM TierRatings WHERE id IN (SELECT TOP 1 CASE WHEN ManualTierId Is Null THEN tieRating ELSE ManualTierId END  FROM SavedForms WHERE subcontractorId = SC.id ORDER BY id DESC)), 'Yellow') tierColor `;
    }
    else {
      fieldsClause += `
      (SELECT Status FROM SubcontractorsStatus WHERE Id IN (SELECT SubcontractorStatusId FROM Hiringclients_SubContractors WHERE SubContractorId = SC.Id AND HiringClientId = ${searchByHCId})) AS status,
      (SELECT [option] FROM HiringClients WHERE Id = ${params.searchByHCId}) AS hcOption,
      (SELECT HiringClientRequestorName FROM Hiringclients_SubContractors WHERE HiringClientId = ${searchByHCId} AND SubContractorId = SC.Id AND HiringClientId IN (SELECT Id FROM HiringClients WHERE [option] = 1)) AS requestorName,
      (SELECT HiringClientRequestorEmail FROM Hiringclients_SubContractors WHERE HiringClientId = ${searchByHCId} AND SubContractorId = SC.Id AND HiringClientId IN (SELECT Id FROM HiringClients WHERE [option] = 1)) AS requestorEmail,
      ISNULL((SELECT id FROM TierRatings WHERE id IN (SELECT TOP 1 CASE WHEN ManualTierId Is Null THEN tieRating ELSE ManualTierId END  FROM SavedForms WHERE subcontractorId = SC.id AND hiringClientId = ${searchByHCId} ORDER BY id DESC)), 5) tierId,
      ISNULL((SELECT name FROM TierRatings WHERE id IN (SELECT TOP 1 CASE WHEN ManualTierId Is Null THEN tieRating ELSE ManualTierId END  FROM SavedForms WHERE subcontractorId = SC.id AND hiringClientId = ${searchByHCId} ORDER BY id DESC)), 'Not rated') tierDesc,
      ISNULL((SELECT colorDesc FROM TierRatings WHERE id IN (SELECT TOP 1 CASE WHEN ManualTierId Is Null THEN tieRating ELSE ManualTierId END  FROM SavedForms WHERE subcontractorId = SC.id AND hiringClientId = ${searchByHCId} ORDER BY id DESC)), 'Yellow') tierColor `;
    }

  }

  if (params.getTotalCount == true) {
    fieldsClause = ` COUNT(*) totalCount `;
  }


  query += fieldsClause;

  query += fromClause;


  if (whereClause == null) whereClause = ` WHERE 1 = 1 `;
  if (id) whereClause += ` AND SC.id = ${id} `;

  // Filter disabled SCs
  whereClause += ` AND IsNUll(enabled, 1) <> 0 AND pqEnabled = 1`;

  query += whereClause;

  orderClause = `ORDER BY SC.Name ASC `;

  if (params.orderBy) {
    orderClause = `ORDER BY ${params.orderBy} `;

    if (params.orderDirection) {
      orderClause += ` ${params.orderDirection} `;
    }
  }

  if (params.getTotalCount == false)
    query += orderClause;

  if (params.pageSize && params.getTotalCount == false) {
    let pageSize = params.pageSize
    let pageNumber = params.pageNumber
    query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
  }

  // console.log('GET SUBS '.repeat(50));
  // console.log('\n')
  // console.log(params)
  // console.log('\n')
  console.log('QUERY', query);

  return query;
}

exports.generateHC_SCInitialEntry = function (hiringClientId, subcontractorId, subcontractorStatusID, sourceSystemId, formId, requestorName, requestorEmail) {
  const formName = `(SELECT	Top 1 Id FROM Forms WHERE HiringClientId = ${hiringClientId} AND isDefault = 1)`;

  const query = `
    INSERT INTO Hiringclients_SubContractors (
      HiringClientId,
      SubContractorId,
      SubcontractorStatusID,
      WFStepIndex,
      sourceSystemId,
      TradeId,
      FormID
      ${(requestorName && requestorEmail) ? ', HiringClientRequestorName, HiringClientRequestorEmail' : ''}
    )
    VALUES (
      ${hiringClientId},
      ${subcontractorId},
      ${subcontractorStatusID},
      1,
      '${sourceSystemId}',
      0,
      ${formId && formId != '0' ? formId : formName}
      ${(requestorEmail && requestorName) ? `, '${requestorName}'` : ''}
      ${(requestorEmail && requestorName) ? `, '${requestorEmail}'` : ''}
    )
  `;

  return query;
}

exports.generateSubContractorsBriefQuery = function (hiringClientId) {
  return ` SELECT id, name FROM SubContractors WHERE id IN
              (SELECT subContractorId FROM Hiringclients_SubContractors WHERE hiringClientId = ${hiringClientId})
              ORDER BY name `;
}

exports.generateSubContractorBriefQuery = function (subcontractorId) {
  return `SELECT id, name, contactFullName fullName, contactPhone phone, mainEmail email, linkVisitedDate
           FROM SubContractors WHERE id = ${subcontractorId}`;
}

exports.generateUpdateSCBasicParamsQuery = function (params) {
  let subcontractorId = params.subcontractorId;
  let contactEmail = params.contactEmail;
  let contactPhone = params.contactPhone;
  let contactFullName = params.contactFullName;

  return `UPDATE Subcontractors SET contactFullName = '${contactFullName}',
              mainEmail = '${contactEmail}',
              ContactPhone = '${contactPhone}'
              WHERE id = ${subcontractorId}`;
}

exports.generateCheckUserByEmailQuery = function (subcontractorId) {
  return `DECLARE @exists INT;
            DECLARE @userId INT;
            DECLARE @relationExists INT;
            SELECT @exists = COUNT(*) FROM Users WHERE mail in (SELECT mainEmail FROM SubContractors WHERE id = ${subcontractorId});
            SELECT @exists userExists;`;
}

exports.generateGetSCTaxIdExistsQuery = function (subcontractor) {
  let taxId = '0';
  if (subcontractor.taxId) {
    taxId = subcontractor.taxId;
  }

  return `SELECT IsNull(id, 0) subcontractorId
           FROM SubContractors WHERE taxId = '${taxId}'`;
}

exports.generateGetSCLocationExistsQuery = function (subcontractor) {
  let taxId = '0';
  if (subcontractor.taxId) {
    taxId = subcontractor.taxId;
  }

  const {
    address,
    city,
    zipcode,
    countryId
  } = subcontractor

  const query = `
    DECLARE @Address  varchar(150)
    DECLARE @City     varchar(150)
    DECLARE @State    varchar(100)
    DECLARE @ZipCode  varchar(10)
    DECLARE @CountryID  int

    SET		  @Address   = ( SELECT Address   FROM SubContractors where TaxID = '${taxId}' )
    SET		  @City      = ( SELECT City      FROM SubContractors where TaxID = '${taxId}' )
    SET		  @State     = ( SELECT State     FROM SubContractors where TaxID = '${taxId}' )
    SET		  @ZipCode   = ( SELECT ZipCode   FROM SubContractors where TaxID = '${taxId}' )
    SET		  @CountryID = ( SELECT CountryId FROM SubContractors where TaxID = '${taxId}' )

    SELECT  (
              SELECT	CASE
                        WHEN @Address like '${address}' THEN 1
                        ELSE 0
                      END
            ) addressExists,
            (
              SELECT	CASE
                        WHEN @City like '${city}' THEN 1
                        ELSE 0
                      END
            ) cityExists,
            (
              SELECT	CASE
                        WHEN @CountryID = ${countryId} THEN 1
                        ELSE 0
                      END
            ) countryExists,
            (
              SELECT	CASE
                        WHEN @ZipCode like '${zipcode}' THEN 1
                        ELSE 0
                      END
            ) ZipCodeExists`;

  console.log('location exists query = ', query)

  return query
}

exports.generateFullSubContractorsInsertQuery = function (subcontractor) {
  // If this method needs to be used again, move the trade ids to the Hirinclients_Subcontractors table
  const {
    id,
    companyName,
    tradeId,
    secTradeId,
    terTradeId,
    quatTradeId,
    quinTradeId,
    address,
    city,
    state,
    zipcode,
    mainEmail,
    taxId,
    countryId
  } = subcontractor

  if (!companyName) companyName = '';
  if (!tradeId) tradeId = 0;
  if (!secTradeId) secTradeId = 0;
  if (!terTradeId) terTradeId = 0;
  if (!quatTradeId) quatTradeId = 0;
  if (!quinTradeId) quinTradeId = 0;
  if (!address) address = '';
  if (!city) city = '';
  if (!state) state = '';
  if (!zipcode) zipcode = '';
  if (!mainEmail) mainEmail = '';
  if (!taxId) taxId = '';
  if (!countryId) countryId = 0;

  let query = ` INSERT INTO   SubContractors (
                                Name,
                                TradeId,
                                SecondaryTradeId,
                                TertiaryTradeId,
                                QuaternaryTradeId,
                                QuinaryTradeId,
                                Address,
                                City,
                                State,
                                ZipCode,
                                MainEmail,
                                TaxID,
                                CountryId,
                                enabled
                              )
                              VALUES (
                                '${companyName}',
                                ${tradeId},
                                ${secTradeId},
                                ${terTradeId},
                                ${quatTradeId},
                                ${quinTradeId},
                                '${address}',
                                '${city}',
                                '${state}',
                                '${zipcode}',
                                '${mainEmail}',
                                '${taxId}',
                                ${countryId},
                                0
                              ); `;
  // console.log('generateFullSubContractorsInsertQuery = ', query)
  return query;
}

exports.generateSwapNewSCIDwithOldInHC_SCQuery = function (subcontractor) {
  const tradeId = subcontractor.tradeId;
  const secTradeId = subcontractor.secTradeId;
  const terTradeId = subcontractor.terTradeId;
  const quatTradeId = subcontractor.quatTradeId;
  const quinTradeId = subcontractor.quinTradeId;

  const query = `
    BEGIN TRANSACTION;
      UPDATE  Hiringclients_SubContractors
      SET     SubContractorId       = ${subcontractor.subcontractorIdExists},
              SubContractorStatusID = 4,

              TradeId = ${tradeId},
              SecondaryTradeId = ${secTradeId},
              TertiaryTradeId = ${terTradeId},
              QuaternaryTradeId = ${quatTradeId},
              QuinaryTradeId = ${quinTradeId}

      WHERE   SubContractorId       = ${subcontractor.id}
      AND     HiringClientId        = ${subcontractor.hiringClientId}

      UPDATE  Subcontractors
		  SET     enabled = 1, pqEnabled = 1
		  WHERE   id = ${subcontractor.subcontractorIdExists};

    COMMIT;
  `
  // console.log('generateSwapOldSCwithNewSCQuery = ', query)
  return query
}

exports.generateUpdateDuplicateSCQuery = function (subcontractor) {
  const query = `
    UPDATE  Subcontractors
    SET     enabled = 0
    WHERE   id = ${subcontractor.id}; `
  return query
}

exports.generateUpdateSCQuery = function (subcontractor) {
  let subcontractorId = subcontractor.id;
  let hiringClientId = subcontractor.hiringClientId;
  let companyName = subcontractor.companyName;
  let tradeId = subcontractor.tradeId;
  let secTradeId = subcontractor.secTradeId;
  let terTradeId = subcontractor.terTradeId;
  let quatTradeId = subcontractor.quatTradeId;
  let quinTradeId = subcontractor.quinTradeId;
  let address = subcontractor.address;
  let city = subcontractor.city;
  let state = subcontractor.state;
  let zipcode = subcontractor.zipcode;
  let mainEmail = subcontractor.mainEmail;
  let taxId = subcontractor.taxId;
  let countryId = subcontractor.countryId;

  let query = `
    UPDATE  Subcontractors
    SET     name = '${companyName}',
            address = '${address}',
            city = '${city}',
            state = '${state}',
            zipcode = '${zipcode}',`;

  // If country is USA then update the TAX id
  if (countryId == 1 || taxId) {
    query += `
            taxId = '${taxId}',`;
  }

  query += `
            countryId = '${countryId}',
            enabled = 1,
            mainEmail = '${mainEmail}'
    WHERE   id = ${subcontractorId}; `;

  // Update trades on the Hiringclients_SubContractors table
  query += `
    UPDATE Hiringclients_SubContractors
    SET
      TradeId = ${tradeId},
      SecondaryTradeId = ${secTradeId},
      TertiaryTradeId = ${terTradeId},
      QuaternaryTradeId = ${quatTradeId},
      QuinaryTradeId = ${quinTradeId}
    WHERE
      HiringClientId = ${hiringClientId}
      AND SubContractorId = ${subcontractorId};
  `;

  return query;
}

exports.generateInsertSubcontractorLocationQuery = (subcontractor, user, isPrimaryLocation) => {
  const {
    id,
    address,
    city,
    state,
    zipcode,
    countryId,
    // comments,
    mainEmail
  } = subcontractor

  let subcontractorId = id

  if (subcontractor.subcontractorIdExists) {
    subcontractorId = subcontractor.subcontractorIdExists;
  }

  const {
    firstName,
    lastName,
    //  fax,
    phone
  } = user

  const query = `exec sp_insert_update_locationbyID ${subcontractorId},
                                                      0,
                                                      ${isPrimaryLocation},
                                                      '${address}',
                                                      '${city}',
                                                      '${state}',
                                                      '${zipcode}',
                                                      ${countryId},
                                                      NULL,
                                                      1,
                                                      '${phone}',
                                                      NULL,
                                                      '${firstName + ' ' + lastName}',
                                                      '${mainEmail}'`

  // console.log('SUB LOCATION QUERY in regular Registration '.repeat(3))
  // console.log('query = ', query)
  return query
}

exports.generateGetSubTaxIDByUserId = (userId) => {
  const query = `
    SELECT	TaxID
    FROM	  SubContractors
    WHERE	  Id IN (
              SELECT	SubContractorId
              FROM	Users_SubContractors
              WHERE	UserId = ${userId}
            )`
  return query
}

exports.generateAddUserQuery = function (user) {
  const {
    firstName,
    lastName,
    titleId,
    phone,
    cellPhone,
    email
  } = user

  const pass = crypto.createHash('md5').update(user.pass).digest('hex');;

  const query = `
    INSERT INTO Users (
      FirstName,
      LastName,
      Mail,
      Password,
      RoleID,
      IsEnabled,
      TitleId,
      Phone,
      CellPhone,
      TimeZoneId,
      MustRenewPass,
      MustUpdateProfile
    ) VALUES (
      '${firstName}',
      '${lastName}',
      '${email}',
      '${pass}',
      4,
      1,
      ${titleId},
      '${phone}',
      '${cellPhone}',
      0,
      0,
      0
      );

     SELECT @userId = IDENT_CURRENT('Users');`;


  // VALUES (FirstName, LastName, Email, Password, Role Id > 4 = Subcontractor, IsEnabled, TitleId, Phone, Cellphone, TimeZoneId, Must renew pass, Must update profile)

  // console.log('generateAddUserQuery = ', query)
  return query;
}

exports.generateUserSCQuery = function (subcontractor) {
  let subcontractorId = subcontractor.id;
  if (subcontractor.subcontractorIdExists) {
    subcontractorId = subcontractor.subcontractorIdExists;
  }
  let userId = subcontractor.userIdExists ? subcontractor.userIdExists : '@userId'

  const query = `
    INSERT INTO   Users_SubContractors (
                    UserId,
                    SubContractorId,
                    IsContact
                  ) VALUES (
                    ${userId},
                    ${subcontractorId},
                    1
                  );`; // Is Contact = 1

  // console.log('generateUserSCQuery = ', query)
  return query;
}

exports.generateUpdateHCofficeLocationQuery = (queryParams) => {
  const {
    subcontractorId,
    hiringClientId,
    location
  } = queryParams

  const query = ` UPDATE	Hiringclients_SubContractors
                  SET		  OfficeLocation = '${location}'
                  WHERE	  HiringClientId = ${hiringClientId}
                  AND		  SubContractorId = ${subcontractorId}`
  return query
}

exports.generateUpdateManualSCTierRatingAndInsertIntoSavedFormsLogTransactionQuery = function (queryParams) {
  const {
    subcontractorId,
    hcId,
    tierRatingId,
    aggregateProjectExposure,
    singleProjectLimit,
    commentary
  } = queryParams

  let query = ` BEGIN TRANSACTION;
                DECLARE			  @ID int;
                SET	    			@ID = (
                                SELECT      TOP 1 id
                                FROM        SavedForms
                                WHERE		    SubContractorId = ${subcontractorId}
                                AND			    FinIsComplete = 1
                                AND			    HiringClientId = ${hcId}
                                ORDER BY    timestamp DESC
                              )

                INSERT INTO		SavedFormLogs (
                                HiringClientID,
                                SubcontractorID,
                                NewTierRating,
                                NewSingleProjectLimit,
                                NewAggregateProjectLimit,
                                Comment,
                                TimeStamp,
                                SavedFormID,
                                OldTierRating,
                                OldSingleProjectLimit,
                                OldAggregateProjectLimit
                              )
                SELECT			  ${hcId},
                              ${subcontractorId},
                              ${tierRatingId},
                              ${singleProjectLimit},
                              ${aggregateProjectExposure},
                              '${commentary}',
                              GETDATE(),
                              Id,
                              tieRating,
                              singleProjectLimit,
                              aggregateProjectExposure
                FROM			    SavedForms
                WHERE			    id = @ID

                UPDATE			  SavedForms
                SET				    ManualTierId = ${tierRatingId},
                              tieRating = ${tierRatingId},
                              aggregateProjectExposure = ${aggregateProjectExposure},
                              singleProjectLimit = ${singleProjectLimit}
                              WHERE			Id = @ID;

                COMMIT; `;

  // console.log('-=-='.repeat(200))
  // console.log('queryParams = ', queryParams)
  // console.log('query = ', query)
  // console.log('-=-='.repeat(200))

  return query
}

exports.checkMailExistsQuery = function (mail) {
  return ` select count(*) mailExists from Users where mail = '${mail}' `;
}

exports.getSubmissionQuery = function (hiringClientId, subcontractorId) {
  return ` SELECT top 1 id, formId FROM SavedForms WHERE subContractorId = ${subcontractorId}
           and hiringClientId = ${hiringClientId} and isComplete <> 1 order by id desc `;
}

exports.addSavedFormsRegisterQuery = function (subcontractor) {
  let subcontractorId = subcontractor.id;
  const formId = subcontractor.formId
  if (subcontractor.subcontractorIdExists) {
    subcontractorId = subcontractor.subcontractorIdExists;
  }
  const hiringClientId = subcontractor.hiringClientId;

  const query = `
    DECLARE       @formUserId INT

    SELECT        @formUserId     = userId
    FROM          Forms
    WHERE         HiringClientId  = ${hiringClientId}
    AND           Id              = ${formId}

    INSERT INTO   SavedForms (
                    FormId,
                    UserId,
                    SubcontractorID,
                    HiringClientId,
                    IsComplete,
                    TurnOverRateId
                  ) VALUES (
                    ${formId},
                    @formUserId,
                    ${subcontractorId},
                    ${hiringClientId},
                    0,
                    3
                  );`

  // console.log('REGISTER '.repeat(50))
  // console.log('addSavedFormsRegisterQuery = ', query)
  // console.log('subcontractor = ', subcontractor)
  // console.log('SavedFormNeedsInsert = ', SavedFormNeedsInsert)
  return query
}

exports.generateSimpleLocationQuery = (subcontractorId) => {
  const query = `
    SELECT  Id SubcontractorID,
            Address,
            City,
            State,
            zipCode ZipCode,
            CountryId CountryID,
            ContactFullName ContactName,
            MainEmail ContactEmail,
            ContactPhone Phone
    FROM    SubContractors
    WHERE   Id = ${subcontractorId}`

  return query
}

exports.generateLocationsQuery = function (params) {
  let query = `
    SELECT	Id,
            SubcontractorID,
            Address,
            City,
            State,
            zipCode ZipCode,
            CountryID,
            (
              SELECT  Name
              FROM    Countries
              WHERE   Id = CountryID
            ) CountryName,
            Comments,
            CASE
                WHEN ActiveFlag = 1 THEN 1
                ELSE 0
            END Active,
            CASE
                WHEN PrimaryLocation = 1 THEN 1
                ELSE 0
            END PrimaryLocation,
            Phone,
            Fax,
            [Contact Name] ContactName,
            [Contact Email] ContactEmail `;

  if (params.getTotalCount == true) {
    query = ` SELECT COUNT(*) totalCount `;
  }

  query += `
    FROM	SubcontractorLocations
    WHERE	SubcontractorID = ${params.subcontractorId}`;

  // Filters
  // if(params.Address) {
  //   query += `
  //     AND     Address like ${params.Address} `;
  // }

  // if(params.City) {
  //   query += `
  //     AND     City like ${params.City} `;
  // }

  if (params.filterByState) {
    query += `
        AND     State = '${params.filterByState}' `;
  }

  // if(params.ZipCode) {
  //   query += `
  //     AND     zipCode = ${params.ZipCode} `;
  // }

  // if(params.Country) {
  //   query += `
  //     AND     CountryID = (
  //               SELECT  Id
  //               FROM    Countries
  //               WHERE   name = ${params.Country}
  //             ) `;
  // }

  // if(params.ContactName) {
  //   query += `
  //     AND     [Contact Name] like ${params.ContactName} `;
  // }

  // if(params.ContactEmail) {
  //   query += `
  //     AND     [Contact email] like ${params.ContactEmail} `;
  // }

  if (params.Active || Number(params.Active) == 0) {
    query += `
        AND     ActiveFlag = ${params.Active} `;
  }

  if (params.Primary || Number(params.Primary) == 0) {
    query += `
        AND     PrimaryLocation = ${params.Primary} `;
  }

  // if(params.Phone) {
  //   query += `
  //     AND     Phone = ${params.Phone} `;
  // }

  // if(params.Fax) {
  //   query += `
  //     AND     Fax = ${params.Fax} `;
  // }

  if (params.searchTerm) {
    query += `
        AND     (
                      City            LIKE '%${params.searchTerm}%'
                  OR  Comments        LIKE '%${params.searchTerm}%'
                  OR  [Contact Name]  LIKE '%${params.searchTerm}%'
                )`;
  }


  if (params.getTotalCount == false) {
    if (params.orderBy) {
      query += ` ORDER BY ${params.orderBy} `;
      if (params.orderDirection) {
        query += ` ${params.orderBy == 'PrimaryLocation' ? params.orderDirection + ', City ASC' : params.orderDirection} `;
      }
    }
    else {
      query += ` ORDER BY id ASC `;
    }
  }

  if (params.pageSize && params.getTotalCount == false) {
    query += ` OFFSET ${params.pageSize} * (${params.pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
  }

  // console.log('Locations '.repeat(20))
  // console.log('params = ', params);
  // console.log(query);
  // console.log('Locations '.repeat(20))


  return query;
}

const isStringNull = (param) => {
  const output = !param || param == 'null' ? null : `'${param}'`
  return output
}

exports.generateLocationInsertQuery = (params) => {
  const query = `
    INSERT INTO   SubcontractorLocations (
                    SubcontractorID,
                    Address,
                    City,
                    State,
                    zipCode,
                    CountryID,
                    Comments,
                    ActiveFlag,
                    PrimaryLocation,
                    Phone,
                    Fax,
                    [Contact Name],
                    [Contact Email],
                    TimeStamp
                  ) VALUES (
                    ${params.SubcontractorID},
                    '${params.Address}',
                    '${params.City}',
                    ${isStringNull(params.State)},
                    '${params.ZipCode}',
                    ${params.CountryID},
                    ${isStringNull(params.Comments)},
                    ${params.Active},
                    ${params.Primary},
                    ${isStringNull(params.Phone)},
                    ${isStringNull(params.Fax)},
                    ${isStringNull(params.ContactName)},
                    ${isStringNull(params.ContactEmail)},
                    GETDATE()
                  )
  `
  return query
}

exports.generateLocationUpdateQuery = (params) => {
  let query = `
    UPDATE  SubcontractorLocations
    SET     Address         = '${params.Address}',
            City            = '${params.City}',
            zipCode         = '${params.ZipCode}',
            CountryID       = '${params.CountryID}'`

  if (params.State) {
    query += `,
            State           = ${isStringNull(params.State)}`;
  }

  if (params.Comments) {
    query += `,
            Comments        = ${isStringNull(params.Comments)}`;
  }

  if (params.Active || params.Active == 0) {
    query += `,
            ActiveFlag      = ${params.Active}`;
  }

  if (params.Primary || params.Primary == 0) {
    query += `,
            PrimaryLocation = ${params.Primary}`;
  }

  if (params.Phone) {
    query += `,
            Phone           = ${isStringNull(params.Phone)}`;
  }

  if (params.Fax) {
    query += `,
            Fax             = ${isStringNull(params.Fax)}`;
  }

  if (params.ContactName) {
    query += `,
            [Contact Name]  = ${isStringNull(params.ContactName)}`;
  }

  if (params.ContactEmail) {
    query += `,
            [Contact Email] = ${isStringNull(params.ContactEmail)}`;
  }

  query += `
    WHERE   Id              = ${params.LocationId}
    AND     SubcontractorID = ${params.SubcontractorID}
  `

  return query
}