var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const hbs = require('express-handlebars');
var db=require('./config/connection')
var fileUpload=require('express-fileupload');
var session = require('express-session');

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var vendorRouter = require('./routes/vendor');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine( 'hbs', hbs.engine( { 
  extname: 'hbs', 
  defaultLayout: 'layout', 
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
} ) );

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({secret: 'secret',cookie:{maxAge:2592000000}})); // session upto 30 days ,  for 1 minute apply 60000, for 5 minutes 300000 


// db.connect((err)=>{
//   if(err) {
//     console.log("connection error: "  + err);
//   }else{
//     console.log("Database connection established");
//   } 
// })

const startApp = async () => {
  try {
    await db.connect();
    console.log("Database connection established on port 3000");
  } catch (err) {
    console.error("Connection error: " + err);
  }
}

startApp();



app.use('/',usersRouter);
app.use('/admin',adminRouter);
app.use('/vendor',vendorRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
