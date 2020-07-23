const { writeLog } = require('../utils')

exports.generateGetStrictlyRelatedHiringClients = (id) => {
  const query = `
		SELECT  HiringClientId
    FROM    Users_HiringClients    
    WHERE   userId = ${id}`
    
  // console.log(query);
  return query
}

exports.generateGetFirstHiringClientQuery = (id) => {
  const query = `
		SELECT  HiringClientId
		FROM    Users_HiringClients
		WHERE   userId = ${id}
    
    UNION	
    
    SELECT  HiringClientId
		FROM    Hiringclients_SubContractors
		WHERE   subContractorId IN ( 
              SELECT  subContractorId 
              FROM    Users_SubContractors 
              WHERE   userId = ${id}
            ) 
		AND     subcontractorStatusId IN (
              SELECT  id 
              FROM    SubcontractorsStatus 
              WHERE   relatedWFTypeId IN (1, 2, 4)
            )	` 
  // console.log(query);
  
  return query
}

exports.generateSubsForSubUsersQuery = (id) => {
  const query = `
    SELECT  subContractorId 
    FROM    Users_SubContractors
    WHERE   userId = ${id}`
  // console.log(query);
  return query
}

exports.generateGetFirstSubcontractorQuery = (id) => {
  const query = `
    SELECT  subcontractorId
    FROM    Hiringclients_SubContractors
    WHERE   subContractorId IN (
              SELECT  subContractorId FROM Users_SubContractors
              WHERE   userId = ${id}
            ) 
    AND     subcontractorStatusId IN (
              SELECT  id 
              FROM    SubcontractorsStatus 
              WHERE   relatedWFTypeId IN (1, 2, 4)
            )`;
            
  return query;
}

exports.generateGetAllSubcontractorsOfHCusersHiringClient = (id) => {
  const query = `
    SELECT		  SubcontractorID 
    FROM		    HiringClients_Subcontractors hs 
    INNER JOIN	Users_HiringClients uh ON hs.HiringClientID = uh.HiringClientID 
    INNER JOIN	Users u ON u.id = uh.UserID AND u.RoleID in (3,6)
    WHERE		    u.id = ${id}
    AND			    uh.UserId = u.id
  `
  // console.log(query);
  return query
}

