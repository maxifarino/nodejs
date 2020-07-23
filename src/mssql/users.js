const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const users_query_provider = require('../providers/users_query_provider');
const Roles = require('./roles');
const TimeZones = require('./timezones');
const Titles = require('./titles');
const HiringClientsController = require('../api/hiring_clients');
const SubcontractorsController = require('../api/sub_contractors');
const { uniquifyList, getFirstAndManyUniquePropsFromObjArray } = require('../helpers/utils');
const customTermsQueryProvider = require('../cf_providers/customterms_query_provider');
const logger = require('./log');
const { writeLog } = require('../utils')

exports.checkMail = async function (mail, callback) {
  try {
    const connection = await sql_helper.getConnection();
    const query = `SELECT COUNT(*) AS MailExists FROM Users WHERE Mail = '${mail}'`;
    const result = await connection.request().query(query);
    connection.close();
    if (result.recordset.length > 0) {
      var mailExists = false;
      var exists = result.recordset[0].MailExists;
      if (exists > 0)
        mailExists = true;
      callback(null, mailExists);
    }
  }
  catch (err) {
    callback(err, null);
  }
}

const generateUserProfile = async (user, getPassword, connection) => {

  if (!getPassword) user.Password = undefined;
  const userRoles = await Roles.getUserRole(user);
  user.Role = userRoles.Role;
  user.CFRole = userRoles.CFRole;

  user.Title = await Titles.getUserTitle(user);
  if (user.Role && user.Role.IsHCRole) {
    user.relatedHc = await HiringClientsController.getFirstHiringClientForUser(user);
  } else if (user.Role && user.Role.IsSCRole) {
    user.relatedSc = await SubcontractorsController.getFirstSubcontractorForUser(user);
  } else if (user.CFRole && user.CFRole.IsHLRole) {
    user.relatedHl = null;  // TODO
  } else if (user.CFRole && user.CFRole.IsINRole) {
    user.relatedIn = null;  // TODO
  }

  user.FirstHiringClientId = null
  user.multipleHiringClients = []
  user.FirstSubcontractorId = null
  user.multipleSubcontractors = []
  user.multipleStrictHCs = []

  const queryHC = users_query_provider.generateGetFirstHiringClientQuery(user.Id)
  const resultHC = await connection.request().query(queryHC);
  // const queryGetSCId = users_query_provider.generateGetFirstSubcontractorQuery(user.Id)
  const queryGetSCId = users_query_provider.generateSubsForSubUsersQuery(user.Id)
  const resultSCId = await connection.request().query(queryGetSCId);
  const queryGetStrictHCs = users_query_provider.generateGetStrictlyRelatedHiringClients(user.Id)
  const resultStrictHC = await connection.request().query(queryGetStrictHCs);
  const queryGetStrictHCsSubs = users_query_provider.generateGetAllSubcontractorsOfHCusersHiringClient(user.Id)
  const resultStrictHCsSubs   = await connection.request().query(queryGetStrictHCsSubs);
  // SSO
  const querySSO = `SELECT CFUsername,CFPassword FROM CF1SSO WHERE UserId = '${user.Id}'`;
  const resultSSO = await connection.request().query(querySSO);

  // console.log('resultHC.recordset = ', resultHC.recordset)
  // console.log('queryGetSCId = ', queryGetSCId)
  // console.log('queryGetSCId = ', resultSCId.recordset)
  // console.log('resultHC.recordset = ', resultStrictHC.recordset)

  const res = getFirstAndManyUniquePropsFromObjArray(resultHC.recordset, 'HiringClientId')
  user.multipleHiringClients = res.multiple

  // const res2 = getFirstAndManyUniquePropsFromObjArray(resultSCId.recordset, 'subcontractorId')
  const res2 = getFirstAndManyUniquePropsFromObjArray(resultSCId.recordset, 'subContractorId')
  user.FirstSubcontractorId = res2.first
  user.multipleSubcontractors = res2.multiple

  const res3 = getFirstAndManyUniquePropsFromObjArray(resultStrictHC.recordset, 'HiringClientId')
  user.FirstHiringClientId = res3.first
  user.multipleStrictHCs = res3.multiple

  const res4 = getFirstAndManyUniquePropsFromObjArray(resultStrictHCsSubs.recordset, 'SubcontractorID')

  user.HCuserMultipleStrictSubs = res4.multiple

  if (resultSSO.recordset.length > 0) {
    user.SSO = resultSSO.recordset[0];
  }

  if (user.CFRoleId === 10 && user.FirstHiringClientId) {
    const customTermsQuery = customTermsQueryProvider.generateCustomTermsQuery({ holderId: user.FirstHiringClientId })
    const resultCustomTerms = await connection.request().query(customTermsQuery);
    user.customTerms = resultCustomTerms.recordset;
  }

  let queryRolesAccessPermissions = users_query_provider.getRolesAccessPermissions(user.RoleID, user.CFRoleId );
  let rolesAccessPermissions = await connection.request().query(queryRolesAccessPermissions);
  user.rolesAccessPermissions = rolesAccessPermissions.recordset;

  let queryRolesFunctionsPermissions = users_query_provider.getRolesFunctionsPermissions(user.RoleID, user.CFRoleId );
  let rolesFunctionsPermissions = await connection.request().query(queryRolesFunctionsPermissions);
  user.rolesFunctionsPermissions = rolesFunctionsPermissions.recordset;

  connection.close();

  return user

}

