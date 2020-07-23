const AWS = require('aws-sdk');
const Videos = require('../mssql/videos');
const error_helper = require('../helpers/error_helper');
const { bucket, apiVersion } = require('../helpers/aws_helper')

const _getImage = async function(imgId, callback) {
  const s3        = new AWS.S3({
    apiVersion: apiVersion, 
    params: { Bucket: bucket }
  });
  const fileName  = `video ${imgId}.png`; 
  const awsParams = { Bucket: bucket, Key: fileName };

  await s3.getObject(awsParams, function(err, data) {
    if (err) {
      console.log(err);
      callback(err, null)
    } else {
      let obj = {
        imgId: Number(imgId),
        content: data.Body.toString('base64')
      }
      callback(null, obj)
    }
  });
}


exports.getVideoImages = async(req, res) => {
  const imgId     = req.query.imgId

  if (!imgId){
    error = error_helper.getErrorData (error_helper.CODE_VIDEO_NOT_FOUND, error_helper.MSG_VIDEO_NOT_FOUND);
    return res.send(error)
  }

  _getImage(imgId, (err, obj) => {
    if (err) {
      return res.send(err)
    } else {
      return res.status(200).json({ success: true, data: obj })
    }
  })
  
}

exports.getVideos = async function(req, res) {
  let 
    error = null,
    roleId = req.query.roleId,
    data

  if (!roleId){
    error = error_helper.getErrorData (error_helper.CODE_VIDEO_NOT_FOUND, error_helper.MSG_VIDEO_NOT_FOUND);
    return res.send(error)
  }

  await Videos.getVideos(roleId, async function(err, response) {
    if (err) {
      error = error_helper.getSqlErrorData (err);
    }
    if (!response){
      error = error_helper.getErrorData (error_helper.CODE_VIDEO_NOT_FOUND, error_helper.MSG_VIDEO_NOT_FOUND);
    }
    if (!response || err) {
      return res.send(error)
    }

    data = response

    return res.status(200).json({ success: true, data })
  })
  
}