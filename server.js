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
    customer: req.session.customer,
    name: req.session.name
  }
}

/**************TEST VARIABLES*************/
//For Meet vendors and customers
let people = [
  {
    name: 'Joe Lewis',
    description: 'A developer'
  },
  {
    name: 'Alex Guyer',
    description: 'Another developer'
  }
];

//For customer purchases page
let purchases = [
  {
    id: 50,
    name: 'Lamp',
    description: "Moths love this.",
    cost: 20
  },
  {
    id: 3,
    name: 'Vinyl',
    description: "Probably makes noise.",
    cost: 8
  }
];

//For vendor sales page
let sales = [
  {
    id: 50,
    name: 'Lamp',
    cost: 20
  },
  {
    id: 6,
    name: 'Robot Toy',
    cost: 85
  }
];

//For home page stock
let items = [
  {
    id: 50,
    name: 'Lamp',
    description: "Moths love this.",
    cost: 20
  },
  {
    id: 3,
    name: 'Vinyl',
    description: "Probably makes noise.",
    cost: 8
  },
  {
    id: 6,
    description: "Beep boop",
    name: 'Robot Toy',
    cost: 85
  },
  {
    id: 14,
    description: "Moths also love this.",
    name: 'Wool Sweater',
    cost: 150
  },
  {
    id: 57,
    description: "Take it or leave it",
    name: 'Original Picasso',
    cost: 20
  }
];
/**************TEST VARIABLES*************/

/**************ROUTE HANDLERS*************/
app.get('/',function(req,res){

  let context = globalContext(req);
  context.item = items;

  res.render('home', context);
});

app.get('/logIn',function(req, res){

  //upon successful log in, set session flag
  //and redirect user to home page
  if (req.query.logIn) {
    req.session.logIn = req.query.logIn || 0;
    req.session.name = req.query.Fname || null;
    
    if (req.query.accType == "employee") {
      req.session.vendor = 1;
    }
    else {
      req.session.customer = 1;
    }

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

  //clear session login data
  req.session.logIn = 0;
  req.session.customer = 0;
  req.session.vendor = 0;
  req.session.name = 0;

  res.writeHead(302, {
    'Location': '/'
  });
  res.end();
  return;
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

app.get('/meetCustomers', function(req, res){

  let context = globalContext(req);
  context.customers = people;

  res.render('meetCustomers', context);
});

app.get('/meetVendors', function(req, res){

  let context = globalContext(req);
  context.vendors = people;

  res.render('meetVendors', context);
});

app.get('/sales', function(req, res){

  let context = globalContext(req);
  context.sale = sales;

  res.render('sales', context);
});

app.get('/newSpace', function(req, res){

  let context = globalContext(req);

  res.render('newSpace', context);
});

app.get('/Purchases', function(req, res){

  let context = globalContext(req);
  context.purchase = purchases;

  res.render('purchases', context);
});

app.get('/Rewards', function(req, res){

  let context = globalContext(req);
  context.points = 100;
  context.value = 1;

  res.render('rewards', context);
});

app.get('/addItem', function(req, res){

  let context = globalContext(req);

  res.render('addItem', context);
});

app.get('/addTransaction', function(req, res){

  let context = globalContext(req)

  res.render('addTransaction', context);
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
