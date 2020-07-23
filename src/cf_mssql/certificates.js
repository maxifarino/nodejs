const AWS = require('aws-sdk');
const { cfSign } = require('../helpers/aws_helper');
const sql_helper = require('../mssql/mssql_helper');
const query_provider = require('../cf_providers/contacts_query_provider');
const workflow = require('./../processors/cf_workflow/cf_wf_mssql');
const state_mgr = require('../cf_mssql/state_manager')

exports.getCerificates = async function (param, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var queryCertificates = query_provider.generateGetCertificateByInsuredId(param);
    result = await connection.request().query(queryCertificates);

    connection.close();
    let data = result.recordset;
    //console.log('recordset',data);
    data.forEach(async (element) => {
      const fileName = element.FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${element.DocumentId}.$1`);
      await cfSign(fileName, (err, url) => {
        element.UrlFile = url;
      });
    });
    
    callback(null, data);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.getDeficiences = async function (param, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var queryDeficiences = query_provider.generateGetDeficiencesByInsuredId(param);

    result = await connection.request().query(queryDeficiences);

    connection.close();

    callback(null, result.recordset);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.updateToggledeficiences = async function (param, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var queryCertificates = query_provider.generateUpdateToggledeficiences(param);
    result = await connection.request().query(queryCertificates);

    connection.close();

    callback(null, true);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.getUsers = async function (callback) {
  try {
    const connection = await sql_helper.getConnection();
    var queryGetUsers = query_provider.generateGetUserQuery();
    result = await connection.request().query(queryGetUsers);

    connection.close();

    callback(null, result.recordset);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.getProjectInsured = async function (param, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var queryGetProjectInsured = query_provider.generateGetProjectInsuredQuery(param);
    result = await connection.request().query(queryGetProjectInsured);

    connection.close();

    callback(null, result.recordset[0]);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.WaiveDeficiencies = async (params, callback) => {
  try {
    
    //console.log(params) 
    let waive = {}
    waive.waiverStartDate = params.waiverStartDate
    waive.waiverEndDate = params.waiverEndDate
    waive.note = params.note
    waive.waiverSetBy = params.waiverSetBy
    waive.approvedBy = params.approvedBy
    waive.projectInsuredId = params.projectInsuredId
    
    console.log('WAIVE OBJECT:::::::', waive)
    const connection = await sql_helper.getConnection()

    params.deficiencesWaiver.forEach((def, index) => {
      // save waive
      console.log('SAVING WAIVE TO DB')
      console.log(params.deficiencesWaiver)
      
      const saveWaiveQry = query_provider.getSaveWaiveQuery(waive, def);
      console.log(saveWaiveQry)
      connection.request().query(saveWaiveQry)

      // update the document status
      let queryupdateDocuments = query_provider.generateUpdateDocumentStatus(waive.projectInsuredId);
      console.log(queryupdateDocuments)
      //FIXME: VER DE CORREGIR EL SETEO DE STATUS DEL DOC
      //await connection.request().query(queryupdateDocuments)

      console.log('CAMBIANDO STATUS DEL ATTR')
      // upate the coverage attribute status
      state_mgr.SetAcceptedStatus(def.CoverageAttributeID, 
                                  def.ProjectInsuredID, 
                                  def.RuleGroupID, 
                                  def.RuleID,
                                        3)
      
    })

    callback(null, true);
    //TODO:Esteban
    // connection.close();
  }
  catch (err) {
    callback(err, null);
  }
}



exports.undoWaiversDeficiencies = async function (parameters, callback) {
  try {
    const { projectInsuredDeficiencyId, projectInsuredId } = parameters;
    const connection = await sql_helper.getConnection();
    var queryUndoWaiversDeficiencies = query_provider.generateUndoWaiversDeficienciesQuery(projectInsuredDeficiencyId);
    await connection.request().query(queryUndoWaiversDeficiencies);

    if (projectInsuredId) {
      let queryupdateDocuments = query_provider.generateUpdateDocumentStatus(projectInsuredId);
      await connection.request().query(queryupdateDocuments);
    }

    connection.close();

    callback(null, true);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.confirmDeficiencies = async function (reqBody, callback) {
  try {
    const deficiencies = reqBody.deficiencies
    const connection = await sql_helper.getConnection();
    
    deficiencies.forEach(async (deficiency, index) => {             
      // update the deficiency status
      const confirmDefsQuery = query_provider.generateConfirmDeficienciesQuery(deficiency.ProjectInsuredDeficiencyID)
      await connection.request().query(confirmDefsQuery)

      // update the document status
      const updateDocumentsQuery = query_provider.generateUpdateDocumentStatus(deficiency.ProjectInsuredID);
      await connection.request().query(updateDocumentsQuery);

      // update the coverage attribute
      await state_mgr.SetAcceptedStatus(deficiency.CoverageAttributeID, 
                                        deficiency.ProjectInsuredID, 
                                        deficiency.RuleGroupID, 
                                        deficiency.RuleID,
                                        3)                                 

      if (index === deficiencies.length - 1) {
        callback(null, true);
      }
    });
  }
  catch (err) {
    console.log('erro::', err);
    callback(err, null);
  }
}

exports.updateProcedureEmail = async function (parameter, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var querysaveProcedureEmail = query_provider.generateUpdateProcedureEmailQuery(parameter);
    await connection.request().query(querysaveProcedureEmail);

    connection.close();

    callback(null, true);
  }
  catch (err) {
    callback(err, null);
  }
}

exports.updateInsuredEmail = async function (parameter, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var querysaveInsuredEmail = query_provider.generateUpdateInsuredEmailQuery(parameter);
    await connection.request().query(querysaveInsuredEmail);

    connection.close();

    callback(null, true);
  }
  catch (err) {
    callback(err, null);
  }
}


exports.rejectCertificate = async function (parameters, callback) {
  try {
    const attributes = parameters.deficiences
    const connection = await sql_helper.getConnection();
    
    attributes.forEach(async (row, index) => {
      //update the status of the deficiencies
      let rejectCertQry = query_provider.generateRejectCertificate(row.ProjectInsuredID)
      await connection.request().query(rejectCertQry)

      // update the status of the attributes
      await state_mgr.SetRejectStatus(row.CAAttributeID,
                                      row.ProjectInsuredID,
                                      row.RuleGroupID,
                                      row.RuleID)
      
      if (index === parameters.length - 1) {
        callback(null, true);
      }
    })
    
    //await workflow.createWfInstance(7, parameters.holderId, parameters.projectInsuredID, parameters.certificateId, parameters.ruleGroupId, parameters.ruleId);

  }
  catch (err) {
    callback(err, false);
  }
}

exports.onHoldCertificate = async function (parameter, callback) {
  try {
    //console.log('parameter::',parameter);
    const connection = await sql_helper.getConnection();
    var queryOnHoldCertificate = query_provider.generateOnHoldCertificate(parameter);
    await connection.request().query(queryOnHoldCertificate);
    connection.close();
    //await workflow.updateWorkflowStatus(1, 'On Hold');
    callback(null, true);
  }
  catch (err) {
    console.log(err);
    callback(err, false);
  }
}

exports.removeOnHoldCertificate = async function (parameter, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var queryRemoveOnHoldCertificate = query_provider.generateRemoveOnHoldCertificate(parameter);
    await connection.request().query(queryRemoveOnHoldCertificate);
    connection.close();
    await workflow.updateWorkflowStatus(1, 'Active');
    callback(null, true);
  }
  catch (err) {
    console.log(err);
    callback(err, false);
  }
}

exports.escalateCertificate = async (parameter, callback) => {
  try {
    const deficiencies = parameter.deficiencses
    
    deficiencies.forEach(async (deficiency, index) => {
      state_mgr.SetEscalateStatus(deficiency.ProjectInsuredID, 
                                  deficiency.RuleGroupID, 
                                  deficiency.RuleID, 
                                  deficiency.CoverageAttributeStatusID)
      
      if (index === parameters.length - 1){
        callback(null, true)
      }
    })
  }
  catch (err) {
    console.log(err);
    callback(err, false);
  }
}