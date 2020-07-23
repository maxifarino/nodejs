require('dotenv').config();
var FTPClient = require('ftp');
const host       = process.env.CERT_UPLOAD_SFTP_HOST
const port       = process.env.CERT_UPLOAD_SFTP_PORT
const username   = process.env.CERT_UPLOAD_SFTP_USERNAME
const password   = process.env.CERT_UPLOAD_SFTP_PASSWORD
const remotePath = process.env.CERT_UPLOAD_SFTP_REMOTE_PATH

exports.transferFile = async (file, filename, callback) => {
  console.log('file', file, filename);  
  const ftpClient = new FTPClient();

  ftpClient.connect({
    host: host,
    port: port,
    user: username,
    password:password,
    keepalive: 99999
  });
  console.log('filePath', remotePath + '/' + filename);
  
  ftpClient.on('ready', () => {    
    ftpClient.put(file, remotePath + '/' + filename, (err) => {
      ftpClient.end();      
      (err) 
        ? callback(err)
        : callback();      
    });
  });
}