exports.generateUsersQuery = function (queryParams) {
  const scId = queryParams.subcontractorId
  const hcId = queryParams.hiringClientId
  const projectId = queryParams.projectId
  const holderUsersArchived = (queryParams.holderUsersArchived === "1") ?  1:0;
  const showBothHCandSCusers = queryParams.showBothHCandSCusers
  let subQuery = ''
  let unassociatedSubQuery = ''
  let query = ''

  const subQueryDepartment = '(select DepartmentId from DepartmentUsers where UserId = u.id order by TimeStamp DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY)';

  query += ` SELECT  id, 
                        firstName, 
                        lastName,
                        firstName + ' ' + lastName name,
                        mail,
                        roleID,
                        role,
                        CFRoleId,
                        CFRole,
                        isEnabled,
                        titleId,
                        title,
                        phone,
                        cellPhone,
                        timeZoneId,
                        timeZone,
                        mustRenewPass,
                        mustUpdateProfile,
                        Status,
                        company,
                        AssociatedHCsOfSC,                        
                        timeStamp,
                        ${holderUsersArchived} 'holderUserArchived',
                        department,
                        isAssociated`;
//we just return the received Archived flag to avoid an extra query as we don't need users from both status at the same time
  if (queryParams.getTotalCount == true) {
    query = `   SELECT COUNT(*) totalCount`;
  }
  query += `    
                FROM	  (
                          SELECT  u.id,
                                  u.FirstName,
                                  u.LastName,
                                  u.FirstName + ' ' + u.LastName name,
                                  u.mail,
                                  u.roleID,
                                  (	SELECT	r.Name
                                    FROM	  Roles r
                                    WHERE   r.id = u.RoleID AND system = 'pq'
                                  ) role,
                                  u.CFRoleId,
                                  (	SELECT	r.Name
                                    FROM	  Roles r
                                    WHERE   r.id = u.CFRoleID AND system = 'cf'
                                  ) CFRole,
                                  u.isEnabled,
                                  u.titleId,
                                  (	SELECT	t.title
                                    FROM	  Titles t
                                    WHERE	  t.id = u.titleId 
                                  ) title,
                                  u.phone,
                                  u.cellPhone,
                                  u.timeZoneId,
                                  (	SELECT	tz.description
                                    FROM	  timeZones tz
                                    WHERE   tz.id = u.TimeZoneId
                                  ) timeZone,
                                  u.mustRenewPass,
                                  u.mustUpdateProfile,
                                  ( SELECT  uss.State
                                    FROM    UsersStatus uss
                                    WHERE   uss.isEnabled = u.isEnabled
                                    AND     uss.mustRenewPass = u.mustRenewPass
                                    AND     uss.mustUpdateProfile = u.mustUpdateProfile
                                  ) Status,
                                  (
                                    SELECT	STRING_AGG(Name, ', ')
                                    FROM	(
                                            SELECT	h.Name
                                            FROM	  HiringClients h
                                            WHERE	  h.Id in (
                                              SELECT	hs.HiringClientId
                                              FROM  	Users_HiringClients hs
                                              WHERE 	hs.UserId = u.id
                                            )
                                            UNION
                        
                                            SELECT  s.Name
                                            FROM	  SubContractors s
                                            WHERE	  s.Id in (
                                              SELECT  us.SubContractorId
                                              FROM	  Users_SubContractors us
                                              WHERE	  us.UserId = u.id
                                            )
                                    ) Name
                                  ) company,
                                  (
                                    SELECT STRING_AGG(Name, ', ')
                                    FROM (
                                        SELECT h.Name
                                        FROM HiringClients h
                                        WHERE h.Id in (
                                          SELECT	hs.HiringClientId
                                          FROM	Hiringclients_SubContractors hs
                                          WHERE	hs.SubContractorId in (
                                            SELECT	US.SubContractorId
                                            FROM	Users_SubContractors us
                                            WHERE	us.UserId = u.Id
                                          )
                                        )
                                      ) Name
                                  ) AssociatedHCsOfSC,

                                  u.timeStamp,
                                  ${subQueryDepartment} as department,
                                  1 as isAssociated 
                          FROM    (
                                    SELECT  *
                                    FROM    Users uu
                            ${
    hcId
      ? `
                                    WHERE   uu.Id in (
                                              SELECT  uh.UserId
                                              FROM    Users_HiringClients uh
                                              WHERE   uh.HiringClientId = ${hcId}
                                              and uh.Archived = ${holderUsersArchived}
                                            )
                                ${
      showBothHCandSCusers
        ? `
                                    UNION

                                    SELECT  *
                                    FROM    Users uuu
                                    WHERE   uuu.Id in (
                                              SELECT  us.userId
                                              FROM    Users_SubContractors us
                                              WHERE   us.SubContractorId in (
                                                        SELECT  hs.SubContractorId
                                                        FROM    Hiringclients_SubContractors hs 
                                                        WHERE   hs.HiringClientId = ${hcId}
                                                      )
                                            )`
        : ``
      }
          
                                    `
      : ``
    }
    ${ projectId? ` and uu.Id not in (SELECT pu.UserId from ProjectsUsers pu where pu.ProjectId = ${projectId})`:``}

                        ) u`

  if (scId) {
    query += `
                        INNER JOIN      Users_SubContractors us on u.id = us.UserId `;
  }

  query += `
                        WHERE	    u.IsEnabled = 1 `;

  if (scId) {
    subQuery += `            
                        AND		    us.SubcontractorId = ${scId} `;
  }

  if (queryParams.roleId) {
    subQuery += ` 
                        AND       u.roleId = ${queryParams.roleId} `;
  }

  if (queryParams.CFRoleId) {
    subQuery += ` 
                        AND       u.CFRoleId = ${queryParams.CFRoleId} `;
  }

  query += subQuery


  unassociatedSubQuery += `
                        UNION
              
                        SELECT    u.id,
                                  u.FirstName,
                                  u.LastName,
                                  u.FirstName + ' ' + u.LastName name,
                                  u.mail,
                                  u.roleID,
                                  (	SELECT	r.Name
                                    FROM	  Roles r
                                    WHERE   r.id = u.RoleID
                                  ) role,
                                  u.CFRoleId,
                                  (	SELECT	r.Name
                                    FROM	  Roles r
                                    WHERE   r.id = u.CFRoleID AND system = 'cf'
                                  ) CFRole,
                                  u.isEnabled,
                                  u.titleId,
                                  (	SELECT	t.title
                                    FROM	  Titles t
                                    WHERE	  t.id = u.titleId 
                                  ) title,
                                  u.phone,
                                  u.cellPhone,
                                  u.timeZoneId,
                                  (	SELECT	tz.description
                                    FROM	  timeZones tz
                                    WHERE   tz.id = u.TimeZoneId
                                  ) timeZone,
                                  u.mustRenewPass,
                                  u.mustUpdateProfile,
                                  ( SELECT  uss.State
                                    FROM    UsersStatus uss
                                    WHERE   uss.isEnabled = u.isEnabled
                                    AND     uss.mustRenewPass = u.mustRenewPass
                                    AND     uss.mustUpdateProfile = u.mustUpdateProfile
                                  ) Status,
                                  (
                                    SELECT	STRING_AGG(Name, ', ')
                                    FROM	(
                                            SELECT	h.Name
                                            FROM	  HiringClients h
                                            WHERE	  h.Id in (
                                              SELECT	hs.HiringClientId
                                              FROM  	Users_HiringClients hs
                                              WHERE 	hs.UserId = u.id
                                            )
                                            UNION
                        
                                            SELECT  s.Name
                                            FROM	  SubContractors s
                                            WHERE	  s.Id in (
                                              SELECT  us.SubContractorId
                                              FROM	  Users_SubContractors us
                                              WHERE	  us.UserId = u.id
                                            )
                                    ) Name
                                  ) company,
                                  (
                                    SELECT STRING_AGG(Name, ', ')
                                    FROM (
                                        SELECT h.Name
                                        FROM HiringClients h
                                        WHERE h.Id in (
                                          SELECT	hs.HiringClientId
                                          FROM	Hiringclients_SubContractors hs
                                          WHERE	hs.SubContractorId in (
                                            SELECT	US.SubContractorId
                                            FROM	Users_SubContractors us
                                            WHERE	us.UserId = u.Id
                                          )
                                        )
                                      ) Name

                                  ) AssociatedHCsOfSC,                                  

                                  u.timeStamp,
                                  ${subQueryDepartment} as department,
                                  0 as isAssociated

                        FROM	    Users u

                        WHERE     u.IsEnabled = 1
                        AND	      (u.RoleID IN (1, 2, 5)  OR u.CFRoleId IN (8,15,16,17,18))
                        AND       u.ID NOT IN (2,3,5275, 2199)
                        AND       u.ID NOT IN (	
                                                SELECT  u.Id 

                                                FROM    `;

  if (hcId) {
    unassociatedSubQuery += ` 
                                                        Users_HiringClients uh, Users u 
                                                WHERE	  u.Id = uh.UserId
                                                AND     `;
  } else if (scId) {
    unassociatedSubQuery += ` 
                                                        Users_SubContractors us, Users u 
                                                WHERE	  u.Id = us.UserId
                                                AND     `;
  } else if (hcId && scId) {
    unassociatedSubQuery += ` 
                                                        Users_HiringClients uh, Users_SubContractors us, Users u 
                                                WHERE	  u.Id = uh.UserId
                                                AND     u.Id = us.UserId
                                                AND     `;
  } else {
    unassociatedSubQuery += ` 
                                                        Users u
                                                WHERE   `
  }

  unassociatedSubQuery += ` 
                                                        u.IsEnabled = 1 
                                                ${subQuery}
                                              )`;
  query += `${queryParams.associatedOnly ? '' : unassociatedSubQuery}
	                      ) x `

  if (queryParams.searchTerm) {
    query += ` 
      WHERE       (
                    firstName LIKE '%${queryParams.searchTerm}%' 
                    OR lastName LIKE '%${queryParams.searchTerm}%' 
                    OR mail LIKE '%${queryParams.searchTerm}%'
                  )`;
    // we don't expect to apply these filters without a searchTerm
    if (queryParams.searchForHolder) {
      query += `AND CFRoleId in (${queryParams.searchForHolder})`
    }
    if (queryParams.searchCFOnly) {
      query += `AND CFRole is not null`
    }
  }

  if (queryParams.searchTerm && queryParams.searchPQOnly) {
    query += ` AND Role IS NOT NULL`;
  } else if (queryParams.searchPQOnly) {
    query += ` WHERE Role IS NOT NULL`;
  }

  if (queryParams.orderBy && !queryParams.getTotalCount) {
    query += ` 
                  ORDER BY ${queryParams.orderBy} `;
    if (queryParams.orderDirection) {
      query += ` 
                  ${queryParams.orderDirection} `;
    }
  }

  if (queryParams.pageNumber && !queryParams.getTotalCount && queryParams.withoutPagination) {
    query += ` 
                  OFFSET ${queryParams.pageSize} * (${queryParams.pageNumber} - 1) ROWS FETCH NEXT ${queryParams.pageSize} ROWS ONLY `;
  }

  // console.log('================'.repeat(20))
  // console.log('queryParams = ', queryParams)
  // console.log(query);
  // console.log('================'.repeat(20))
  return query;

}

