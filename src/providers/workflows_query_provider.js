

exports.generateSCStatusByWFTypeQuery = function (wfTypeId) {
	return `SELECT id, status FROM SubcontractorsStatus WHERE relatedWFTypeId = ${wfTypeId} ORDER BY id ASC `;
}

exports.generateWorkflowsTypesQuery = function () {
	return `SELECT id, description FROM WorkflowsTypes WHERE system = 'pq' ORDER BY id`;
}

exports.generateGetSCContactsQuery = function (hc_sc_pair) {
	const {
	    statusId,
	    subcontractorId,
	} = hc_sc_pair;

	let query;

	if (statusId <= 3) {
	    query = `SELECT id, contactFullName fullName, mainEmail mail FROM SubContractors WHERE id = ${subcontractorId}`;
	} else {
	    query = `SELECT id, firstName + ' ' + lastName fullName, mail FROM Users WHERE id IN
	            (SELECT userId FROM Users_SubContractors WHERE subContractorId = ${subcontractorId} AND isContact = 1)
	                ORDER BY id `;
	}

	return query;
}

exports.generateGetWFIsRunninQuery = function () {
	return `SELECT isRunning FROM WFPRocessLog ORDER BY id DESC;`;
}

exports.generateAddNewWFProcessQuery = function (runninginstance) {
	return `INSERT INTO WFPRocessLog (IsRunning, Instance) VALUES (1,'${runninginstance}');`;
}

exports.generateCompleteWFProcessQuery = function () {
	return `UPDATE WFPRocessLog SET IsRunning = 0 WHERE id IN (SELECT TOP 10 id FROM WFPRocessLog ORDER BY id DESC);
					UPDATE WFPRocessLog SET TimeCompleted = getDate() WHERE id IN (SELECT TOP 1 id FROM WFPRocessLog ORDER BY id DESC);`;
}

exports.generateGetHC_SC_ByStatusQuery = function (statusId) {
	return `
		SELECT
			HS.hiringClientId,
			HS.subcontractorId,
			HS.wfStepIndex,
			HS.wfIterationCount,
			HS.wfIterationTimeStamp,
			HS.mustPay,
			HS.subcontractorStatusId
		FROM
			Hiringclients_SubContractors HS
			INNER JOIN HiringClient_EnabledSystems HES
				ON HS.HiringClientId = HES.HiringClientId
			INNER JOIN SubContractors S
				ON HS.SubContractorId = S.Id
		WHERE
			HES.pqEnabled = 1
			AND S.pqEnabled = 1
			AND HS.subcontractorStatusId = ${statusId}
			AND HS.subcontractorId <> 5008
	`;

	// Hardcode This for testing purposes
	// AND HS.hiringClientId = 1120
	// AND HS.subcontractorId = 12125
}

exports.generateWorkflowsQuery = function (hiringClientId, system = 'pq') {

	let query = `SELECT  wt.id,
		  		      wt.description,
				        wt.detail,
				        (SELECT w.id FROM Workflows w WHERE w.hiringClientId = ${hiringClientId}
				        AND wt.id = w.workflowTypeId) as workflowId
							FROM    WorkflowsTypes wt
							where wt.system = '${system}'
							ORDER BY wt.id ASC`;

  return query;
}

exports.generateWorkflowQuery = function (hiringClientId) {

	let query = `SELECT
					WFC.Id id,
				    HC.Name hiringClientName,
				    C.Name componentName
				FROM
				    Workflows WF,
				    WorkflowsComponents WFC,
				    Components C,
				    HiringClients HC
				WHERE
				    WFC.WorkflowId = WF.Id AND
				    WFC.ComponentId = C.Id AND
				    WF.HiringClientId = HC.Id AND
				    HC.Id = ${hiringClientId}
				ORDER BY WFC.PositionIndex ASC `;

    return query;
}

exports.generateCompParamsQuery = function (componentId) {

	let query = `SELECT
				    C.Name componentName,
				    CP.Name componentParameterName,
				    WFCPV.Value parameterValue
				FROM
				    WorkflowsComponents WFC,
				    WorkflowsComponentsParamsValues WFCPV,
				    Components C,
				    ComponentsParameters CP
				WHERE
				    C.Id = ${componentId} AND
				    WFC.ComponentId = C.Id AND
				    CP.ComponentId = C.Id AND
				    WFCPV.WorkflowComponentId = WFC.Id AND
				    WFCPV.ComponentParameterId = CP.Id `;

    return query;
}

