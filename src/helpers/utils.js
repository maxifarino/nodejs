const crypto = require('crypto');

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

exports.getRandomPassword = function () {
  return Math.random().toString(36).slice(-8);
}

exports.isPasswordValid = function (password) {
  // let isValid = false
  // let patt1   = /[A-Z]/g
  // let patt2   = /[a-z]/g
  // let patt3   = /\d/g
  // let patt4   = /(\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\+|\=)/g

  // if (	 patt1.test(password) 
  // 		&& patt2.test(password) 
  // 		&& patt3.test(password)
  // 		&& patt4.test(password)
  //     && password.length > 5
  //   ) {
  // 	isValid = true
  // }

  // return isValid

  let isValid = false

  if (password.length > 5) {
    isValid = true
  }

  return isValid
}

exports.isEmailValid = function (email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

exports.getUpdateQuery = function (tableName, idToModify, columns) {
  var query = `UPDATE ${tableName} SET `;
  var columnsAdded = 0;

  for (key in columns) {
    if (columns[key]) {
      if (columnsAdded > 0) {
        query += ', ';
      }
      query += `${key} = '${columns[key]}'`;
      columnsAdded++;
    }
  }

  query += ` WHERE Id = ${idToModify}`;

  return query;
}

exports.updateUserWithColumns = function (user, columns) {
  for (key in columns) {
    if (columns[key]) {
      user[key] = columns[key];
    }
  }

  // remove values from jwt
  user.iat = undefined;
  user.exp = undefined;

  return user;
}

exports.getHMAC = function (payload, key, algorithm) {
  const hmac = crypto.createHmac(algorithm, key)
    .update(payload)
    .digest('hex');

  return hmac
}

exports.xTimeFromNow = (unitType, unit) => {

  let xTimeFromNow = ''

  const t = new Date()
  const y = t.getFullYear()
  const m = t.getMonth()
  const d = t.getDate()
  const h = t.getHours()

  if (unitType == 'years') {
    xTimeFromNow = new Date(y + unit, m, d).getTime()
  } else if (unitType == 'months') {
    xTimeFromNow = new Date(y, m + unit, d).getTime()
  } else if (unitType == 'weeks') {
    const weeks = unit * 7
    xTimeFromNow = new Date(y, m, d + weeks).getTime()
  } else if (unitType == 'days') {
    xTimeFromNow = new Date(y, m, d + unit).getTime()
  } else if (unitType == 'hours') {
    xTimeFromNow = new Date(y, m, d, h + unit).getTime()
  }
  return xTimeFromNow
}

exports.date2str = (x, y) => {
  var z = {
      M: x.getMonth() + 1,
      d: x.getDate(),
      h: x.getHours(),
      m: x.getMinutes(),
      s: x.getSeconds()
  };
  y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
      return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2)
  });

  return y.replace(/(y+)/g, function(v) {
      return x.getFullYear().toString().slice(-v.length)
  });
}

exports.sanitizeQuotesForDB = (str) => {
  return str.replaceAll(/'/g, '"')
}

exports.addDoubleQuotes = (str) => {
  const AP = 'APOSTROPHE'
  return str.replace(AP, '"')
}

exports.cleanUrl = (str) => {
  // Urls should not be fed names with an '&' in them.  Change to 'and'
  let _str = str.replace(/&/g, 'and')
  _str = _str.replace(/(\?|\<|\>|\#|\%|\{|\}|\||\\|\^|\~|\;|\:|\=|\[|\]|\`|\"|\'|\/|\@|\$|\+|\,|\*)/g, '')
  return _str
}

exports.isLetter = (str) => {
  return /[a-zA-Z]/g.test(str)
}

exports.isNum = (str) => {
  return /[0987654321]+/g.test(str)
}

exports.isObjEmpty = (obj) => {
  let res = false
  if ((Object.keys(obj)).length < 1) {
    res = true
  }
  return res
}

exports.uniquifyList = (list) => {
  const output = []
  if (list && list.length && list.length > 0) {
    const arr = typeof list == 'string' ? list.split(',') : (Array.isArray(list) ? list : [])
    const unique = new Set(arr)

    unique.forEach((item) => {
      output.push(item)
    })
  }
  return output
}

exports.getFirstAndManyUniquePropsFromObjArray = (array, prop) => {
  // console.log('getFirstAndManyUniquePropsFromObjArray')
  // console.log('\n')
  // console.log('array.length = ', array.length)
  let output = { multiple: [], first: null }
  if (Array.isArray(array) && array.length > 0 && array[0][prop]) {
    output = {}
    output.first = array[0][prop]
    const unprocessed = array.map(obj => obj[prop])
    // console.log('unprocessed.length = ', unprocessed.length)
    output.multiple = exports.uniquifyList(unprocessed)
    // console.log('output.multiple.length = ', output.multiple.length)
  }
  return output
}

exports.parsePseudoJSON = (stringList) => {
  let output = []
  if (stringList) {
    const json = `[${stringList}]`
    output = JSON.parse(json)
  }
  return output
}

exports.asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

exports.selectObjFromObjArrayByPropValue = (prop, value, objArray) => {
  for (let i = 0; i < objArray.length; i++) {
    const obj = objArray[i]
    if (obj[prop] == value) {
      return obj
    }
  }
  return null
}

exports.uniqueifyObjectArray = (objArray, prop) => {
  const setOfUniqueObjProps = new Set()
  const newArray = []
  for (let i = 0; i < objArray.length; i++) {
    const obj = objArray[i]
    const value = obj[prop]
    setOfUniqueObjProps.add(value)
  }
  setOfUniqueObjProps.forEach((value) => {
    const obj = selectObjFromObjArrayByPropValue(prop, value, objArray)
    if (obj) {
      newArray.push(obj)
    }
  })
  return newArray
}

const _isValidNumber = (number) => {
  return /^-?\d+(\.\d+)?$/.test(number);
}

const _round = (number) => {
  return Math.round(number)
}

const _normalizeNumber = (number) => {
  const roundedNumber = _round(number)
  const normalizedNumber = roundedNumber.toString().replace(/,/g, '').replaceAll(' ', '');

  return _isValidNumber(normalizedNumber) ? parseFloat(normalizedNumber) : 0
}

const _formatNumberWithCommas = (number) => {
  let normalizedValue = _normalizeNumber(number).toString();

  let x = normalizedValue.split('.');
  let x1 = x[0] + '';
  let x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;

  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1,$2');
  }

  return x1 + x2;
}

exports.formatCurrency = (number) => {
  return '$' + _formatNumberWithCommas(number.toString().replace('$', ''));
}

exports.validatePhone = (_phone) => {
  let outcome = ''
  let phone = _phone
  let num = ''
  let notAnumber = ''
  let allowedLengths = new Set([10, 11, 12])

  if (phone && typeof phone == 'string') {
    phone = phone.replaceAll('(', '')
    phone = phone.replaceAll(')', '')
    phone = phone.replaceAll('-', '')
    phone = phone.replaceAll(' ', '')
    phone = phone.replaceAll('+', '')
    num = Number(phone)
    notAnumber = Number.isNaN(num)

  } else {
    notAnumber = true
  }

  if (!allowedLengths.has(phone.length) || notAnumber) {
    outcome = false
  } else {
    outcome = phone
  }
  return outcome
}