exports.getUserByEmail = async function (email, getPassword, callback) {
  try {
    const connection = await sql_helper.getConnection();
    const query = `SELECT * FROM Users WHERE Mail = '${email}'`;
    const result = await connection.request().query(query);

    let user = ''

    if (result.recordset.length > 0) {
      user = result.recordset[0];
      user = await generateUserProfile(user, getPassword, connection)
    }
    if (user) {
      // console.log('GET USER BY MAIL '.repeat(20))
      // console.log('user = ', user)
      // console.log('getPassword = ', getPassword)
      callback(null, user);
    } else {
      console.log("No user found with that email");
      callback(null, null);
    }
  }
  catch (err) {
    callback(err, null);
  }
}

exports.getUserById = async function (id, getPassword, callback) {
  try {
    const connection = await sql_helper.getConnection();
    const query = `SELECT * FROM Users WHERE Id = ${id}`;
    const result = await connection.request().query(query);

    if (result.recordset.length > 0) {
      var user = result.recordset[0];
      user = await generateUserProfile(user, getPassword, connection)

      // console.log('GET USER BY ID '.repeat(20))
      // console.log('user = ', user)
      // console.log('getPassword = ', getPassword)

      callback(null, user);
    }
    else {
      console.log("No user found with that id");
      callback(null, null);
    }
  }
  catch (err) {
    callback(err, null);
  }
}

exports.enableUser = async function (id, enable, callback) {

  enable = (enable == "1" || enable >= 1) ? "1" : "0";
  var query = `UPDATE Users SET IsEnabled = ${enable} WHERE Id = ${id}`;
  sql_helper.createTransaction(query, callback);
}

exports.changeUserRole = async function (userId, roleId, callback) {
  var query = `UPDATE Users SET RoleID = ${roleId} WHERE Id = ${userId}`;
  sql_helper.createTransaction(query, callback);
}

exports.comparePassword = function (candidatePassword, userPassword, callback) {
  //console.log(candidatePassword, userPassword);
  callback(null, candidatePassword == userPassword);
}

exports.changePassword = async function (id, newPassword, forceRenew, callback) {
  var mustRenewPass = forceRenew ? "1" : "0";
  var query = `UPDATE Users SET Password = '${newPassword}', MustRenewPass = '${mustRenewPass}' WHERE Id = ${id}`;
  sql_helper.createTransaction(query, callback);
}

exports.getUsers = async function (queryParams, callback) {
  try {
    const connection = await sql_helper.getConnection();
    var totalCount = 0;
    let query = null
    let result = null;
    // console.log('FILTER USER '.repeat(50))
    if (queryParams.userId) {
      query = users_query_provider.generateGetRoleByUserIdQuery(queryParams.userId);
      // console.log('getRoleByUserIdQuery = ', query)
      result = await connection.request().query(query);
      queryParams.loggedUserRoleId = result.recordset[0].roleId;
    }

    if (!queryParams.Archived) queryParams.Archived = 0;

    if (queryParams.pageNumber) {
      queryParams.getTotalCount = true;
      query = users_query_provider.generateUsersQuery(queryParams);
      // console.log('generateUsersCountQuery = ', query)
      result = await connection.request().query(query);
      totalCount = result.recordset[0].totalCount;
    }

    queryParams.getTotalCount = false;
    query = users_query_provider.generateUsersQuery(queryParams);
    // console.log('generateUsersQuery = ', query)
    result = await connection.request().query(query);
    connection.close();

    if (!queryParams.pageNumber)
      totalCount = result.recordset.length;

    callback(null, result.recordset, totalCount);
  }
  catch (err) {
    console.log(err);
    callback(err, null, null);
  }
}