exports.generateWFInsertQuery = function (params) {

	let query = '';
	if(!params.id) {
		// Insert
		query +=  ` INSERT INTO Workflows (HiringClientId, workflowTypeId)
			Values (${params.hiringClientId}, ${params.workflowTypeId}) `;
	}

    return query;
}

exports.generateGetWFIdQuery = function (hiringClientId, workflowTypeid) {
	return `SELECT id FROM Workflows WHERE hiringClientId = ${hiringClientId}
	AND workflowTypeId = ${workflowTypeid} AND isEnabled = 1`;
}

exports.generateWFComponentInsertQuery = function (workflowId, componentId, positionIndex) {

	let query = `INSERT INTO WorkflowsComponents (workflowId, componentId, positionIndex)
			Values (${workflowId}, ${componentId}, ${positionIndex}); `;

    return query;
}

exports.generateWFParameterInsertQuery = function (componentParameterId, value) {

	let query = `INSERT INTO WorkflowsComponentsParamsValues (workflowComponentId,componentParameterId,value)
			Values (@identityId, ${componentParameterId}, '${value}'); `;

    return query;
}

exports.generateLastSentEmailQuery = function (hc_sc_pair) {

	return `SELECT TOP 1 m.id, m.templateId, m.fromName, m.fromAddress, m.toName, m.toAddress,
					m.recipientId, m.messageTrackingId, m.timeStamp,
					(SELECT TOP 1 bounce_code FROM MessageEvents WHERE messageId = m.id) bounceCode,
					(SELECT TOP 1 dropped_code FROM MessageEvents WHERE messageId = m.id) droppedCode
					FROM Messages m WHERE m.hiringClientId = ${hc_sc_pair.hiringClientId} AND m.subContractorId = ${hc_sc_pair.subcontractorId}
					AND m.wfGenerated = 1 order by id desc; `;
}

exports.generateTemplateByNameQuery = function (hiringClientId, templateName) {

	return `SELECT TOP 1 id, subject, bodyHTML, bodyText, templateName
					FROM MessagesTemplates
					WHERE hiringClientId = ${hiringClientId} AND templateName = '${templateName}' ORDER BY id DESC; `;
}

exports.generateGetTemplateQuery = function (hiringClientId, workflowTypeId) {

	let query = `
		SELECT  id, templateName, subject, bodyHTML, bodyText,
				replacedTemplateId, templateActivityId, communicationTypeId, fromAddress
		FROM    MessagesTemplates MT
		WHERE   MT.TemplateName IN
		(
		    SELECT  WCPV.value
		    FROM    WorkflowsComponentsParamsValues WCPV,
		            WorkflowsComponents WFC
		    WHERE   WCPV.WorkflowComponentId in
		        (SELECT ComponentId FROM WorkflowsComponents
		        WHERE ComponentId = 1 AND WorkflowId IN
		            (SELECT id FROM Workflows WHERE HiringClientId = ${hiringClientId} AND WorkflowTypeId = ${workflowTypeId})
		        )

		    AND WFC.ComponentId = WCPV.WorkflowComponentId
		)
		AND ReplacedTemplateId IS NULL `;

    return query;
}

exports.generateGetComponentsQuery = function (workflowId) {

	let query = ` SELECT  	wc.id workflowComponentId,
								          wc.positionIndex positionIndex,
								          c.name,
								          c.id componentId
								FROM      WorkflowsComponents wc,
								          Components c
								WHERE     wc.WorkflowId = ${workflowId}
								AND       c.id = wc.componentId
								ORDER BY  wc.positionIndex ASC `;

	return query;
}

exports.generateGetComponentParametersQuery = function (workflowComponentId) {

	let query = ` SELECT  wcp.id workflowsComponentsParamsValuesId,
						  cp.name,
						  wcp.value,
						  cp.id componentParameterId,
						  c.id componentId
								FROM    WorkflowsComponentsParamsValues wcp,
								        ComponentsParameters cp,
								        Components c
								WHERE   wcp.componentParameterId = cp.id
								AND     c.id = cp.ComponentId
								AND     wcp.workflowComponentId = ${workflowComponentId}
								ORDER BY cp.name ASC `;

	return query;
}

