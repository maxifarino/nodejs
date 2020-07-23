const sql_helper = require('../mssql/mssql_helper');
const hashProvider = require('../processors/hashes');
const error_helper = require('../helpers/error_helper');
const subContractorsSql = require('../mssql/sub_contractors');
const emails = require('../processors/emails');
const logger = require('../mssql/log');
const forms = require('../mssql/forms');
const WorkflowsSQL = require('../mssql/workflows')
const _ = require('underscore')
const xlsx = require('xlsx')
const { isLetter, isNum, isObjEmpty, isEmailValid, sanitizeQuotesForDB, validatePhone } = require('../helpers/utils')

const _Exists = 'Exists';
const _InvalidEmail = 'Invalid Email Format';


const _packageSubcontractorList = (list, subContractors, scNames, isFileUpload) => {
  let isAnError = false
  // File Upload will include Headers (always the object with index = 0), in order to avoid errors arising out of validating Headers, FileUpload will start with index = 1.
  const startIndex = isFileUpload ? 1 : 0
  for (let i = startIndex; i < list.length; i++) {
    console.log('22-_packageSubcontractorList', list[i]);
    const subContractor = {};
    let companyName = isFileUpload ? list[i].field1 : list[i].companyName;
    companyName = companyName ? sanitizeQuotesForDB(companyName) : '';
    let contactName = isFileUpload ? list[i].field2 : list[i].contactName;
    contactName = contactName ? sanitizeQuotesForDB(contactName) : '';
    let requestorName = isFileUpload ? list[i].field7 : list[i].requestorName;
    requestorName = requestorName ? sanitizeQuotesForDB(requestorName) : '';
    let sourceSystemId = isFileUpload ? String(list[i].field5) : list[i].sourceSystemId;    
    sourceSystemId = sourceSystemId ? sanitizeQuotesForDB(sourceSystemId) : '';
    subContractor.companyName = companyName;
    subContractor.contactName = contactName;
    subContractor.mail = isFileUpload ? list[i].field3 : list[i].mail;
    subContractor.phone = isFileUpload ? `${list[i].field4}` : list[i].phone;
    subContractor.sourceSystemId = sourceSystemId;

    if (isFileUpload) {
      subContractor.ShortName = list[i].field6 ? list[i].field6 : ''
    } else {
      subContractor.formId = list[i].formId;
    }

    subContractor.requestorName = requestorName
    subContractor.requestorEmail = isFileUpload ? list[i].field8 : list[i].requestorEmail
    subContractor.requestorEmailError = ""

    if (!subContractor.companyName) {
      subContractor.companyNameError = 'Company Name not provided'
      isAnError = true
    } else {
      subContractor.companyNameError = ''
    }

    if (scNames.includes(subContractor.companyName.toLowerCase())) {
      subContractor.companyNameError = _Exists;
      isAnError = true
    } else if (subContractor.companyName) {
      subContractor.companyNameError = ''
    }

    if (!subContractor.mail) {
      subContractor.mailError = 'Contact Email not provided'
      isAnError = true
    } else {
      subContractor.mailError = ''
    }

    if (subContractor.mail && !isEmailValid(subContractor.mail)) {
      subContractor.mailError = _InvalidEmail
      isAnError = true
    } else if (subContractor.mail) {
      subContractor.mailError = ''
    }

    if (subContractor.requestorEmail && !isEmailValid(subContractor.requestorEmail)) {
      subContractor.requestorEmailError = _InvalidEmail
      isAnError = true
    }

    if (!subContractor.contactName) {
      subContractor.contactNameError = 'Contact Name not provided';
      isAnError = true
    } else {
      subContractor.contactNameError = ''
    }
    console.log('87-subContractor.phone', subContractor.phone);
    if (!subContractor.phone) {
      subContractor.phoneError = 'Contact Phone not provided'
      isAnError = true
    } else {
      subContractor.phoneError = ''
    }

    if (subContractor.phone && !validatePhone(subContractor.phone)) {
      subContractor.phoneError = !subContractor.phone ? 'Contact Phone not provided' : 'Invalid Phone'
      isAnError = true
    } else if (subContractor.phone) {
      subContractor.phone = validatePhone(subContractor.phone)
      subContractor.phoneError = ''
    }

    if (!subContractor.sourceSystemId) {
      subContractor.sourceSystemId = '';
    }

    if (!subContractor.requestorName) {
      subContractor.requestorName = '';
    }

    if (!subContractor.requestorEmail) {
      subContractor.requestorEmail = '';
    }

    subContractors.push(subContractor);

  }

  return { subContractors, isAnError }
}

