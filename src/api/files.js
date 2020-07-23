require('dotenv').config();
const _ = require('underscore')
const AWS = require('aws-sdk');
const files = require('../mssql/files');
const error_helper = require('../helpers/error_helper');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper')
const { writeLog } = require('../utils')
const { cleanUrl, isObjEmpty } = require('../helpers/utils')

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

const _getDocumentsFileName = function (documentFileName, subcontractorId, newFileId) {
  const fileExtension = documentFileName.split('.').pop();
  const fileName = documentFileName.slice(0, - (fileExtension.length + 1)).replaceAll(" ", "_").replaceAll("'", "");
  const newFilename = `${fileName}_${subcontractorId}_${newFileId}.${fileExtension}`;
  console.log('newFilename ',newFilename);
  return newFilename;
}

// For testing only.  If a newly created database will not allow private keys to be reset, then the above function will throw errors.  The bottom function will work.

// const getDocumentsFileName = function(documentFile, subcontractorId) {
// 	let fileExtension = documentFile.name.split('.').pop();
// 	let fileName = documentFile.name.slice(0, - (fileExtension.length + 1)).replaceAll(" ", "_").replaceAll("'", "");
// 	let newFilename = fileName + '_' + subcontractorId.toString() + '_' + '.' + fileExtension;
// 	return newFilename;
// }

exports.getDocumentFileName = function (documentFileName, subcontractorId, newFileId) {
  return _getDocumentsFileName(documentFileName, subcontractorId, newFileId);
}

exports.getFilesForSavedForms = async function (req, res) {
  let invalidData = false
  const queryParams = req.query

  if (!queryParams)
    invalidData = true;

  if (!queryParams) {
    invalidData = true;
  } else {
    const {
      SubcontractorId,
      PayloadId
    } = queryParams



    if (PayloadId && (parseInt(PayloadId) <= 0 || isNaN(parseInt(PayloadId)))) invalidData = true;
    if (SubcontractorId && (parseInt(SubcontractorId) <= 0 || isNaN(parseInt(SubcontractorId)))) invalidData = true;

  }


  if (invalidData) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  await files.getFilesForSavedForms(queryParams, function (err, filesResult) {

    if (err) {
      error = error_helper.getSqlErrorData(err);
      res.status(500).send(error);
    } else if (filesResult) {

      for (i = 0; i < filesResult.length; i++) {
        let documentFile = filesResult[i];
        documentFile.name = documentFile.Name;

        // console.log('@@@'.repeat(40))
        // console.log('filesResult = ', JSON.stringify(documentFile))

        filesResult[i].url = _getDocumentsFileName(documentFile.name, documentFile.SubcontractorId, documentFile.Id);
      }

      return res.status(200).json({ success: true, data: filesResult });

    }


  });

}