exports.updateUser = async function (params, callback) {
  const hcs = params.HiringClientsMultiple;
  const isMultipleHCs = hcs && hcs.length > 0;
  const subs = params.SubcontractorsMultiple;
  const isMultipleSubs = subs && subs.length > 0;
  console.log('updateUser: ', params)

  let query = `
                UPDATE        Users
                SET           FirstName         = '${params.FirstName}',
                              LastName          = '${params.LastName}',
                              Mail              = '${params.Mail}',
                              RoleID            = ${params.RoleId},
                              CFRoleID          = ${params.CFRoleId},`;

  if (params.IsEnabled) {
    query += `
                              IsEnabled         = ${params.IsEnabled},`;
  }
  if (params.Password) {
    query += `
                              Password          = '${params.Password}',`;
  }
  query += `
                              Phone             = '${params.Phone}',`
  if (params.TimeZoneID) {
    query += `
                              TimeZoneID        = ${params.TimeZoneId},`;
  }
  if (params.MustUpdateProfile) {
    query += `
                              MustUpdateProfile = ${params.MustUpdateProfile},`;
  }
  if (params.MustRenewPass) {
    query += `
                              MustRenewPass     = ${params.MustRenewPass},`;
  }

  query = query.slice(0, -1);

  query += ` WHERE Id = ${params.Id};`;

  // DELETE AND INSERT HIRING CLIENTS
  if (params.HiringClientId || isMultipleHCs) {
    query += `;
              DELETE Users_HiringClients
                WHERE UserId = ${params.Id};
              INSERT INTO Users_HiringClients (UserId, HiringClientId)
                VALUES `;
    if (params.HiringClientId) {
      query += `(${params.Id}, ${params.HiringClientId})`;

    } else if (isMultipleHCs) {
      for (let i = 0; i < hcs.length; i++) {
        query += `(${params.Id}, ${hcs[i].id}),`
      }
      // remove last comma.
      query = query.slice(0, -1);
    }
  }

  // DELETE AND INSERT SUBCONTRACTORS
  if (params.subContractorId || isMultipleSubs) {
    query += `;
      DELETE Users_SubContractors
        WHERE UserId = ${params.Id};
      INSERT INTO Users_SubContractors (UserId, SubContractorId)
        VALUES `;

    if (params.subContractorId) {
      query += `(${params.Id}, ${params.subContractorId})`
    } else if (isMultipleSubs) {
      for (let i = 0; i < subs.length; i++) {
        query += `(${params.Id}, ${subs[i].id}),`
      }
      // remove last comma.
      query = query.slice(0, -1);
    }
  }

  console.log('updateUser: ', query)


  await sql_helper.createTransaction(query, function (err, result) {
    console.log('err = ', err)
    console.log('result =', result)
    if (err) {
      const date = `${(new Date()).toLocaleString()}`
      console.log('\n>DATE : ' + date + ',\n>ERROR: ' + err + ', \n>PARAMS: ' + params + ', \n>QUERY: ', query)
      return callback(err);
    } else if (result) {
      callback(null, result);

      const logParams = {
        eventDescription: params.eventDescription,
        UserId: params.userId,
        Payload: params.Id
      }

      logger.addEntry(logParams, function (err, result) {
        if (err) {
          console.log("There was an error creating log for: ");
          console.log(logParams);
          console.log(err);
        } else {
          console.log("Log succesfully created");
        }
        return;
      });
    }
  });
}

