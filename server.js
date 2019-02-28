/******************SETUP******************/
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var session = require('express-session');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    // host: 'localhost',
    // user: 'root',
    // password: 'mSeiais92bses',
    // database: 'antique_shop'
    host: 'classmysql.engr.oregonstate.edu',
    user: 'cs340_lewisjos',
    password: '2226',
    database: 'cs340_lewisjos'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//app.set('port', 7823);
app.set('port', 7824);
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'SuperSecretPassword'}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/******************SETUP******************/

function globalContext(req) {
  return {
    logIn: req.session.logIn,
    vendor: req.session.vendor,
    customer: req.session.customer,
    name: req.session.name,
    id: req.session.id
  }
}

/**************TEST VARIABLES*************/
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
/**************TEST VARIABLES*************/

/*
  INSERT:
    Transactions
    Line Items
    Time Logs
  SELECT:
    Transactions
    Line Items
    Time Logs
*/

/**************ROUTE HANDLERS*************/
app.get('/',function(req,res){

  let context = globalContext(req);

  let sql = req.query.search != undefined ? mysql.format('SELECT items.name, items.description, space_items.unit_price AS cost, space_items.space_id FROM items INNER JOIN space_items ON items.id = space_items.item_id WHERE items.name LIKE ? ORDER BY name', ['%' + req.query.search + '%']) : 'SELECT items.name, items.description, space_items.unit_price AS cost, space_items.space_id FROM items INNER JOIN space_items ON items.id = space_items.item_id ORDER BY name';

  pool.query(sql,
  function(error, results, fields) {
      if(error){
          res.render('500', context);
          return;
      }
      context.spaceItem = [];
      for(let i = 0; i < results.length; i++){
          context.spaceItem.push({name: results[i].name, description: results[i].description, cost:results[i].cost.toString(), spaceID:results[i].space_id.toString()});
      }
      if(req.session.vendor == 1){
        let sql = req.query.search != undefined ? mysql.format('SELECT name, description, id FROM items WHERE items.name LIKE ? OR items.description LIKE ? ORDER BY name', ['%' + req.query.search + '%', '%' + req.query.search + '%']) : 'SELECT name, description, id FROM items';

	pool.query(sql,
	function(error, results, fields){
	  if(error){
	    res.render('500', context);
	    return;
	  }
	  context.item = [];
	  for(let i = 0; i < results.length; i++){
	    context.item.push(results[i]);
	  }
	  res.render('home', context);
	});
      }else{
        res.render('home', context);
      }
  });
});

