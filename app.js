var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var user = []
var passport = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

//database setup
var mongo = require('mongoskin');
var mongoose = require('mongoose');
var port = process.env.PORT || 3000;
var mongoUri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/multiple_choice";
var db = mongo.db( mongoUri  , {native_parser:true} );
var db2 = mongoose.connect( mongoUri  , {native_parser:true} );


// collections.each(function(err, collection) {
    // console.log(collections);
// });



var userSchema = new mongoose.Schema ({
    name:  String,
    age:  { type: Number, min: 0, max: 100 }
});

var User = mongoose.model('User', userSchema);

// var mike = new User;
// mike.name = "mike";
// mike.age = 30;
// mike.save();

// User.find().exec(function(err, result) {
//     console.log("***" + result);
// })
// console.log(mike);

var sass = require('node-sass');
// sass.render({
//     file: "./sass/quiz.scss",
//     success: function() {
//       console.log("succes!")
//     },
//     error: function(error) {
//       console.log(error)
//     }
   
//     });




passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new TwitterStrategy({
    consumerKey: process.env.AUTH_TWITTER_NODE_GAME_KEY,
    consumerSecret: process.env.AUTH_TWITTER_NODE_GAME_SECRET,
    callbackURL: process.env.AUTH_TWITTER_NODE_GAME_CALLBACK
  },
  function(token, tokenSecret, profile, done) {
    user = profile;
    session.profile = profile
    done(null, profile._json);
    // User.findOrCreate(..., function(err, user) {
      // if (err) { return done(err); }
      // done(null, user);
    // });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.AUTH_FACEBOOK_KEY,
    clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {
         user = profile;
        session.profile = profile
        console.log(profile)
        done(null, profile);
    // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
  }
));

var routes = require('./routes/index');
var users = require('./routes/users');
var quiz = require('./routes/quiz');


var app = express();

app.use(sass.middleware({
src: __dirname + '/sass',
dest: __dirname + '/public',
debug: true,
outputStyle: 'compressed'
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({secret: '1234567890QWERTY'}));
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req,res,next){
    req.db = db;
    next();
});


app.use('/', routes);
app.use('/users', users);
app.use('/quiz', quiz);

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/login' }));

app.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                     failureRedirect: '/login' }));

app.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
});



var fs = require('fs')
var readline = require('readline');
fs.createReadStream("./public/list_of_films.txt",  function (err,data) {
  console.log("herrrre")
  if (err) {
    return console.log(err);
  }
    console.log(data);
  }
);

// var rd = readline.createInterface({
//     input: fs.createReadStream('./public/list_of_films.txt'),
//     output: process.stdout,
//     terminal: false
// });

// rd.on('line', function(line) {
//     // console.log(line);
//     var reg1 = /\s\b/
//     var reg2 = /\(/
//     console.log(line.substring(line.search(reg1) , line.search(reg2)).trim())

// });



/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