exports.createUser = async function (params, callback) {

  if (params.RoleId == '0' || params.RoleId == 0) {
    params.RoleId = null
  }
  if (params.CFRoleId == '0' || params.CFRoleId == 0) {
    params.CFRoleId = null
  }

  let query = `
              INSERT INTO   Users (
                              FirstName,
                              LastName,
                              Mail,
                              RoleId,
                              CFRoleId,
                              IsEnabled,
                              Password,
                              Phone,
                              TitleId,
                              TimeZoneId,
                              MustRenewPass,
                              MustUpdateProfile
                            ) VALUES (
                              '${params.FirstName}',
                              '${params.LastName}',
                              '${params.Mail}',
                              ${params.RoleId},
                              ${params.CFRoleId},
                              ${params.IsEnabled},
                              '${params.Password}',
                              '${params.Phone}',
                              ${params.TitleId},
                              ${params.TimeZoneId},
                              ${params.MustRenewPass},
                              1
                            )`;
  // console.log('query = ', query)

  query = sql_helper.getLastIdentityQuery(query, 'Users');

  sql_helper.createTransaction(query, function (err, _result, userId) {
    if (err) {
      const date = `${(new Date()).toLocaleString()}`
      console.log('\n>DATE : ' + date + ',\n>LOCATION: nodeapp/src/mssql/users.js,\n>ERROR: ' + err + ', \n>QUERY: ', query)
      return callback(err);
    }
    const hcs = params.HiringClientsMultiple
    const isMultipleHCs = hcs && hcs.length > 0
    const subs = params.SubcontractorsMultiple
    const isMultipleSubs = subs && subs.length > 0

    query = `
        ${(params.HiringClientId || isMultipleHCs) && (params.subContractorId || isMultipleSubs) ? `BEGIN TRANSACTION;` : ''}`

    if (params.HiringClientId || isMultipleHCs) {
      query += `
            INSERT INTO   Users_HiringClients (
                                                UserId,
                                                HiringClientId
                                              ) VALUES `
    }
    if (params.HiringClientId) {
      query += `
                                                        (
                                                ${userId},
                                                ${params.HiringClientId}
                                              );`
    } else if (isMultipleHCs) {
      for (let i = 0; i < hcs.length; i++) {
        query += `(${userId}, ${hcs[i].id}),`
      }
      // remove last comma.
      query = query.slice(0, -1);
    }

    if (params.subContractorId || isMultipleSubs) {
      query += `
            INSERT INTO   Users_SubContractors  (
                                                  UserId,
                                                  subContractorId
                                                ) VALUES `
    }
    if (params.subContractorId) {
      query += `
                                                          (
                                                  ${userId},
                                                  ${params.subContractorId}
                                                );`
    } else if (isMultipleSubs) {
      for (let i = 0; i < subs.length; i++) {
        query += `(${userId}, ${subs[i].id}),`
      }
      // remove last comma.
      query = query.slice(0, -1);
    }

    query += `
        ${(params.HiringClientId || isMultipleHCs) && (params.subContractorId || isMultipleSubs) ? `COMMIT;` : ''}`;

    console.log('insert query = ', query)
    console.log('params = ', params)

    sql_helper.createTransaction(query, function (err, result) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      callback(null, result, userId);

    })

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: userId
    }

    logger.addEntry(logParams, function (err, result) {
      if (err) {
        console.log("There was an error creating log for: ");
        console.log(logParams);
        console.log(err);
      } else {
        console.log("Log succesfully created");
      }
      return;
    });
  });
}

// WARNING, ONLY FOR TESTING
exports.deleteUser = async function (id, callback) {
  var query = `DELETE FROM Users WHERE Id = ${id}`;
  sql_helper.createTransaction(query, callback);
}

exports.getUsersBrief = async function (userId, hiringClientId, subcontractorId, roleId, callback) {
  try {
    const connection = await sql_helper.getConnection();
    let query = null
    let result = null;

    query = users_query_provider.generateGetRelatedUsersQuery(userId, hiringClientId, subcontractorId, roleId);

    result = await connection.request().query(query);
    connection.close();
    callback(null, result.recordset);
  }
  catch (err) {
    console.log(err);
    callback(err, null);
  }
}


