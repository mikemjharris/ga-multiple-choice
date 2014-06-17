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
var LocalStrategy   = require('passport-local').Strategy;
var flash = require('connect-flash');

//database setup
var mongo = require('mongoskin');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var port = process.env.PORT || 3000;
var mongoUri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/multiple_choice";
var db = mongo.db( mongoUri  , {native_parser:true} );
var db2 = mongoose.connect( mongoUri  , {native_parser:true} );


// collections.each(function(err, collection) {
    // console.log(collections);
// });

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    name: {type: String},
    password: { type: String, required: true }
});
 
UserSchema.pre('save', function(next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) return next(err);
      // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
          if (err) return next(err);
          // override the cleartext password with the hashed one
          user.password = hash;
          next();
        });
    });
});


UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

var User = mongoose.model('User', UserSchema);

// var mike = new User;
// mike.username = "mike7";
// mike.age = 30;
// mike.password = "password"
// mike.save(function(err){
//   console.log("err" + err);
//   User.find().exec(function(err, result) {
//     console.log("***" + result);
// })
// });


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


// passport.use(new LocalStrategy(function(username, password,done){
//     Users.findOne({ username : username},function(err,user){
//         if(err) { return done(err); }
//         if(!user){
//             return done(null, false, { message: 'Incorrect username.' });
//         }

//         hash( password, user.salt, function (err, hash) {
//             if (err) { return done(err); }
//             if (hash == user.hash) return done(null, user);
//             done(null, false, { message: 'Incorrect password.' });
//         });
//     });
// }));





passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
        User.findOne({ 'username' :  email }, function(err, user) {
        //     // if there are any errors, return the error
            if (err)
                return done(err);

        //     // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('info', 'That email is already taken.'));
            } else {

        // if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.username  = email;
                newUser.password  = password;
                // newUser.local.password = newUser.generateHash(password);

        // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    // console.log(newUser)
                    return done(null, newUser);
                });
            }

        }); 
      });   
}));

passport.use('local-signin', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) { // callback with email and password from our form
        User.findOne({ 'username' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, {message: "Incorrect Info"}); 

      // if the user is found but the password is wrong
            user.comparePassword(password,function(err, match) {
                if (err) {
                  return done(null, false); 
                } else {
                  if(match) {
                    return done(null, user);      
                  } else {
                    return done(null, false); 
                  }
                }
            })
               

            // all is well, return successful user
            
        });

    }));




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
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({secret: '1234567890QWERTY'}));
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req,res,next){
    req.db = db;
    next();
});

app.get('/sign_up', function(req, res) {
    res.render('sign_up', {title: "Multiple Choice Quiz Register"})
});

app.get('/sign_in', function(req, res) {
    res.render('sign_in', {title: "Multiple Choice Quiz Sign In"})
});

app.post('/sign_up', passport.authenticate('local-signup', {
    // successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error  
  }),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    user = req.user
    user.name = req.body.name
    console.log(req.params)
    console.log(req.body)
    user.save()
    req.flash('info', 'You signed up successfully')
    res.redirect('/');
  }
);

app.post('/sign_in', passport.authenticate('local-signin', {
    // successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error  
  }),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    req.flash('info', 'Welcome back ' + req.user.name)
    res.redirect('/');
  }

);



app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/login' }));



app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                     failureRedirect: '/login' }));




app.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); 
  });
});


app.use('/', routes);
app.use('/users', users);
app.use('/quiz', quiz);





// var fs = require('fs')
// var readline = require('readline');
// fs.createReadStream("./public/list_of_films.txt",  function (err,data) {
//   console.log("herrrre")
//   if (err) {
//     return console.log(err);
//   }
//     console.log(data);
//   }
// );

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
