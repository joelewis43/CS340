/******************SETUP******************/
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
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
app.use(session({ secret: 'SuperSecretPassword' }));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/************************************SETUP************************************/




/***********************************HELPERS***********************************/

/***********************************************************************
  Function:     globalContext
  Written By:   Alexander Guyer and Joseph Lewis
  Description:  initializes the context variable for routes. Takes
                data from the session and returns it in an object.
***********************************************************************/
function globalContext(req) {
  return {
    logIn: req.session.logIn,
    vendor: req.session.vendor,
    customer: req.session.customer,
    name: req.session.name,
    id: req.session.id
  }
}

/***********************************************************************
  Function:     isEmpty
  Written By:   Joseph Lewis
  Description:  returns true if an object has no key / value pairs
***********************************************************************/
function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }
  return true;
}

/***********************************HELPERS***********************************/




/*******************************ROUTE HANDLERS********************************/
/***********************************************************************
  Title:        Homepage
  Route:        /
  Written By:   Alexander Guyer
  Description:
***********************************************************************/
app.get('/', function (req, res) {

  let context = globalContext(req);

  let sql = req.query.search != undefined ? mysql.format('SELECT items.name, items.description, space_items.unit_price AS cost, space_items.space_id FROM items INNER JOIN space_items ON items.id = space_items.item_id WHERE items.name LIKE ? ORDER BY name', ['%' + req.query.search + '%']) : 'SELECT items.name, items.description, space_items.unit_price AS cost, space_items.space_id FROM items INNER JOIN space_items ON items.id = space_items.item_id ORDER BY name';

  pool.query(sql, function (error, results, fields) {
    if (error) {
      res.render('500', context);
      return;
    }
    context.spaceItem = [];
    for (let i = 0; i < results.length; i++) {
      context.spaceItem.push({ name: results[i].name, description: results[i].description, cost: results[i].cost.toString(), spaceID: results[i].space_id.toString() });
    }
    if (req.session.vendor == 1) {
      let sql = req.query.search != undefined ? mysql.format('SELECT name, description, id FROM items WHERE items.name LIKE ? OR items.description LIKE ? ORDER BY name', ['%' + req.query.search + '%', '%' + req.query.search + '%']) : 'SELECT name, description, id FROM items';

      pool.query(sql, function (error, results, fields) {
        if (error) {
          res.render('500', context);
          return;
        }
        context.item = [];
        for (let i = 0; i < results.length; i++) {
          context.item.push(results[i]);
        }
        res.render('home', context);
      });
    } else {
      res.render('home', context);
    }
  });
});