// Get csv file with SC data and validate it
exports.validateSCFile = async function (req, res) {
  let resObj = ''
  let invalidData = false;
  const NumOfRequiredFields = 4 // (companyName, contactName, contactEmail, contactPhone) !!! PLEASE UPDATE IF NECESSARY!

  if (!req.body) {
    invalidData = true;
  }

  if (!req.body.hiringClientId) {
    invalidData = true;
  }

  if (req.body.hiringClientId && (parseInt(req.body.hiringClientId) <= 0 || isNaN(parseInt(req.body.hiringClientId))))
    invalidData = true;

  const hiringClientId = req.body.hiringClientId;

  if (invalidData) {
    const err = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    //  return res.send(error);
    return res.status(200).json({ success: false, data: [], error: err });
  }

  const scNames = []
  const scMails = []
  let subContractors = []
  let isShortNameAHeader = false
  let isMinimumHeaderError = false


  const getFormIdByShortName = async (callback) => {
    // create SQL set Of ShortNames 
    let SQLset = '('
    let setArray = []

    for (let i = 0; i < subContractors.length; i++) {
      const sub = subContractors[i]
      if (sub.ShortName && !sub.formId) {
        SQLset += `${setArray.length > 0 ? ', ' : ''}'${sub.ShortName}'`
        setArray.push(sub.ShortName)
      }
      if (i == subContractors.length - 1) {
        SQLset += ')'
      }
    }
    // console.log('SQLset = ', SQLset)

    if (setArray.length > 0) {
      // Open Connection, write query with SQL set expression, request query, get result
      const connection = await sql_helper.getConnection();
      const query = `
        SELECT	Id formId, ShortName 
        FROM	  Forms 
        WHERE	  HiringClientId = ${hiringClientId}
        AND		  ShortName in ${SQLset}`

      // console.log('query = ', query)
      const result = await connection.request().query(query);
      const results = result.recordset
      connection.close();
      // console.log('results = ', results)

      for (let i = 0; i < results.length; i++) {
        for (let k = 0; k < subContractors.length; k++) {
          const sub = subContractors[k]
          // console.log('results[i].ShortName = ', results[i].ShortName)
          // console.log('sub = ', sub)
          if (!sub.formId && sub.ShortName && sub.ShortName == results[i].ShortName) {
            sub.formId = results[i].formId
          }
        }
      }
    }

    callback(subContractors)
  }

  await subContractorsSql.loadSubcontractorsKeyValues(hiringClientId, function (err, result) {
    if (err) {
      return res.status(500).send(err);
    }

    for (let i = 0; i < result.length; i++) {
      scNames.push(result[i].n);
      scMails.push(result[i].m);
    }
  });

  const minimumHeadersError = `Wrong number of headers:  Please retry by placing the headers -- "companyName", "contactName", "mail", "phone", "sourceSystemId", "ShortName", "requestorName", "requestorEmail" -- in any order on the top row of an .xls, .csv or .xlsx spreadsheet.  Values for the last 4 headers are optional, but the headers themselves are all required`

  const returnData = (subContractors) => {
    if (isMinimumHeaderError || subContractors.length == 0) {
      return res.status(200).json({ success: false, data: subContractors, error: minimumHeadersError });
    } else {
      return res.status(200).json({ success: true, data: subContractors });
    }
  }

  const csvFile = req.files.csvSCDataFile;
  const extension = req.body.extension

  if (extension == 'xlsx' || extension == 'xls') {
    const workbook = xlsx.read(csvFile.data, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const xlsxData = workbook.Sheets[sheetName]
    // console.log('xlsxData = ', xlsxData)
    const jsonSCList = []

    const traverseSheet = (header) => {
      // console.log('header = ', header)
      let arr = header.split('')
      let alpha = ''
      let numeric = ''
      for (let i = 0; i < arr.length; i++) {
        let char = arr[i]
        if (isLetter(char)) {
          alpha += char
        } else if (isNum(char)) {
          numeric += char
        }
      }
      return {
        alpha,
        numeric: Number(numeric)
      }
    }

    const getNumOfRows = (obj) => {
      // console.log('obj = ', obj)
      let rows = new Set([])
      let columns = []
      for (let p in obj) {
        // console.log('p = ', p)
        // console.log('obj[p] = ', obj[p])
        if (isLetter(p[0]) && isNum(p[p.length - 1])) {
          let res = traverseSheet(p)
          let row = res.numeric
          let column = res.alpha

          columns.push(column)

          if (columns.length == NumOfRequiredFields) {
            // console.log('columns = ', columns)

            rows.add(row)
            // console.log('row = ', row)
            // console.log('rows = ', rows)
            columns = []
          }
        }
      }
      return rows.size
    }

    const headerArray = []

    for (let p in xlsxData) {
      console.log('xlsxData[p][v]', xlsxData[p]['v']);
      if (xlsxData[p]['v'] == 'companyName' || xlsxData[p]['v'] == 'contactName' || xlsxData[p]['v'] == 'mail' || xlsxData[p]['v'] == 'phone' || xlsxData[p]['v'] == 'sourceSystemId' || xlsxData[p]['v'] == 'ShortName' || xlsxData[p]['v'] == 'requestorName' || xlsxData[p]['v'] == 'requestorEmail') {
        headerArray.push(xlsxData[p]['v'])
      }
    }

    const headerLength = headerArray.length
    let conditionCounter = headerLength
    const headers = Array(headerLength)


    for (let p in xlsxData) {
      if (xlsxData[p]['v']) {
        if (xlsxData[p]['v'] == 'companyName') {
          headers[0] = p
          conditionCounter--
        }
        if (xlsxData[p]['v'] == 'contactName') {
          headers[1] = p
          conditionCounter--
        }
        if (xlsxData[p]['v'] == 'mail') {
          headers[2] = p
          conditionCounter--
        }
        if (xlsxData[p]['v'] == 'phone') {
          headers[3] = p
          conditionCounter--
        }
        if (xlsxData[p]['v'] == 'sourceSystemId') {
          headers[4] = p
          conditionCounter--
        }
        if (xlsxData[p]['v'] == 'ShortName') {
          headers[5] = p
          conditionCounter--
          isShortNameAHeader = true
        }
        if (xlsxData[p]['v'] == 'requestorName') {
          headers[6] = p
          conditionCounter--
        }
        if (xlsxData[p]['v'] == 'requestorEmail') {
          headers[7] = p
          conditionCounter--
        }
      }
    }

    isMinimumHeaderError = !headers || headers && headers.length < 4 || conditionCounter != 0 || !headers[4] || !headers[5]

    const rowsLength = getNumOfRows(xlsxData)
    let row = 0

    for (let k = 0; k < rowsLength; k++) {
      const obj = {}
      jsonSCList.push(obj)
      // console.log("headers = ", headers)
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]
        if (!header) continue
        const resp = traverseSheet(header)
        const cell = `${resp.alpha}${resp.numeric + row}`
        if (!xlsxData[cell]) {
          xlsxData[cell] = { v: '' }
        }
        // console.log('cell = ', cell)
        // console.log('xlsxData[cell] = ', xlsxData[cell])

        jsonSCList[k][`field${i + 1}`] = xlsxData[cell]['v']

        if (i == headers.length - 1) {
          row++
        }
      }
    }

    // console.log(jsonSCList);
    // console.log('jsonSCList 1 = ', jsonSCList)
    resObj = _packageSubcontractorList(jsonSCList, subContractors, scNames, true)
    subContractors = resObj.subContractors
    console.log('_packageSubcontractorList', subContractors);
    // let arr = []
    // for (let i=0; i<subContractors.length; i++) {
    // arr.push(subContractors[i].companyName)
    // }
    // console.log('subContractors names = ', arr)

    // console.log('\n')
    // console.log('headers = ', headers)
    // console.log('\n')
    // console.log('row = ', row)
    // console.log('\n')
    // console.log('headerArray = ', headerArray)
    // console.log('\n')
    // console.log('headerLength = ', headerLength)
    // console.log('\n')
    // console.log('jsonSCList = ', jsonSCList)
    // console.log('\n')
    // console.log('subContractors = ', subContractors)
    // console.log('\n')
    // console.log('conditionCounter != 0 => ', conditionCounter != 0)

    if (!isShortNameAHeader || subContractors.length == 0) {
      returnData(subContractors)
    } else {
      getFormIdByShortName(subContractorsResult => {
        // console.log('subContractorsResult = ', subContractorsResult)
        returnData(subContractorsResult)
      })
    }

    // return res.status(200).json({ success: false, data: subContractors, error: 'Testing' });

  } else if (extension == 'csv') {
    // Read file and parse to JSON
    const organizeColumns = (data) => {
      const output = []
      const positions = {
        companyName: 0,
        contactName: 1,
        mail: 2,
        phone: 3,
        sourceSystemId: 4,
        ShortName: 5,
        requestorName: 6,
        requestorEmail: 7
      }

      const headers = data[0]
      const headerNames = Object.values(headers)

      isMinimumHeaderError = !headerNames.includes('companyName')
        || !headerNames.includes('contactName')
        || !headerNames.includes('mail')
        || !headerNames.includes('phone')
        || (!headerNames.includes('sourceSystemId')
          && (
            headerNames.includes('requestorName')
            || headerNames.includes('requestorEmail')
          )
        )


      const headerLen = headerNames.length
      // console.log('csv headers = ', headers)
      // console.log('csv header values = ', headerNames)
      const headerArr = Array(headerLen)
      for (let p in headers) {
        headerArr[positions[headers[p]]] = p
      }

      // console.log('key = ', key)
      // console.log('headerArr = ', headerArr)
      const correctOrder = ['field1', 'field2', 'field3', 'field4', 'field5']

      if (headerNames.includes('ShortName')) {
        correctOrder.push('field6')
        isShortNameAHeader = true
      }
      if (headerNames.includes('requestorName')) {
        correctOrder.push('field7')
      }
      if (headerNames.includes('requestorEmail')) {
        correctOrder.push('field8')
      }

      for (let k = 0; k < data.length; k++) {
        const obj = {}
        const datum = data[k]

        for (let i = 0; i < headerArr.length; i++) {
          const prevHeader = headerArr[i]
          const currHeader = correctOrder[i]
          // console.log('datum = ', datum)
          obj[currHeader] = datum[prevHeader]
        }
        output.push(obj)
      }

      return output
    }

    var csv = require("csvtojson");
    csv({
      noheader: true,
      output: "csv"
    })
      .fromString(csvFile.data)
      .on("end_parsed", function (jsonSCList) { //when parse finished, result will be emitted here.
        // console.log(jsonSCList);
        // console.log('extension = ', extension)
        const data = organizeColumns(jsonSCList)
        resObj = _packageSubcontractorList(data, subContractors, scNames, true)
        subContractors = resObj.subContractors
        if (!isShortNameAHeader || subContractors.length == 0) {
          returnData(subContractors)
        } else {
          getFormIdByShortName(subContractorsResult => {
            // console.log('subContractorsResult = ', subContractorsResult)
            returnData(subContractorsResult)
          })
        }
      })
  }
};