exports.generateGetAllComponentsQuery = function (system = 'pq') {

	const queryWhere = `where C.system = '${system}'`;

	return `SELECT c.id, c.name, C.system FROM Components C ${queryWhere} ORDER BY c.name `;
}

exports.generateGetAllTemplatesQuery = function (workflowId) {
	console.log(workflowId);
	return ` select mt.id, mt.templateName value from MessagesTemplates mt
					 WHERE  mt.hiringClientId IN
					 	(SELECT hiringClientId FROM Workflows WHERE id = ${workflowId}) ORDER BY mt.templateName ASC `;
}

exports.generateGetAllParamsQuery = function (componentId) {
	return ` SELECT cp.id, cp.name, cp.formFieldTypeId
					 FROM ComponentsParameters cp
					 WHERE cp.componentId = ${componentId}
					 ORDER BY cp.name `;
}

exports.generateDeleteWFQuery = function (hiringClientId) {
	return `
			DECLARE @hiringClientId INT;
			SET @hiringClientId = ${hiringClientId};
			-- Remove parameters values
			DELETE WorkflowsComponentsParamsValues
			WHERE workflowComponentId IN
			    (SELECT id FROM WorkflowsComponents WHERE workflowId IN
			        (SELECT id FROM Workflows WHERE hiringClientId = @hiringClientId)
			    );

			-- Remove components
			DELETE WorkflowsComponents WHERE workflowId IN
			        (SELECT id FROM Workflows WHERE hiringClientId = @hiringClientId);

			-- Remove workflow
			--DELETE Workflows WHERE hiringClientId = @hiringClientId;
			--SELECT @hiringClientId as id;
			 `;
}

exports.generateCloneDefaultWFQuery = function (hiringClientId) {
	return ` exec spCloneWF ${hiringClientId} `;
}

exports.generateGetHCFromWCIdQuery = function (workflowId) {
	return ` SELECT hiringClientId, workflowTypeId FROM Workflows WHERE id = ${workflowId} `;
}

exports.genWFIdFromHCIdAndWFTypeIdQuery = function (hiringClientId, workflowTypeId) {
	return ` SELECT id FROM Workflows WHERE hiringClientId = ${hiringClientId} AND workflowTypeId = ${workflowTypeId} `;
}

exports.generateSetWFIterationQuery = function (hc_sc_pair, iteration) {
	return ` UPDATE Hiringclients_SubContractors SET wfIterationCount = ${iteration}, wfIterationTimeStamp = getDate()
					 WHERE HiringClientId = ${hc_sc_pair.hiringClientId} AND SubContractorId = ${hc_sc_pair.subcontractorId} `;
}

exports.generateSetWFStepQuery = function (hc_sc_pair, step) {
	return `
		UPDATE Hiringclients_SubContractors SET WFStepIndex = ${step}, wfIterationCount = 1, wfIterationTimeStamp = getDate()
		WHERE HiringClientId = ${hc_sc_pair.hiringClientId} AND SubContractorId = ${hc_sc_pair.subcontractorId};

		UPDATE Tasks
		SET usedTask = 1
		WHERE subContractorId = ${hc_sc_pair.subcontractorId}
			AND (HiringClientId = ${hc_sc_pair.hiringClientId} OR HiringClientId IS NULL)
			AND wfStepIndex IS NOT NULL
			AND WorkflowTypeId IS NOT NULL
			AND isWaitingTask = 1
			AND usedTask = 0;
	`;
}

exports.generateSetMustPayQuery = function (hc_sc_pair, mustPay) {
  const query = ` UPDATE Hiringclients_SubContractors SET mustPay = ${mustPay}
  WHERE HiringClientId = ${hc_sc_pair.hiringClientId} AND SubContractorId = ${hc_sc_pair.subcontractorId} `;
	return query
}

exports.generateSetWfSCStatusByName = function (hc_sc_pair, statusName) {
	return ` UPDATE Hiringclients_SubContractors SET subcontractorStatusID = (SELECT id FROM SubcontractorsStatus WHERE status = '${statusName}')
					 WHERE HiringClientId = ${hc_sc_pair.hiringClientId} AND SubContractorId = ${hc_sc_pair.subcontractorId} `;
}

