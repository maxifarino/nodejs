const sql_helper = require('./mssql_helper');
const { writeLog } = require('../utils')

exports.getHCstring = async (userId, callback) => {
  try {

    const 
      sp_query   = `select dbo.f_getExagoHiringClientIDList( ${userId} )`,
      connection = await sql_helper.getConnection(),
      result     = await connection.request().query(sp_query),
      hcString   = result.recordset[0]
    
    connection.close();

    callback(null, hcString);

  }
  catch(err) {
    // console.log('SP_ERROR'.repeat(50))
    // console.log(err);
    // console.log('SP_ERROR'.repeat(50))
		callback(err, null);
  }
}

exports.getFolders = async (userId, callback) => {
  try {

    const 
      sp_query   = `DECLARE 
                            @userId int
                    SET			
                            @userId = ${userId}
                    EXEC 
                            sp_getExagoClientFolders   @userId`,
      connection = await sql_helper.getConnection(),
      result     = await connection.request().query(sp_query),
      folderJSON = result
    
    connection.close();

    callback(null, folderJSON);

  }
  catch(err) {
    console.log('SP_ERROR'.repeat(5))
    console.log(err);
    console.log('SP_ERROR'.repeat(5))
		callback(err, null);
  }
}

exports.fetchEmbeddedReportsInfo = async (embeddedReportId, roleId, callback) => {
  try {
 
      const sp_query   = `EXEC get_EmbeddedReportInfo ${embeddedReportId} `
      const connection = await sql_helper.getConnection()
      const result     = await connection.request().query(sp_query)
      const embRepInfo = result.recordset[0]
      let   results    = {
        displayText: embRepInfo.DisplayText,
        hiringClientIDEnabled: embRepInfo.hiringClientIDEnabled,
        subcontractorIDEnabled: embRepInfo.subcontractorIDEnabled,
        savedFormIDEnabled: embRepInfo.savedFormIDEnabled,
        reportPath: embRepInfo.ReportName
      }

    // console.log('embRepInfo = ', embRepInfo)

    if (Number(embRepInfo.IsEnabled) == 0) {
      connection.close();
      console.log(`I'm not allowed because the embedded report info is not enabled... 😥 😥 😥`)
      callback(null, false)
    } else { 
        const sp_query2   = `EXEC get_EmbeddedReportRoles ${embRepInfo.ReportID} `
        const result2      = await connection.request().query(sp_query2)
        const objArr      = result2.recordset
        const roleSet     = new Set()
      
      connection.close();

      for (let i=0; i<objArr.length; i++) {
        roleSet.add(objArr[i].RoleID)
      }
      const isRolePermitted = roleSet.has(roleId)

      console.log('objArr = ', objArr)
      console.log('roleSet = ', roleSet)
      console.log('roleId = ', roleId)
      console.log('isRolePermitted = ', isRolePermitted)

      if (!isRolePermitted) {
        console.log(`I'm not allowed because my role is not permitted... 😥 😥 😥`)
        results = false
      }

      callback(null, results)
      // console.log('objArr = ', objArr)
      // console.log('roleSet = ', roleSet)
      // console.log('results = ', results)
    }
  }
  catch(err) {
    // console.log('err = ', err)
		callback(err, null);
  }
}