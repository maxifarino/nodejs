const axios = require('axios');
const error_helper = require('../helpers/error_helper');
const exago_facade = require('../mssql/exago')
const { writeLog } = require('../utils')

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': 'Basic Og=='
};

const apiUrl = process.env.EXAGO_apiUrl

// creates a session
exports.getSession = function(req, res, next) {
	axios({
	  method: 'post',
		baseURL: apiUrl + 'sessions',
	  headers
	 })
	.then(function(response){
		if (!response.data) {
			const error = error_helper.getErrorData(error_helper.CODE_EXAGO_ERROR, error_helper.MSG_EXAGO_ERROR);
			return res.send(error);
		} else {
			return res.status(200).json({ success: true, data: response.data });
		}
	})
	.catch(function(err){
		writeLog(err);
    	const error = error_helper.getErrorData(error_helper.CODE_EXAGO_ERROR, error_helper.MSG_EXAGO_ERROR);
		return res.send(error);
	});
}

const getParameter = (baseURL, res, metaData) => {
  const method = 'get'
	axios({
	  method,
		baseURL,
	  headers
	 })
	.then(function(response){
		return res.status(200).json(
      { 
        success: true, 
        data: response.data, 
        origin: `${method.toUpperCase()} from ${baseURL}`,
        metaData 
      }
    );
	})
	.catch(function(err){
		writeLog(err);
    	const error = error_helper.getErrorData(error_helper.CODE_EXAGO_ERROR, error_helper.MSG_EXAGO_ERROR);
		return res.send(error);
	});
}


const PATCHtoExago = (baseURL, data, res) => {
  
  // writeLog('===='.repeat(50))
  // writeLog('baseURL = ', baseURL)

  axios({
    method: 'patch',
    baseURL,
    headers,
    data
  })
  .then((response) => {
    let patchMeta = { data, status: response.status, destination: response.config.baseURL, payload: response.config.data }
    // let patchMeta = { PATCH_success: true, destination: baseURL, payload: data, payloadDataType: typeof data };
    console.log(`$$$$$$$$$$$$$$$$$$ patchMeta: ${JSON.stringify(patchMeta)}`)
    getParameter(baseURL, res, patchMeta)

  })
  .catch((err) => {
    writeLog('EXAGO ERROR  '.repeat(5))
    writeLog(err.config)      
    writeLog(err)
    return res.status(500).json({ success: false, data: 'no data' });
  })
}

exports.setParameter = function(req, res) {

  const 
    sessionId = req.body.sessionId,
    key       = req.body.key,
    prefix    = req.body.prefix,
    baseURL   = `${apiUrl}${prefix}/${key}?sid=${sessionId}`
  
  let data    = req.body.data

  console.log('EXAGO SET PARAMETERS '.repeat(3))
  console.log('baseURL = ', baseURL)
  console.log('data = ', data)
  console.log('key = ', key)
  console.log('prefix = ', prefix)

  if (prefix === 'parameters' && key == 'pocHiringClientIDList') {
    console.log('inside getHCstring conditional')
    exago_facade.getHCstring(data['Value'], function(err, result) {
      if(err) {
        writeLog('err = ', err)
        return res.send(err);
      }
      if(!result) {
        let error = error_helper.getErrorData(error_helper.CODE_TASK_NOT_FOUND, error_helper.MSG_TASK_NOT_FOUND);
        writeLog('error = ', error)
        return res.send(error);
      }
      data.Value = result[""]
      console.log('result = ', result)
      console.log('data.Value = ', data.Value)
      PATCHtoExago(baseURL, data, res)
    })

  } else if ( prefix === 'roles' && data.hasOwnProperty('IsActive') || (prefix === 'parameters' && key != 'pocHiringClientIDList')) {
    // if data = { IsActive: true } and prefix = 'roles' and key = is a reporting role
    PATCHtoExago(baseURL, data, res)

  } else if ( prefix === 'roles' && data.hasOwnProperty('Value') ) {
    // writeLog('data = ', data)
    exago_facade.getFolders(data.Value, (err, result) => {
      if (err) {
        writeLog('FOLDER error = ', err)
        return res.send(err);
      }
      if(!result) {
        let error = error_helper.getErrorData(error_helper.CODE_TASK_NOT_FOUND, error_helper.MSG_TASK_NOT_FOUND);
        return res.send(error);
      }
    
      let 
        data = {},
        folderURL = `${apiUrl}${prefix}/${key}/folders?sid=${sessionId}`,
        folderObj = {
          'IncludeAll':      false,
          'ReadOnly':        false,
          'AllowManagement': true,
          'CreateFolders':   false,
          'Folders': []
        },
        resultset = result.recordset,
        doesSetExist = resultset.length > 0
    
      if (doesSetExist) {
        for (let i=0;i<resultset.length;i++) {
          let obj = {}
      
          obj.Name = resultset[i].FolderName
          obj.ReadOnly = resultset[i].ReadOnlyFlag
          obj.Propogate = resultset[i].PropogateFlag == 1 ? true : false
      
          folderObj['Folders'].push(obj)
        }
      }
    
      data = JSON.stringify(folderObj)
    
      // writeLog('FOLDER RESULT '.repeat(25))
      // writeLog('doesSetExist = ', doesSetExist)
      // writeLog('resultset = ', resultset)
      // writeLog('resultset.length = ', resultset.length)
      if (doesSetExist) {
        // writeLog('resultset[0].FolderName = ', resultset[0].FolderName)
        // writeLog('resultset[0].ReadOnlyFlag = ', resultset[0].ReadOnlyFlag)
        // writeLog('resultset[0].PropogateFlag = ', resultset[0].PropogateFlag)
      }
      // writeLog(`folderObj['Folders'] = `, folderObj['Folders'])
      // writeLog('data = ', data)
    
      PATCHtoExago(folderURL, data, res)
    
    })

  }
}

