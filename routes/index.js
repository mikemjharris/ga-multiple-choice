var express = require('express');
var router = express.Router();
var _ = require('underscore');
var ObjectID = require('mongoskin').ObjectID
/* GET home page. */

router.get('/', function(req, res) {
  if(req.user) {
    res.locals.loggedin = true;
    res.locals.currentuser = req.user;
    console.log(req.user)
  }
  
  res.render('index', { title: 'Quiz Game' , flash_message: req.flash('info') });
});

router.get('/multi_quiz', function(req, res) {
  if(req.user){
    res.locals.loggedin = true;
    res.locals.currentuser = req.user;
  }
  res.render('quiz_multi_show', {title: "Quiz Player"});
});



router.all('*', function(req, res, next){
  if(req.user){
    res.locals.loggedin = true;
    res.locals.currentuser = req.user;
    next();
  } else {
    req.flash('info', 'You need to be logged in')
    res.redirect("/" );
  }

  
});





router.get('/multi_quiz_host', function(req, res) {
  var db = req.db;
  db.collection('quiz_params').find().toArray(function (err, data) {
    res.render('quiz_index' , {existing_quizes: data, title: "Choose a Quiz", game_type: "multi"});  
  });
});


router.get('/multi_quiz_host/:id', function(req, res) {
  res.render('quiz_multi_host', {quiz_id: req.params.id, title: "Quiz "})
});

router.get('/list_quizes', function(req, res) {
  var db = req.db;
  db.collection('quiz_params').find().toArray(function (err, data) {
    res.json(data)
  });
});


router.get('/list_quizes/:id', function(req, res) {
  var db = req.db;
  var quiz = {}
  var quiz_param_id = req.params.id
  // console.log(quiz_param_id.id)

  db.collection("quiz").find({ "quiz_params._id": new ObjectID(quiz_param_id)}).toArray(function(err,data) {
    var response = _.pluck(data, "_id")
    res.json(response)
  })

})

router.get('/generate_quiz/:id', function(req, res) {
  var db = req.db;
  var quiz = {}
  var quiz_param_id = req.params.id
  // console.log(quiz_param_id.id)

  db.collection("quiz_params").find({"_id": new ObjectID(quiz_param_id)}).toArray(function(err,data) {
    var quiz_params =  data[0]
    quiz.quiz_params = quiz_params;

    generate_an_answer(quiz, db, 1 , function(result) {
      db.collection("quiz").insert(result, function(err, result) {
        res.send(
            (err === null) ? result[0]._id : { msg: err }
        );
      });
    });
  })
});


function loggedIn(req, res, next) {
  if (req.user) {
    res.locals.loggedin = true;
    res.locals.currentuser = req.user;
    next();
  } else {
    // next();
    res.redirect('/');
  }
}

router.get('/create_quiz', loggedIn, function(req, res, test) {
  var db = req.db;
  console.log(req.user)
  var collections = ["films" , "artists" ,"artworks"]
  db.collection(collections[0]).find().toArray(function (err, data) {
  // 
    var keys = _.keys(data[0])
    res.render('create_quiz' , {keys: keys, example_data: data[0], collections: collections, title: "Multiple Choice Quiz Template Creator" });  
  });  
});

router.get('/create_quiz/:id', function(req, res) {
  var db = req.db;

  var collection_name = req.params.id
  db.collection(collection_name).find().toArray(function (err, data) {
    var keys = _.keys(data[0])
    res.json({keys: keys, example_data: data[0]});  
  });  
});



router.post('/create_quiz', function(req, res) {
  var db = req.db;
  var quiz_params = req.body

  db.collection('quiz_params').insert(req.body , function (err, result) {
    res.send(
            (err === null) ? { msg: "" } : { msg: err }
        );
  });
});


generate_an_answer = function (quiz, db, i, callback) {
      var question_key = quiz.quiz_params.question_key 
      var answer_key = quiz.quiz_params.answer_key
      var database_collection = 'films'
    
      db.collection(database_collection).find().toArray(function (err, data) {
        var question_data = _.sample(data,1)[0]
        var question = question_data[question_key]
        var question_answer = question_data[answer_key]
        var db_query = {}
        db_query[question_key] = {$ne: question_data[question_key]}
        db_query[answer_key] = {$ne: question_data[answer_key]}
        
        db.collection(database_collection).find(db_query).toArray(function (err, data_answers) {
          var all_answers = _.pluck(data_answers, answer_key)
          var all_answers = _.uniq(all_answers)
          console.log(all_answers)
          var answers = _.sample(all_answers, 3)
          answers.push(question_answer)
          answers = _.shuffle(answers)

          quiz["question" + i] = { question: question, answers: answers, answer: question_answer}
          
          if (i < quiz.quiz_params.nos_questions) {
            i = i + 1
            quiz = generate_an_answer(quiz, db, i, callback )
          } else {
          callback(quiz)
          return quiz
        }
        }); 
      });
      // return quiz
}
  
module.exports = router;
