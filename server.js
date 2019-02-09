/******************SETUP******************/
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var session = require('express-session');
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 7823);
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'SuperSecretPassword'}));

/******************SETUP******************/

function globalContext(req) {
  return {
    logIn: req.session.logIn,
    vendor: req.session.vendor,
    customer: req.session.customer
  }
}


/**************ROUTE HANDLERS*************/
app.get('/',function(req,res){

  let context = globalContext(req);

  res.render('home', context);
});

app.get('/logIn',function(req, res){

  //upon successful log in, set session flag
  //and redirect user to home page
  if (req.query.logIn) {
    req.session.logIn = req.query.logIn || 0;
    req.session.customer = req.query.customer || 0;
    req.session.vendor = req.query.vendor || 0;
    res.writeHead(302, {
      'Location': '/'
    });
    res.end();
    return;
  }

  //if navigated to while not logged in
  let context = globalContext(req);

  res.render('logIn', context);
});

app.get('/logOut',function(req, res){

  //clear logIn and customer/vendor flag
  req.session.logIn = 0;
  req.session.customer = 0;
  req.session.vendor = 0;
  
  let context = globalContext(req);

  res.render('home', context);
});

app.get('/employee', function(req, res){

  let context = globalContext(req);

  res.render('employee', context);
});

app.get('/clockIO', function(req, res){

  let context = globalContext(req);

  res.render('clockIO', context);
});

app.get('/timesheet', function(req, res){

  let context = globalContext(req);

  res.render('timesheet', context);
});

app.get('/register', function(req, res){

  let context = globalContext(req);

  res.render('register', context);
});

/**************ROUTE HANDLERS*************/


/*************ERROR HANDLING**************/
app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});
/*************ERROR HANDLING**************/

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
