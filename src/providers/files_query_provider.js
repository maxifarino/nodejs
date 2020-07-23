exports.generateGetFilesQuery = function (params) {
  let
    query = ""

  if (params.getTotalCount) {
    query = `SELECT COUNT(*) totalCount FROM Files f WHERE SubcontractorId = ${params.subcontractorId} `
    if (params.roleId == '6' || params.roleId == 6) {
      query +=
        `
            AND       f.FinancialDataFlag is null 
    `
    }
  }
  else {
    query = `
            SELECT    f.id, 
                      f.name fileName, 
                      f.Description fileDescription, 
                      f.fileTypeId, 
                      ft.type, 
                      f.timeStamp uploadDate, 
                      f.subcontractorId, 
                      f.payloadId

            FROM      Files f, 
                      FilesTypes ft 

            WHERE     f.fileTypeId = 2 
            AND       f.subcontractorId = ${params.subcontractorId}
            AND       f.HiringClientId = ${params.hiringClientId}
    `
    if (params.roleId == '6' || params.roleId == 6) {
      query +=
        `
            AND       f.FinancialDataFlag is null 
    `
    }

    query +=
      `
             AND			ft.Type =	(	
                                  SELECT	Type
							                    FROM	  FilesTypes ft
							                    WHERE	  ft.Id = f.FileTypeId
                                ) 
    `
  }

  // Filters
  if (params.dateFrom) {
    query += ` AND f.timeStamp >= '${params.dateFrom}' `;
  }

  if (params.dateTo) {
    query += ` AND f.timeStamp <= '${params.dateTo}' `;
  }

  if (params.searchTerm) {
    query += ` AND (f.name like '%${params.searchTerm}%' OR f.description like '%${params.searchTerm}%') `;
  }

  if (params.fileType) {
    query += ` AND f.fileTypeId IN (SELECT ftyp.id FROM FilesTypes ftyp WHERE ftyp.type = '${params.fileType}')  `;
  }

  if (params.hiringClientId && !params.getTotalCount) {
    query +=
      ` 
              UNION
            
              SELECT    f.id, 
                        f.name fileName, 
                        f.Description fileDescription, 
                        f.fileTypeId, 
                        ft.type, 
                        f.timeStamp uploadDate, 
                        f.subcontractorId, 
                        f.payloadId

              FROM      Files f, 
                        FilesTypes ft

              WHERE     f.fileTypeId = 1
              AND       f.subcontractorId = ${params.subcontractorId} 
    `
    if (params.roleId == '6' || params.roleId == 6) {
      query +=
        `
              AND       f.FinancialDataFlag is null 
    `
    }
    query +=
      `
              AND			  ft.Type =	(	
                          SELECT	Type
                          FROM	  FilesTypes ft
                          WHERE	  ft.Id = f.FileTypeId
                        ) 
               AND      PayloadID in (
                          SELECT  id
                          FROM	  SavedForms
                          WHERE	  SubcontractorID = ${params.subcontractorId}
                          AND	    HiringClientId = ${params.hiringClientId}
                        )`
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
    let pageSize = params.pageSize
    let pageNumber = params.pageNumber
    query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
  }

  // console.log('-=-='.repeat(200))
  // console.log('params = ', params)
  // console.log('query = ', query)
  // console.log('-=-='.repeat(200)) 

  return query;
}

exports.generateGetFilesForSavedFormQuery = function (params) {
  let query = `EXEC sp_getFilesForForm ${params.SubcontractorId},${params.PayloadId}`; 
  return query
}

exports.generateGetHCIdFromPaylodQuery = function (params) {
  return `SELECT hiringClientId FROM SavedForms WHERE id = ${params.payloadId}`;
}

exports.generateFileInsertQuery = function (params) {
  let {
    payloadId,
    hiringClientId,
    name,
    subcontractorId,
    fileTypeId,
    description,
    FinancialDataFlag
  } = params

  let query = `INSERT INTO Files (
                                  Name, 
                                  subcontractorId, 
                                  fileTypeId, 
                                  description,
                                  FinancialDataFlag 
                                  `

  if (payloadId)
    query += `                    , payloadId`;

  if (hiringClientId)
    query += `                    , hiringClientId`;


  query += `                      ) 
  
              VALUES (          '${name}', 
                                ${subcontractorId}, 
                                ${fileTypeId}, 
                                '${description}',
                                ${FinancialDataFlag} `;

  if (payloadId)
    query += `                  , '${payloadId}'`;

  if (hiringClientId)
    query += `                  , ${hiringClientId}`;

  query += `                    ); `;

  // console.log('FILES QUERY '.repeat(20))
  // console.log('params = ', params)
  // console.log(query)

  return query;
}
