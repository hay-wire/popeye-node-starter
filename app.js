var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.load({ path: '.env' });

var app = express();

mongoose.connect(process.env.MONGODB || process.env.MONGODB_URI);
mongoose.connection.on('error', ()=>{
  console.log("MongoDB connection error. Please make sure that MongoDB is running.");
  process.exit(1);
});

var index = require('./routes/index');
var api = require('./routes/api');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//define controllers
const userController = require("./controllers/user");
const jwtHelper = require("./helpers/jwtHelper");

app.use('/', index);
app.use('/api', jwtHelper.verify, api);

// signUp and signIn apis
app.post("/signUp", userController.validateAuthCredentials, userController.signUp);
app.post("/signIn", userController.validateAuthCredentials, userController.signIn);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