exports.generateSetWfSCStatusById = function (hc_sc_pair, statusId) {
	let query = '';
  let WFStepIndex = 1;
	let wfIterationCount = 1;

	const shouldResetWorkflow = [2, 4, 7, 20].includes(Number(statusId));

  query += `  UPDATE  Hiringclients_SubContractors
              SET     subcontractorStatusID         = ${statusId}`;

  query += `  ${shouldResetWorkflow                 ? `,
                      WFStepIndex                   = ${WFStepIndex},
											wfIterationCount              = ${wfIterationCount},
											wfIterationTimeStamp          = getDate()` : ''}`;

  query += `  WHERE   HiringClientId                = ${hc_sc_pair.hiringClientId}
							AND     SubContractorId               = ${hc_sc_pair.subcontractorId}; `;

	query += `
		UPDATE Tasks
		SET usedTask = 1
		WHERE subContractorId = ${hc_sc_pair.subcontractorId}
			AND (HiringClientId = ${hc_sc_pair.hiringClientId} OR HiringClientId IS NULL)
			AND wfStepIndex IS NOT NULL
			AND WorkflowTypeId IS NOT NULL
			AND isWaitingTask = 1
			AND usedTask = 0
	`;

  // console.log('>>>>>>>>>>>>>>>'.repeat(10))
  // console.log(query)
  // console.log('<<<<<<<<<<<<<<<'.repeat(10))

  return query
}

exports.generateUpdateUserIDinSCstatusLogQuery = function(hc_sc_pair, oldStatusId, statusId) {
  // OLD VERSION SCRIPTED IN DB
  // const sp_query = `EXEC sp_UpdateSubcontractorStatusLog ${hc_sc_pair.hiringClientId}, ${hc_sc_pair.subcontractorId}, ${statusId}, ${userId}`
  // NEW VERSION SCRIPTED IN DB (-pp)
  const sp_query = `EXEC sp_UpdateSubcontractorStatusLog ${hc_sc_pair.hiringClientId}, ${hc_sc_pair.subcontractorId}, ${oldStatusId},${statusId}`

  // console.log('!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡'.repeat(5))
  // console.log(sp_query)
  // console.log('!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡!¡'.repeat(5))
  return sp_query
}

// exports.generateHCFeedByHC_SC_PairQuery = function (hc_sc_pair, statusId) {
// 	return ` SELECT count(id) hasFee FROM HiringClients WHERE id = ${hc_sc_pair.hiringClientId}
// 					 AND SubcontractorFee > 0.0 `;
// }
exports.generateHCFeedByHC_SC_PairQuery = function (hc_sc_pair, statusId) {
	return ` SELECT count(id) hasFee
						FROM Hiringclients_SubContractors HC
						LEFT JOIN Forms F ON F.id = HC.FormId
						WHERE HC.HiringClientId = ${hc_sc_pair.hiringClientId}
						AND HC.subContractorId = ${hc_sc_pair.subContractorId}
						AND F.SubcontractorFee > 0.0 `;
}

exports.generateSCStatusIdByHC_SC_PairQuery = async function(hc_sc_pair) {
    return  ` SELECT TOP 1 SubcontractorStatusId
              FROM Hiringclients_SubContractors
              WHERE HiringClientId = ${hc_sc_pair.hiringClientId}
              AND subContractorId = ${hc_sc_pair.subContractorId};`;
}

exports.generateAddCovid19FormToSubcontractorQuery = function(hc_sc_pair) {
	const subcontractorId = hc_sc_pair.subcontractorId;
	const hiringClientId = hc_sc_pair.hiringClientId;

	return `EXEC spAddCovidFormTo ${hiringClientId}, ${subcontractorId}`;
}

exports.generateGetCFTaskTypes = () => {
 return `select Id 'id', Type 'value' from TaskTypes where system = 'cf'`;
}

exports.getCFDocumentStatuses = () => {
	return `select DocumentStatusID as 'id', DocumentStatus as 'value' from [dbo].[DocumentStatus]`
}

exports.getCFCoverageAndAttrsStatuses = () => {
	return `select [CoverageAttributeStatusID] as 'id', [CoverageAttributeStatus] as 'value' from [dbo].[CoverageAttributes_Status]`
}

exports.getCFComplianceStatuses = () => {
	return `select [ProjectInsuredComplianceStatusID] as 'id', [StatusName] as 'value' from [dbo].[ProjectInsured_ComplianceStatus]`
}