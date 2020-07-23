require('dotenv').config();

var express     			   = require('express');
var app         			   = express();
var path 							   = require('path');
var bodyParser  			   = require('body-parser');
var cookieParser 			   = require('cookie-parser');
var exphbs 						   = require('express-handlebars');
var expressValidator 	   = require('express-validator');
var flash 						   = require('connect-flash');
var session 					   = require('express-session');
var passport 					   = require('passport');
var morgan      			   = require('morgan');
var fileUpload           = require('express-fileupload');
var _ 								   = require('underscore');
var error_helper         = require('./helpers/error_helper');
// const workflows_procesor = require('./processors/workflow');
const { env }            = require('../environmentSwitch') 

// Use Express file upload component
app.use(fileUpload());

// routes
var apiRoutes = require('./routes/api');
var userRoutes = require('./routes/users');
var indexRoutes = require('./routes/index');
var webhooksRoutes = require('./routes/webhooks');

// models
var ChangedLookups = require('./mssql/changedlookups');
ChangedLookups.updateChangedLookups(function(err, updated, id){
  console.log("ChangedLookups updated:",updated);
});

// get config
var config = require('./config'); // get our config file
//var database = config.database;

// use morgan to log requests to the console
app.use(morgan('dev'));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/front', express.static('build'));
//app.use('/front', express.static(path.join('../../../certfocus_frontend/', 'build')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//CORS middleware
const cors = require("cors");
// var whitelist = ['http://pq7react-development.s3-website-us-east-1.amazonaws.com', 'http://amazonaws.com', 'http://localhost:3000']
// var corsOptions = {
//   origin: function (origin, callback) {
//     console.log('origin', origin);
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }
//app.use(cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,PATCH,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, x-access-token');
  next();
});

// Set routes and error middleware

// Workaroud to test webhooks with currently set URL in mailgun.
app.use('/api/communications', webhooksRoutes);

app.use('/api', apiRoutes);
app.use(function(err, req, res, next) {
  if(err) {
    req.logout();
    console.error(err.stack);
    var error = error_helper.getErrorData (error_helper.CODE_BACKEND_ERROR, error_helper.MSG_BACKEND_ERROR, {message:err.message});
    res.status(err.status || 500).json(error);
  } else {
    next();
  }
});

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;

  res.locals.loginPage = req.path == '/users/forgot';

  // set redirect for html
  if(!_.isEmpty(req.query) && !_.isEmpty(req.query.redirect)){
    var url = decodeURIComponent(req.query.redirect);
    res.locals.redirect = url;
  }

  next();
});

// user/index routes
app.use('/', indexRoutes);
app.use('/users', userRoutes);

// Set Port
const _port = (env == 'dev2' || env == 'stag' || env == 'prod' || env == 'dev') ? process.env.BACKEND_PORT : process.env.BACKEND_PORT_DEV
app.set('port', (_port));

// Start the server
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
  console.log('-------- RDS_HOSTNAME --------\n', process.env.RDS_HOSTNAME);
});

/*
// Clean handlers
function exitHandler(options, err) {
  try {
    console.log("Clearing interval")
    clearInterval(intervalTask);
    console.log("Interval cleared")
  }
  catch(e){
    console.log(e);
  }
}
// App closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// Catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
*/