// Get csv file with SC data and validate it
exports.saveSCList = async function (req, res) {
  console.log('req', req.body);
  let resObj = ''
  let missingData = false;
  let noData = false;

  if (req.body.subcontractorsList == null)
    req.body.subcontractorsList = req.body;


  if (!req.body.subcontractorsList || req.body.subcontractorsList.length == 0 || (req.body.subcontractorsList.length == 1 && isObjEmpty(req.body.subcontractorsList[0]))) {
    noData = true;
  }

  if (!req.body.hiringClientId) {
    req.body.hiringClientId = req.currentHiringClientId;
  }

  if (!req.body.hiringClientId) {
    missingData = true;
  }

  var hiringClientId = req.body.hiringClientId

  if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) {
    missingData = true;
  }

  let err = null;
  if (missingData) {
    err = 'Some data is missing.';
  } else if (noData) {
    err = 'No Data was sent.';
  }

  if (err) {
    return res.status(200).json({ success: false, data: [], error: err });
  } else {
    console.log('saveSCList 534');
    const scNames = []
    const scMails = []
    let subContractors = []

    await subContractorsSql.loadSubcontractorsKeyValues(hiringClientId, function (err, result) {
      if (err) {
        return res.status(500).send(err);
      }
      for (let i = 0; i < result.length; i++) {
        scNames.push(result[i].n);
        scMails.push(result[i].m);
      }
    });

    const list = req.body.subcontractorsList;
    //Add form id if name is present instead  

    list.forEach((element, scIndex) => {
      subContractor = element;

      if (subContractor.sourceSystemID) {
        subContractor.sourceSystemId = subContractor.sourceSystemID;
      }

      if (scIndex == list.length - 1) {
        //Once all Form ids are checked or loaded the process continue
        resObj = _packageSubcontractorList(list, subContractors, scNames, false)
        subContractors = resObj.subContractors
        const isAnError = resObj.isAnError

        var subContractorIds = [];
        if (isAnError || subContractors.length == 0) {
          return res.status(200).json({ success: false, data: subContractors });
        } else {

          // No errors, then save to DB and send emails
          subContractorsSql.saveAllSubcontractorsTaxIds(hiringClientId, subContractors, function (err, result) {
            if (err) {
              console.log(err);
              return res.status(500).send(err);
            }
            subContractorIds = result;

            for (let j = 0; j < subContractors.length; ++j) {
              subContractors[j].id = subContractorIds[j];

              if (subContractors[j].requestorEmailError == "") { delete subContractors[j].requestorEmailError };
              if (subContractors[j].companyNameError == "") { delete subContractors[j].companyNameError };
              if (subContractors[j].mailError == "") { delete subContractors[j].mailError };
              if (subContractors[j].contactNameError == "") { delete subContractors[j].contactNameError };
              if (subContractors[j].phoneError == "") { delete subContractors[j].phoneError };
            }

            return res.status(200).json({ success: true, data: subContractors });
          });

          let method = req.method;
          let originalUrl = req.originalUrl;

          const logParams = {
            eventDescription: method + '/' + originalUrl,
            UserId: req.currentUser.Id,
            Payload: hiringClientId
          }
          logger.addEntry(logParams, function (err, result) {
            if (err) {
              console.log(logParams);
              console.log(err);
            }
          });
        }
      }
    }
    )
  }
};