app.get('/logIn',function(req, res){

  //upon successful log in, set session flag
  //and redirect user to home page
  if (req.query.logIn) {
    if(req.query.accType == "employee"){
      let sql = mysql.format('SELECT (COUNT(*) > 0) AS auth FROM vendors WHERE id=? AND first_name=?', [parseInt(req.query.ID), req.query.Fname]);
      pool.query(sql,
      function(error, results, fields){
        if(error){
          let context = globalContext(req);
    	    res.render('500', context);
    	    console.log(error);
    	    return;
    	  }
    	if(results[0].auth){
    	  req.session.logIn = req.query.logIn || 0;
        req.session.name = req.query.Fname || null;
        req.session.vendor = 1;
        res.writeHead(302, {
          'Location': '/'
        });
        console.log(req.session);
        res.end();
      }
      else{
          let context = globalContext(req);
    	  context.failedAuth = 1;
    	  res.render('logIn', context);
    	}
      });
    }
    else{
      let sql = mysql.format('SELECT (COUNT(*) > 0) AS auth FROM customers WHERE id=? AND first_name=?', [parseInt(req.query.ID), req.query.Fname]);
      pool.query(sql,
      function(error, results, fields){
        if(error){
          let context = globalContext(req);
    	  res.render('500', context);
    	  console.log(error);
    	  return;
    	}
    	if(results[0].auth){
    	  req.session.logIn = req.query.logIn || 0;
          req.session.name = req.query.Fname || null;
          req.session.id = parseInt(req.query.ID);
          req.session.customer = 1;
          res.writeHead(302, {
            'Location': '/'
          });
          res.end();
    	}else{
          let context = globalContext(req);
    	  context.failedAuth = 1;
    	  res.render('logIn', context);
    	}
      });
    }
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

app.post('/clockIO', function(req, res){

  let context = globalContext(req);
  let sql = mysql.format('INSERT INTO time_logs (vendor_id, time_in, time_out) VALUES (?, ?, ?)',
  [req.session.id, req.body.timeIn, req.body.timeOut || null]);

  console.log(sql);

  /*pool.query(sql, function(error, results, fields){
    if(error){
      console.log(error);
      res.render('500', context);
      return;
    }
    res.writeHead('302', {
      Location: '/'
    });
    res.redirect('/clockIO');
  });*/
  res.redirect('/clockIO');
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
  pool.query('SELECT id, first_name, last_name, rewards_points FROM customers',
  function(error, results, fields){
      if(error){
          res.render('500', context);
          return;
      }
      context.customers = [];
      for(let i = 0; i < results.length; i++){
          context.customers.push({id: results[i].id, name: results[i].first_name + " " + results[i].last_name, rewardsPoints: results[i].rewards_points});
      }
      res.render('meetCustomers', context);
  });
});

app.get('/meetVendors', function(req, res){

    let context = globalContext(req);
    pool.query('SELECT first_name, last_name, employed, id FROM vendors ORDER BY last_name',
    function(error, results, fields){
        if(error){
            res.render('500', context);
            return;
        }
        context.vendors = [];
        for(let i = 0; i < results.length; i++){

          let test = mysql.format('SELECT id FROM spaces WHERE vendor_id=?', [results[i].id]);
          let spaces = [];
          pool.query(test, function(error, r, fields){
            for (let x=0; x<r.length; x++){
              spaces.push(r[x].id);
            }
            context.vendors.push({spaces: spaces, id: results[i].id, name: results[i].first_name + " " + results[i].last_name, description: results[i].employed ? "An employee" : "An unemployed vendor"});
          });
        }
        res.render('meetVendors', context);
    });
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

app.post('/newSpace', function(req, res){
  let context = globalContext(req);

  let getID = mysql.format('SELECT id FROM vendors WHERE first_name=? AND last_name=?', [req.body.Fname, req.body.Lname]);
  console.log(getID);

  pool.query(getID, function(error, results, fields){
    if(error){
      console.log(error);
      res.render('500', context);
      return;
    }
    context.fname = req.body.Fname;
    if (results[0]){    
      let sql = mysql.format('INSERT INTO spaces (vendor_id) VALUES (?)', [results[0].id]);
      pool.query(sql, function(error, results, fields){
        if(error){
          console.log(error);
          res.render('500', context);
          return;
        }
        context.newID = results.insertId;
        res.render('newSpace', context);
        return;
      });
    }
    else{
      context.error = 1;
      res.render('newSpace', context);
    }
    
  });
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

  let context = globalContext(req);
  
  if (isEmpty(req.query)) {
    //request the user to specify how many items are in the transaction
    context.numItems = null;
    res.render('addTransaction', context);  
  }
  else {

    //insert transaction
    let sql = mysql.format("INSERT INTO transactions (customer_id) VALUES (?)", [parseInt(req.query.CID)]);
    pool.query(sql, function(error, results, fields){
      //display the appropriate number of rows (one per line item)
      context.numItems = [];
      context.newID = results.insertId;
      for(var i=0; i<req.query.numItems; i++)
        context.numItems.push(0);
      res.render('addTransaction', context); 
    });
  }  
});

app.post('/addTransaction', function(req, res){
  let context = globalContext(req);

  let temp = [];
  let values = [];
  for(var i=0; i<req.body.itemID.length; i++) {
    temp.push("(?)");

    values.push([parseInt(req.body.itemID[i]), parseInt(req.body.TID), parseInt(req.body.VID[i]), parseInt(req.body.quantity[i]), parseInt(req.body.price[i])]);
  }
  temp = "INSERT INTO line_items (item_id, transaction_id, vendor_id, quantity, unit_price) VALUES " + temp.join();

  let sql = mysql.format(temp, values);
  pool.query(sql, function(error, results, fields){
    if(error){
      console.log(error);
      res.render('500', context);
      return;
    }
    context.success = "Transaction successfully added! Invoice No. " + req.body.TID;
    res.render('addTransaction', context);
  });
});

app.post('/createItem', function(req, res){
  let context = globalContext(req);
  var sql = mysql.format('INSERT INTO items(name, description) VALUE(?, ?)', [req.body.name, req.body.description]);
  pool.query(sql,
  function(error, results, fields){
    if(error){
      console.log(error);
      res.render('500', context);
      return;
    }
    res.writeHead('302', {
      Location: '/'
    });
    res.end();
  });
});

app.post('/createSpaceItem', function(req, res){
  let context = globalContext(req);
  var sql = mysql.format('INSERT INTO space_items(space_id, item_id, unit_price) VALUE(?, ?, ?)', [req.body.space_id, req.body.item_id, req.body.cost]);
  pool.query(sql,
  function(error, results, fields){
    if(error){
      console.log(error);
      res.render('500', context);
      return;
    }
    res.writeHead('302', {
      Location: '/'
    });
    res.end();
  });
});

app.post('/register', function(req, res){
  let context = globalContext(req);
  if(req.body.accType == "vendor"){
    var sql = mysql.format('INSERT INTO vendors (first_name, last_name, employed) VALUE (?, ?, ?)', [req.body.Fname, req.body.Lname, req.body.employed != undefined ? true : false]);
    pool.query(sql,
    function(error, results, fields){
      if(error){
          console.log(error);
          res.render('500', context);
          return;
      }
      req.session.logIn = 1;
      req.session.name = req.body.Fname || null;
      req.session.vendor = 1;
      res.writeHead('302', {
          Location: "/"
      });
      res.end();
    });
  }else{
    var sql = mysql.format('INSERT INTO customers (first_name, last_name, phone_number) VALUE (?, ?, ?)', [req.body.Fname, req.body.Lname, req.body.Pnumber]);
    pool.query(sql,
    function(error, results, fields){
      if(error){
          console.log(error);
          res.render('500', context);
          return;
      }
      req.session.logIn = 1;
      req.session.name = req.body.Fname || null;
      req.session.customer = 1;
      res.writeHead('302', {
          Location: "/"
      });
      res.end();
    });
  }
});
/**************ROUTE HANDLERS*************/

function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }
  return true;
}


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
