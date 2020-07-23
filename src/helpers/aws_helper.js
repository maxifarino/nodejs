require('dotenv').config();
const AWS          = require('aws-sdk')
const { cleanUrl } = require('../helpers/utils')
const { writeLog } = require('../utils')

const bucket       =  process.env.S3_BUCKET
const accesKey     =  process.env.S3_KEY
const secret       =  process.env.S3_SECRET
const cfurl        =  process.env.CLOUDFRONTURL
const rsa          =  process.env.CF_RSA.split('\\n').concat().join('\n')
const keypairId    =  process.env.CF_KEY
const unitType     =  process.env.CF_UNIT_TYPE
const unit         =  Number(process.env.CF_UNIT)

const { xTimeFromNow } = require('../helpers/utils')

const cred = {
  accessKeyId: accesKey,
  secretAccessKey: secret
}
const S3 = new AWS.S3(cred)
exports.bucket     = bucket
exports.apiVersion = '2006-03-01'

exports.cfSign = async (fileName, callback) => {
  try {
    const expireTime = xTimeFromNow(unitType, unit)
    const locUrl     = `${cfurl}${fileName}`
    const cfSigner   = new AWS.CloudFront.Signer(keypairId, rsa)
    const options    = {
      url: locUrl,
      expires: expireTime
    }
    const signedUrl  = cfSigner.getSignedUrl(options)
    // console.log('signedUrl = ', signedUrl)

    callback(null, signedUrl)
  }
  catch (err) {
    const msg = `error in presign. ${err}`
    // writeLog(err)
    console.log(msg)
    callback(msg)
  }
}

exports.s3upload = async (key, data, callback) => {
  const s3 = new AWS.S3({apiVersion: apiVersion, params: {Bucket: bucket}})
  const params = {Bucket: bucket, Key: key, Body: data, ACL: 'public-read'};

    await s3.upload(params, (err) => {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })

}
