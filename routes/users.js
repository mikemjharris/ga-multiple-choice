var express = require('express');
var router = express.Router();
var request = require('request');
/* GET users listing. */
router.get('/', function(req, res) {
  var db = req.db;
  console.log(req)
  // {totalWorks: {$gte:10}}
  db.collection('artists').find({id: 430}).toArray(function (err, users) {
        var oneuser = Math.floor(Math.random() * users.length) 
        var user = users[oneuser]
        console.log(user.birthYear)
        db.collection('artists').find({birthYear: {$ne: user.birthYear}}).toArray(function (err, all_users) {
            var user_answers = []
            for (var i = 0; i < 4; i++) {
              user_answers.push(all_users[Math.floor(Math.random() * all_users.length)])
            }
            db.collection('artworks').find({"acno" : "A00018"}).toArray(function (err, artworks) {
              console.log("888" + artworks)
              console.log("888" + user.fc)
              res.render('users', { user_answers: user_answers, users: user, artworks: artworks });
            });

            }); 
        });
});


router.get('/mongoose', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/art', function(req, res) {
   var db = req.db;
  
  db.collection('artworks').find().toArray(function (err, art) {
        // var oneuser = Math.floor(Math.random() * users.length) 
        // var user = users[oneuser]
        res.render('art', { art: art[0] });
  }); 
});

router.get('/request_test', function(req, res) {
    request("http://www.omdbapi.com/?t=true+grit", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body) // Print the google web page.
    }
    })

    res.render('art', { art: "hi" });

});



module.exports = router;