exports.fetchEmbeddedReportsInfo = (req, res) => {
  let 
    invalidData = false
   const {
      embeddedReportId,
      roleId
    } = req.body

    // console.log('ERI '.repeat(70))
      // console.log('roleId = ', roleId)
        
  if(embeddedReportId && (parseInt(embeddedReportId) <= 0 || isNaN(parseInt(embeddedReportId)))) invalidData = true;
  if(!roleId) invalidData = true;

  if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
	}

  exago_facade.fetchEmbeddedReportsInfo(embeddedReportId, roleId, (err, results) => {
    if (err){
      var error = error_helper.getSqlErrorData(err);
      return res.status(500).send(error);
    } else {
      return res.status(200).json({ success: true, results });
    }
  })
}

// const AxiosCall2 = async (method, baseURL, data, res) =>{
//   await axios({
//     method,
//     baseURL,
//     headers,
//     data
//   })
//   .then((response) => {
//     if (method === 'patch') {
//       let patchMeta = { status: response.status, baseURL: response.config.baseURL, data: response.config.data }
//       writeLog('============================ BEGIN EXAGO PATCH ============================', patchMeta, '============================ END EXAGO PATCH ============================')
//     } else if (method === 'get') {
//       writeLog('============================ BEGIN EXAGO GET ============================', `response.data = `, response.data,'============================ END EXAGO GET ============================')
//       return res.status(200).json(
//         { 
//           success: true, 
//           data: response.data, 
//           origin: `${method.toUpperCase()} from ${baseURL}`,
//           metaData 
//         }
//       );
//     }
//   })
//   .catch((err) => {
//     writeLog('E-R-R-O-R  ', err)      
//     // writeLog(err)
//     // return res.status(500).json({ success: false, data: 'no data' });
//   })
// }

// const PATCHtoExago2 = async (req, res) => {

//   writeLog('EXAGO '.repeat(6))
//   writeLog(`req.body = `, req.body)
//   writeLog(req.body.data)

//   const 
//     sessionId = req.body.sessionId,
//     prefix    = req.body.prefix,
//     params = req.body.data.params

//   iterateAndRouteCalls('patch', sessionId, prefix, params)
//   iterateAndRouteCalls('get', sessionId, prefix, params, res)
  

// }


// const iterateAndRouteCalls = async (method, sessionId, prefix, params, res) => {
//   let keys = Object.keys(params)
//   writeLog('==>line 278', )
//   for (let i = 0; i<keys.length; i++) {
    
//     // keys.splice(0, 1)

//     let 
//       key     = keys[i],
//       val     = params[key],
//       baseURL = `${apiUrl}${prefix}/${key}?sid=${sessionId}`,
//       data    = method === 'patch' ? JSON.stringify( {Value: val} ) : null

//       writeLog(`==> Line 290, method = `, method, `params = `, params, `keys = `, keys, `val = `, val, `data = `, data, `baseURL = `, baseURL)

//     if (key === 'pocHiringClientIDList' && method === 'patch') {
//       writeLog(`payload for SP: `, val)

//       exago_facade.getHCstring(val, async (err, result) => {
//         if(err) {
//           writeLog(`SP error = `, err)
//           // return res.send(err);
//         }
//         if(!result) {
//           let error = error_helper.getErrorData(error_helper.CODE_TASK_NOT_FOUND, error_helper.MSG_TASK_NOT_FOUND);
//           writeLog(`error = `, error)
//           // return res.send(error);
//         }
//         data = { value: result[""] }
//         writeLog(`SP data = `, data)
//         await AxiosCall2(method, baseURL, data, res)
//       })
    
//     } else {
//       await AxiosCall2(method, baseURL, data, res)
//     }
//   }
// }


// exports.setParameter2 = function(req, res) {
//   PATCHtoExago2(req, res)
// }