/******************SETUP******************/
var express = require('express');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 7823);
app.use(express.static(__dirname + '/public'));
/******************SETUP******************/


/**************ROUTE HANDLERS*************/
app.get('/',function(req,res){
  res.render('home');
});

app.get('/login',function(req, res){
  res.render('login');
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