exports.getMustPay = async function (userId, hiringClientId, subcontractorId, roleId, callback) {
  try {
    const connection = await sql_helper.getConnection();
    // let query = null
    // let result = null

    const isTest = false

    // query = users_query_provider.generateGetRelatedUsersQuery(userId, hiringClientId, subcontractorId, roleId);

    if (isTest) {
      console.log('MUST PAY '.repeat(50))
      console.log('\n')
    }

    const queryHiringClient = `
		SELECT id,SubcontractFeeRegMsg,SubcontractFeeRenewMsg
			FROM HiringClients
				WHERE id = ${hiringClientId}
		`;
    if (isTest) {
      console.log('queryHiringClient', queryHiringClient);
      console.log('\n')
    }
    const resultHiringClient = await connection.request().query(queryHiringClient);


    const queryCheckRegistrationPayment = `
      SELECT      HS.hiringClientId AS id,
                  HS.mustpay,
                  HS.formId,
                  F.isComplete,
                  F.SubcontractorFee
      FROM        HiringClients_Subcontractors HS
      LEFT JOIN   Forms F ON HS.FormID = F.id
      WHERE       HS.subContractorId = ${subcontractorId}
      AND         HS.hiringClientId = ${hiringClientId}
      AND         F.SubcontractorFee > 0
      AND         MustPay = 1
      AND         HS.subcontractorStatusId IN (
                    SELECT  id
                    FROM    SubcontractorsStatus
                    WHERE   relatedWFTypeId = 1
                    OR      relatedWFTypeId = 2
                  )`

    if (isTest) {
      console.log('queryCheckRegistrationPayment', queryCheckRegistrationPayment);
      console.log('\n')
    }
    const resultCheckRegistrationPayment = await connection.request().query(queryCheckRegistrationPayment);

    const queryCheckRenewalPayment = `
      SELECT      HS.hiringClientId AS id,
                  HS.mustpay,
                  HS.formId,
                  F.isComplete,
                  F.SubcontractorFee
      FROM        HiringClients_Subcontractors HS
      LEFT JOIN   Forms F ON HS.FormID = F.id
      WHERE       HS.subContractorId = ${subcontractorId}
      AND         HS.hiringClientId = ${hiringClientId}
      AND         F.SubcontractorFee > 0
      AND         MustPay = 1
      AND         HS.subcontractorStatusId IN (
                    SELECT  id
                    FROM    SubcontractorsStatus
                    WHERE   relatedWFTypeId = 4
                  )`

    if (isTest) {
      console.log('queryCheckRenewalPayment', queryCheckRenewalPayment);
      console.log('\n')
    }
    const resultCheckRenewalPayment = await connection.request().query(queryCheckRenewalPayment);

    const queryGetPaidOrToBePaidSavedFormId = `
      SELECT	Id savedFormId
      FROM	  savedForms
      WHERE	  SubContractorId = ${subcontractorId}
      AND		  HiringClientId = ${hiringClientId}
      AND		  FormId = (
                SELECT FormID
                FROM Hiringclients_SubContractors
                WHERE HiringClientId = ${hiringClientId}
                AND SubcontractorID = ${subcontractorId}
              )`

    const resultPaidOrToBePaidSavedFormId = await connection.request().query(queryGetPaidOrToBePaidSavedFormId);

    connection.close();

    const mustPay = {};
    mustPay.MustPayRegistration = false;
    mustPay.isRegistrationFeeCovered = false;
    mustPay.MustPayRenewal = false;
    mustPay.isRenewalFeeCovered = false;
    mustPay.MustPayToHCId = null;
    mustPay.SubcontractorFee = null;
    mustPay.SubcontractFeeRegMsg = null;
    mustPay.SubcontractFeeRenewMsg = null;
    mustPay.paidOrYetToPayHcId = hiringClientId;
    console.log('resultPaidOrToBePaidSavedFormId',resultPaidOrToBePaidSavedFormId.recordset[0]);
    mustPay.paidOrToBePaidSavedFormId = resultPaidOrToBePaidSavedFormId.recordset[0].savedFormId ? resultPaidOrToBePaidSavedFormId.recordset[0].savedFormId : null

    if (resultHiringClient.recordset.length > 0) {
      mustPay.SubcontractFeeRegMsg = resultHiringClient.recordset[0].SubcontractFeeRegMsg;
      mustPay.SubcontractFeeRenewMsg = resultHiringClient.recordset[0].SubcontractFeeRenewMsg;
    }

    if (resultCheckRegistrationPayment.recordset.length > 0) {
      mustPay.MustPayRegistration = true;
      mustPay.MustPayToHCId = resultCheckRegistrationPayment.recordset[0].id;
      mustPay.SubcontractorFee = resultCheckRegistrationPayment.recordset[0].SubcontractorFee;
    } else {
      mustPay.isRegistrationFeeCovered = true
    }

    if (resultCheckRenewalPayment.recordset.length > 0) {
      mustPay.MustPayRenewal = true;
      mustPay.MustPayToHCId = resultCheckRenewalPayment.recordset[0].id;
      mustPay.SubcontractorFee = resultCheckRenewalPayment.recordset[0].SubcontractorFee;
    } else {
      mustPay.isRenewalFeeCovered = true
    }

    if (isTest) {
      console.log('mustPay = ', mustPay)
      console.log('\n')
      console.log('resultCheckRegistrationPayment.recordset = ', resultCheckRegistrationPayment.recordset)
      console.log('\n')
      console.log('resultCheckRenewalPayment.recordset = ', resultCheckRenewalPayment.recordset)
    }

    callback(null, mustPay);
  }
  catch (err) {
    console.log(err);
    callback(err, null);
  }
}

exports.getUsersHiringClientsAndOrSubcontractors = async (userId, callback) => {
  try {
    const connection = await sql_helper.getConnection();

    const HCquery = users_query_provider.generateGetUsersHiringClientsQuery(userId);
    const HCresult = await connection.request().query(HCquery);

    const SubQuery = users_query_provider.generateGetUsersSubcontractorsQuery(userId);
    const SubResult = await connection.request().query(SubQuery);

    const output = [...HCresult.recordset, ...SubResult.recordset]

    connection.close();

    callback(null, output);
  }
  catch (err) {
    callback(err, null);
  }
}