exports.generateGetRoleByUserIdQuery = function (userId) {
  return ` SELECT roleId FROM Users WHERE id = ${userId} `;
}

exports.generateRolesExtQuery = function () {
  // for PQ
  let query = `SELECT	id,
                  name,
                  System
          FROM	  Roles
          WHERE   Id IN (1,2,3,5,6)`;
  query += ` UNION `
  // for CF
  query += `SELECT	id,
                    name,
                    System
            FROM	  Roles
            WHERE   system = 'cf'`;

  return query;
}

exports.generateGetRelatedUsersQuery = function (userId, hiringClientId, subcontractorId, roleId) {
  let query = `SELECT id, firstName + ' ' + LastName fullName, Mail
    FROM
    (
      SELECT  id, firstName, LastName, Mail
      FROM    Users
      WHERE   id in (SELECT userId FROM Users_SubContractors WHERE subContractorId IN 
                          (SELECT subContractorId FROM Users_SubContractors WHERE userId = ${userId}))
      UNION
      SELECT  id, firstName, LastName, Mail
      FROM    Users
      WHERE   id in (SELECT userId FROM Users_HiringClients WHERE hiringClientId IN 
                          (SELECT hiringClientId FROM Users_HiringClients WHERE userId = ${userId}))
    ) T
    ORDER BY fullName DESC `;

  if (hiringClientId) {
    query = `SELECT id, firstName + ' ' + LastName fullName, Mail
      FROM
      (
        SELECT  id, firstName, LastName, Mail
        FROM    Users
        WHERE   id in (SELECT userId FROM Users_HiringClients WHERE hiringClientId = ${hiringClientId})
      ) T
      ORDER BY fullName DESC `;
  }

  if (subcontractorId) {
    query = `SELECT id, firstName + ' ' + LastName fullName, Mail
      FROM
      (
        SELECT  id, firstName, LastName, Mail
        FROM    Users
        WHERE   id in (SELECT userId FROM Users_Subcontractors WHERE subcontractorId = ${subcontractorId})
      ) T
      ORDER BY fullName DESC `;
  }

  /*
  if(roleId == 1) {
    query = `SELECT id, firstName + ' ' + LastName fullName, Mail
    FROM
    (
      SELECT  id, firstName, LastName, Mail
      FROM    Users
    ) T
    ORDER BY fullName DESC `;
  }    
  */
 console.log('querySubContractor:::',query);
  return query
}

exports.generateGetUsersHiringClientsQuery = (userId) => {
  const query = `
    SELECT	hiringClientId hcId,
            (
              SELECT	Name
              FROM	HiringClients
              WHERE	Id = hiringClientId
            ) hcName
    FROM	  Users_HiringClients
    WHERE	  userId = ${userId}`
  return query
}

exports.generateGetUsersSubcontractorsQuery = (userId) => {
  const query = `
    SELECT	subcontractorId subId,
            (
              SELECT	Name
              FROM	SubContractors
              WHERE	Id = subcontractorId
            ) subName
    FROM	  Users_SubContractors
    WHERE	  userId = ${userId}`
  return query
}

exports.getRolesAccessPermissions = (PQrolId, CFrolId) => {
  const query = `select * from RolesAccessPermissions where RolId in (${PQrolId}, ${CFrolId})`;

  return query;
}

exports.getRolesFunctionsPermissions = (PQrolId, CFrolId) => {
  const query = `select (select Name from Functions where Id = FunctionId) 'function'  from Roles_Functions where RoleId in (${PQrolId}, ${CFrolId})`;

  return query;
}