/***********************************************************************
  Title:        Log In
  Route:        /logIn
  Written By:   Alexander Guyer
  Description:
***********************************************************************/
app.get('/logIn', function (req, res) {

  //upon successful log in, set session flag
  //and redirect user to home page
  if (req.query.logIn) {
    if (req.query.accType == "employee") {
      let sql = mysql.format('SELECT (COUNT(*) > 0) AS auth FROM vendors WHERE id=? AND first_name=?', [parseInt(req.query.ID), req.query.Fname]);
      pool.query(sql, function (error, results, fields) {
        if (error) {
          let context = globalContext(req);
          res.render('500', context);
          console.log(error);
          return;
        }
        if (results[0].auth) {
          req.session.logIn = req.query.logIn || 0;
          req.session.name = req.query.Fname || null;
          req.session.id = parseInt(req.query.ID);
          req.session.vendor = 1;
          res.writeHead(302, {
            'Location': '/'
          });
          res.end();
        }
        else {
          let context = globalContext(req);
          context.failedAuth = 1;
          res.render('logIn', context);
        }
      });
    }
    else {
      let sql = mysql.format('SELECT (COUNT(*) > 0) AS auth FROM customers WHERE id=? AND first_name=?', [parseInt(req.query.ID), req.query.Fname]);
      pool.query(sql, function (error, results, fields) {
        if (error) {
          let context = globalContext(req);
          res.render('500', context);
          console.log(error);
          return;
        }
        if (results[0].auth) {
          console.log()
          req.session.logIn = req.query.logIn || 0;
          req.session.name = req.query.Fname || null;
          req.session.customer = 1;
          req.session.id = parseInt(req.query.ID);
          res.writeHead(302, {
            'Location': '/'
          });
          res.end();
        } else {
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

/***********************************************************************
  Title:        Log Out
  Route:        /logOut
  Written By:   Joseph Lewis
  Description:  Clears the user's session data, logging them out
                of the website.
***********************************************************************/
app.get('/logOut', function (req, res) {

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

/***********************************************************************
  Title:        Register
  Route:        /register
  Written By:   
  Description:
***********************************************************************/
app.get('/register', function (req, res) {

  let context = globalContext(req);

  res.render('register', context);
});

/***********************************************************************
  Title:        Clock in and out form
  Route:        /clockIO
  Written By:   Joseph Lewis
  Description:  Renders the clock in form
***********************************************************************/
app.get('/clockIO', function (req, res) {

  let context = globalContext(req);

  res.render('clockIO', context);
});

/***********************************************************************
  Title:        Clock in and out form handler
  Route:        /register
  Written By:   Joseph Lewis
  Description:  Inserts the employees shift to the time_logs relation
  WARNINGS:     VID is hardcoded, change once we can reference VID
                from session
***********************************************************************/
app.post('/clockIO', function (req, res) {

  //build global context
  let context = globalContext(req);

  //build todays date
  let today = new Date();
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  let date = year + "-" + month + "-" + day;

  //convert in and out times to sql data format
  let tIn = date + " " + req.body.timeIn + ":00";
  let tOut = date + " " + req.body.timeOut + ":00";

  //build query string with input from clock IO form
  let sql = mysql.format('INSERT INTO time_logs (vendor_id, time_in, time_out) VALUES (?, ?, ?)', [1, tIn, tOut]);

  //insert time log
  pool.query(sql, function(error, results, fields){
    if (error) {
      let context = globalContext(req);
      res.render('500', context);
      console.log(error);
      return;
    }

    //set success flag
    context.success = 1;

    //render the clock IO form page
    res.render('clockIO', context);
  });  
});

/***********************************************************************
  Title:        View Timesheet
  Route:        /timesheet
  Written By:   Joseph Lewis
  Description:
***********************************************************************/
app.get('/timesheet', function (req, res) {

  let context = globalContext(req);

  res.render('timesheet', context);
});

/***********************************************************************
  Title:        Meet Customers
  Route:        /meetCustomers
  Written By:   Alexander Guyer
  Description:
***********************************************************************/
app.get('/meetCustomers', function (req, res) {

  let context = globalContext(req);
  pool.query('SELECT id, first_name, last_name, rewards_points FROM customers', function (error, results, fields) {
    if (error) {
      res.render('500', context);
      return;
    }
    context.customers = [];
    for (let i = 0; i < results.length; i++) {
      context.customers.push({ id: results[i].id, name: results[i].first_name + " " + results[i].last_name, rewardsPoints: results[i].rewards_points });
    }
    res.render('meetCustomers', context);
  });
});

/***********************************************************************
  Title:        Meet Vendors
  Route:        /meetVendors
  Written By:   Alexander Guyer and Joseph Lewis
  Description:  Displays all vendors stored in the database. Details
                include their ID, employment status, and which spaces
                belong  to them.
***********************************************************************/
app.get('/meetVendors', function (req, res) {

  let context = globalContext(req);

  //Select all vendors
  pool.query('SELECT first_name, last_name, employed, id FROM vendors ORDER BY last_name', function (error, results, fields) {
    if (error) {
      res.render('500', context);
      return;
    }
    context.vendors = [];
    let numCallback = 0;

    //for each vendor
    for (let i = 0; i < results.length; i++) {

      let spaces = [];

      //select each vendors space IDs
      let test = mysql.format('SELECT id FROM spaces WHERE vendor_id=?', [results[i].id]);
      pool.query(test, function (error, r, fields) {

        //create an array of the vendor's space IDs
        for (let x = 0; x < r.length; x++) {
          spaces.push(r[x].id);
        }

        //push vendor values into context for rendering
        context.vendors.push({ spaces: spaces, id: results[i].id, name: results[i].first_name + " " + results[i].last_name, description: results[i].employed ? "An employee" : "An unemployed vendor" });

        //increment numCallback for each vendor pushed to context
        numCallback++;
        if (numCallback == results.length)
          res.render('meetVendors', context);
      });
    }
  });
});

/***********************************************************************
  Title:        Sales Form
  Route:        /sales
  Written By:   Joseph Lewis
  Description:  Displays a form which asks for the vendor ID whose
                sales you want to view.
***********************************************************************/
app.get('/sales', function (req, res) {

  let context = globalContext(req);

  res.render('sales', context);
});

/***********************************************************************
  Title:        Sales Form Results
  Route:        /sales
  Written By:   Joseph Lewis
  Description:
***********************************************************************/
app.post('/sales', function (req, res) {

  //build global context
  let context = globalContext(req);

  //build the query string with the user's vendor id input
  let sql = mysql.format(
    "SELECT i.name, li.transaction_id, li.quantity, li.unit_price " +
    "FROM line_items AS li " +
    "INNER JOIN items AS i ON li.item_id=i.id " +
    "WHERE vendor_id=?;", parseInt([req.body.VID]));

  //query database for all line items sold by vendor
  pool.query(sql, function (error, results, fields) {

    context.sales = [];

    //for each line item returned by query
    for (let i = 0; i < results.length; i++) {
      let x = results[i];

      //push the line item details to context
      context.sales.push({ name: x.name, tid: x.transaction_id, quantity: x.quantity, cost: x.unit_price });
    }

    //render sales page
    res.render('sales', context);
  });
});

/***********************************************************************
  Title:        New Space Form
  Route:        /newSpace
  Written By:   Joseph Lewis
  Description:  Renders a form asking for the first and last name of
                the vendor who is adding a space.
***********************************************************************/
app.get('/newSpace', function (req, res) {

  let context = globalContext(req);

  res.render('newSpace', context);
});

/***********************************************************************
  Title:        New Space Handler
  Route:        /newSpace
  Written By:   Joseph Lewis
  Description:  Selects the vendor's ID from the form data
                then inserts the vendor into the spaces table
***********************************************************************/
app.post('/newSpace', function (req, res) {

  //build global context
  let context = globalContext(req);

  //builds query to select vendor's ID with user's first and last name inputs
  let getID = mysql.format('SELECT id FROM vendors WHERE first_name=? AND last_name=?', [req.body.Fname, req.body.Lname]);

  //selects the vendor ID
  pool.query(getID, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.render('500', context);
      return;
    }

    //store vendor name in context
    context.fname = req.body.Fname;

    //if the first name and last name returns a valid vendor ID
    if (results[0]) {

      //build query to insert vendor into spaces table with result from select vendor ID query
      let sql = mysql.format('INSERT INTO spaces (vendor_id) VALUES (?)', [results[0].id]);

      //insert the vendor into spaces
      pool.query(sql, function (error, results, fields) {
        if (error) {
          console.log(error);
          res.render('500', context);
          return;
        }

        //store the new space ID
        context.newID = results.insertId;

        //render newSpace page
        res.render('newSpace', context);
        return;
      });
    }
    //query did not return a vendor ID
    else {
      //set error flag
      context.error = 1;

      //render newSpace page
      res.render('newSpace', context);
    }

  });
});

/***********************************************************************
  Title:        Purchases
  Route:        /purchases
  Written By:   Joseph Lewis
  Description:  Displays the line items the customer has purchased
  Warnings:     SELECT query WHERE condition is hardcoded, change
                once we can access customer / vendor ID from session
***********************************************************************/
app.get('/Purchases', function (req, res) {

  //build global context
  let context = globalContext(req);

  //build query to select all line items the customer has purchased
  let sql = mysql.format(
    "SELECT t.id AS INVOICE, i.name AS ITEM, li.quantity, li.vendor_id, li.unit_price " +
    "FROM transactions AS t " +
    "INNER JOIN line_items AS li ON li.transaction_id = t.id " +
    "INNER JOIN items AS i ON li.item_id=i.id " +
    "WHERE t.customer_id=1");

  //select all line items with the given customer ID
  pool.query(sql, function (error, results, fields) {

    context.purchases = [];

    //loops over each line item returned by the query
    for (let i = 0; i < results.length; i++) {
      let x = results[i];

      //push line item details into context
      context.purchases.push({ name: x.ITEM, tid: x.INVOICE, vid: x.vendor_id, quantity: x.quantity, cost: x.unit_price });
    }

    //render the purchases page
    res.render('purchases', context);
  });
});

/***********************************************************************
  Title:        Rewards
  Route:        /Rewards
  Written By:   
  Description:  Displays the customers current rewards
***********************************************************************/
app.get('/Rewards', function (req, res) {

  let context = globalContext(req);
  context.points = 100;
  context.value = 1;

  res.render('rewards', context);
});

/***********************************************************************
  Title:        Add Transaction Form
  Route:        /addTransaction
  Written By:   Joseph Lewis
  Description:  Renders a form to add a transaction to the database.
                The form submits via GET, if a query string exists
                the page renders a list of forms to add line-items.
***********************************************************************/
app.get('/addTransaction', function (req, res) {

  //build global context
  let context = globalContext(req);

  //empty query string when the page first loads
  if (isEmpty(req.query)) {
    
    //render the add transaction page
    //asks how many line items are on the sale
    context.numItems = null;
    res.render('addTransaction', context);

  }
  //query string provided
  else {

    //build query to insert into transaction table based on user input
    let sql = mysql.format("INSERT INTO transactions (customer_id) VALUES (?)", [parseInt(req.query.CID)]);

    //insert into transaction table
    pool.query(sql, function (error, results, fields) {

      context.newID = results.insertId;

      //create an array with as many indexs as their are line items in the sale
      context.numItems = [];
      for (var i = 0; i < req.query.numItems; i++)
        context.numItems.push(0);
      
      //render the Add Transaction page with one form field per line item
      res.render('addTransaction', context);
    });
  }
});

/***********************************************************************
  Title:        Add Transaction Handler
  Route:        /addTransaction
  Written By:   Joseph Lewis
  Description:  
***********************************************************************/
app.post('/addTransaction', function (req, res) {

  //build global context
  let context = globalContext(req);

  //for each line item provided, push a values field (?) and the values into the respective array
  let temp = [];
  let values = [];
  for (var i = 0; i < req.body.itemID.length; i++) {
    temp.push("(?)");
    values.push([parseInt(req.body.itemID[i]), parseInt(req.body.TID), parseInt(req.body.VID[i]), parseInt(req.body.quantity[i]), parseInt(req.body.price[i])]);
  }

  //build the query string to insert line items
  let queryString = "INSERT INTO line_items (item_id, transaction_id, vendor_id, quantity, unit_price) VALUES " + temp.join();
  let sql = mysql.format(queryString, values);

  //insert line items
  pool.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.render('500', context);
      return;
    }

    //add success message
    context.success = "Transaction successfully added! Invoice No. " + req.body.TID;

    //render the add transaction page (will display the add transaction form with the success messaage)
    res.render('addTransaction', context);
  });
});

/***********************************************************************
  Title:        Create Item Handler
  Route:        /createItem
  Written By:   Alexander Guyer
  Description:  
***********************************************************************/
app.post('/createItem', function (req, res) {
  let context = globalContext(req);
  var sql = mysql.format('INSERT INTO items(name, description) VALUE(?, ?)', [req.body.name, req.body.description]);
  pool.query(sql, function (error, results, fields) {
    if (error) {
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

/***********************************************************************
  Title:        Create Space Item Handler
  Route:        /createSpaceItem
  Written By:   Alexander Guyer
  Description:  
***********************************************************************/
app.post('/createSpaceItem', function (req, res) {
  let context = globalContext(req);
  var sql = mysql.format('INSERT INTO space_items(space_id, item_id, unit_price) VALUE(?, ?, ?)', [req.body.space_id, req.body.item_id, req.body.cost]);
  pool.query(sql, function (error, results, fields) {
    if (error) {
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

/***********************************************************************
  Title:        Registration Handler
  Route:        /register
  Written By:   Alexander Guyer
  Description:  
***********************************************************************/
app.post('/register', function (req, res) {
  let context = globalContext(req);
  if (req.body.accType == "vendor") {
    var sql = mysql.format('INSERT INTO vendors (first_name, last_name, employed) VALUE (?, ?, ?)', [req.body.Fname, req.body.Lname, req.body.employed != undefined ? true : false]);
    pool.query(sql, function (error, results, fields) {
      if (error) {
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
  } else {
    var sql = mysql.format('INSERT INTO customers (first_name, last_name, phone_number) VALUE (?, ?, ?)', [req.body.Fname, req.body.Lname, req.body.Pnumber]);
    pool.query(sql, function (error, results, fields) {
      if (error) {
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
/*******************************ROUTE HANDLERS********************************/




/*******************************ERROR HANDLING********************************/
app.use(function (req, res) {
  res.status(404);
  res.render('404');
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});
/*******************************ERROR HANDLING********************************/




/*******************************SERVER LAUNCH*********************************/
app.listen(app.get('port'), function () {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
/*******************************SERVER LAUNCH*********************************/