// Get files by sc
exports.getFiles = async function (req, res) {

  let
    invalidData = false,
    queryParams = req.query,
    subcontractorId,
    pageSize,
    pageNumber,
    orderBy,
    orderDirection

  if (!queryParams) {
    invalidData = true;
  }
  else {
    let {
      subcontractorId,
      pageSize,
      pageNumber,
      hiringClientId,
      roleId
    } = queryParams



    if (pageSize && (parseInt(pageSize) <= 0 || isNaN(parseInt(pageSize)))) invalidData = true;
    if (pageNumber && (parseInt(pageNumber) <= 0 || isNaN(parseInt(pageNumber)))) invalidData = true;
    if (subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
    if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
    if (roleId && (parseInt(roleId) <= 0 || isNaN(parseInt(roleId)))) invalidData = true;

    if (orderBy && (orderBy !== "id" &&
      orderBy !== "fileName" &&
      orderBy !== "uploadDate" &&
      orderBy !== "fileType"))
      invalidData = true;

    if (orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;

  }


  if (invalidData) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  await files.getFiles(queryParams, function (err, filesResult, totalCount) {

    if (err) {
      error = error_helper.getSqlErrorData(err);
      res.status(500).send(error);
    }

    for (i = 0; i < filesResult.length; i++) {
      let documentFile = filesResult[i];
      documentFile.name = documentFile.fileName;
      filesResult[i].url = _getDocumentsFileName(documentFile.name, documentFile.subcontractorId, documentFile.id);
    }

    return res.status(200).json({ success: true, totalCount, data: filesResult });
  });
};

getURL = function (file) {
  return "dummyUrl/" + file.fileName;
}



// Upload file and add entry in files table
exports.addDocumentFile = async function (req, res) {

  // console.log('ADD FILE! '.repeat(20))
  // console.log('req.body = ', JSON.stringify(req.body))
  // console.log('req.files = ', JSON.stringify(req.files))

  let
    invalidData = false,
    body = req.body,
    {
      subcontractorId,
      fileTypeId,
      hiringClientId,
      FinancialDataFlag
    } = body,
    {
      documentFile,
      payloadId
    } = req.files

  if (!req.files) {
    let error = error_helper.getErrorData(error_helper.CODE_NO_FILE_UPLOADED, error_helper.MSG_NO_FILE_UPLOADED);
    return res.send(error);
  }

  if (!body) {
    invalidData = true;
  } else {

    if (FinancialDataFlag == '1' || FinancialDataFlag == 1) {
      body.FinancialDataFlag = 1
    } else if (FinancialDataFlag == null || FinancialDataFlag == 'null') {
      body.FinancialDataFlag = null
    } else {
      invalidData = true
    }

    if (!documentFile) invalidData = true;

    if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
    if (subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
    if (fileTypeId && (parseInt(fileTypeId) <= 0 || isNaN(parseInt(fileTypeId)))) invalidData = true;
    if (payloadId && (parseInt(payloadId) <= 0 || isNaN(parseInt(payloadId)))) invalidData = true;
  }



  if (invalidData) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // If all validations passed then check documents folder and create it if required
  // and save file in the appropiate location

  const logParams = {};
  let method = req.method;
  let originalUrl = req.originalUrl;

  logParams.userId = req.currentUser.Id;
  logParams.eventDescription = method + '/' + originalUrl;
  body.logParams = logParams;
  documentFile.name = cleanUrl(documentFile.name);
  // console.log('documentFile.name = ', documentFile.name)
  body.name = documentFile.name;

  await files.addDocumentFile(body, async function (err, newFileId) {
    if (err) {
      error = error_helper.getSqlErrorData(err);
      writeLog('err = ', err)
      writeLog('error = ', error)
      res.status(500).send(error);
    }

    var s3 = new AWS.S3({ apiVersion: apiVersion, params: { Bucket: bucket } });

    console.log("Bucket object created");

    var key = _getDocumentsFileName(documentFile.name, subcontractorId, newFileId);
    console.log("Bucket key:" + key);

    // var key = getDocumentsFileName(documentFile, subcontractorId);
    // console.log("Bucket key:" + key);

    const params = { Bucket: bucket, Key: key, Body: documentFile.data, ContentDisposition: 'inline' };
    s3.upload(params, function (err, data) {
      if (err) {
        console.log(err)
        return res.status(500).send(error);
      } else {
        console.log("Successfully uploaded data to S3 Bucket");
        return res.status(200).json({ success: true, fileId: newFileId });
      }
    });
  });
};

exports.downloadFile = async function (req, res) {
  try {

    let invalidData = false;
    const query = req.query;
    let fileName;

    if (!query) {
      invalidData = true;
    }
    else {
      fileName = query.fileName;

      if (!fileName) invalidData = true;
    }

    if (invalidData) {
      const error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
      return res.status(500).send(error);
    }

    var s3 = new AWS.S3({ apiVersion: apiVersion, params: { Bucket: bucket } });

    console.log("Bucket object created");

    const params = { Bucket: bucket, Key: fileName };
    s3.getObject(params, function (err, data) {
      if (err) {

        return res.status(500).send(err);
      } else {
        console.log("Successfully downloaded data from S3 Bucket");
        return res.status(200).json({ success: true, fileName: fileName, fileData: data.Body.toString('base64') });
      }
    });
  }
  catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
}

exports.viewFileLink = async (req, res) => {
  try {
    let invalidData = false;
    const query = req.query;
    let fileName;

    if (!query) {
      invalidData = true;
    }
    else {
      fileName = query.fileName;

      if (!fileName) invalidData = true;
    }

    if (invalidData) {
      const error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
      return res.status(500).send(error);
    }

    await cfSign(fileName, (err, url) => {
      if (err) {
        writeLog(err);
        console.log(err);
        return res.status(500).send(err);
      } else {
        console.log('url in new viewFileLink = ', url)
        return res.status(200).json({ success: true, url });
      }
    })

  }
  catch (err) {
    writeLog(err);
    console.log(err);
    return res.status(500).send(err);
  }

}

exports.getFormatedNameFile = function (documentFileName, subcontractorId, newFileId) {
  return _getDocumentsFileName(documentFileName, subcontractorId, newFileId);
}
