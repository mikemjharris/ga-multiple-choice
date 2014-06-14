var express = require('express');
var router = express.Router();
var request = require('request');

var _ = require('underscore');
var ObjectID = require('mongoskin').ObjectID
/* GET users listing. */
router.get('/', function(req, res) {
  var db = req.db;

  db.collection('quiz_params').find().toArray(function (err, data) {
    res.render('quiz_index' , {existing_quizes: data});  
  });
});



router.get('/:id', function(req, res) {
  var db = req.db;
  var quiz_id = req.params.id;
  console.log(quiz_id)
  db.collection("quiz").find({"_id": new ObjectID(quiz_id)}).toArray(function(err,data) {
      res.json(data);
      });   
});


router.get('/:id/play',function(req,res){
  // var db = req.db;
  // db.collection(database_collection).find().toArray(function (err, data) {
   res.render('quiz_show', {quiz_id: req.params.id})
  // })
})


router.get('/:id/host_question', function(req, res) {
  var db = req.db;
  var quiz_id = req.params.id;
  // var question_id = req.params.q_id;
  db.collection("quiz").findOne({"_id": new ObjectID(quiz_id)},function(err,data) {
      res.json(data);
  });   
})


router.get('/:id/question/:q_id', function(req, res) {
  var db = req.db;
  var quiz_id = req.params.id;
  var question_id = req.params.q_id;
  db.collection("quiz").findOne({"_id": new ObjectID(quiz_id)},function(err,data) {
    var quiz_params = data.quiz_params
    var question = data["question" + question_id].question
    var answers = data["question" + question_id].answers
    res.json({question: question, answers: answers, quiz_params: quiz_params});
  });   
})


router.get('/:id/question/:q_id/answer/:ans_index', function(req, res) {
  var db = req.db;
  var quiz_id = req.params.id;
  var question_id = req.params.q_id;
  var answer_index = req.params.ans_index;
  db.collection("quiz").findOne({"_id": new ObjectID(quiz_id)},function(err,data) {
    // if ansers
    // var question = data["question" + question_id].question
    var answers = data["question" + question_id].answers
    var answer = data["question" + question_id].answer
    if(answer == answers[answer_index]) {
      message = "correct"
    } else {
      message = "incorrect"
    }

    res.json({message: message, answer: answer});
  });   
})



// {totalWorks: {$gte:10}}
//gets a random question from the database - at moment birthyear
router.get('/:id/question', function(req, res) {
  var db = req.db;
  console.log(req.query)
  // Question and answer fields 
  var question_key = req.query.question_key || "fc"
  var answer_key = req.query.answer_key || "birthYear"
  var database_collection = 'artists'
  
  db.collection(database_collection).find().toArray(function (err, data) {
    // pull in question data
    var question_data = _.sample(data,1)[0]
    var question = question_data[question_key]
    var question_answer = question_data[answer_key]
    console.log(question_answer)
    // query to filter out matching examples
    var db_query = {}
    db_query[question_key] = {$ne: question_data[question_key]}
    db_query[answer_key] = {$ne: question_data[answer_key]}
    console.log(db_query)
    db.collection(database_collection).find(db_query).toArray(function (err, data_answers) {
        
        var answers = _.pluck(_.sample(data_answers, 4), answer_key)
        answers.push(question_answer)
        answers = _.shuffle(answers)
        
        var client_data = { id: 7,  question: question, answers: answers}
        res.json(client_data);
    }); 
  }); 
});





module.exports = router;
