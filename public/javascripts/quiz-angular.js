'use strict';

var app = angular.module('quizApp', ['ngRoute']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/'});
}]);

app.controller('QuizController', function($scope, $http) {
    $scope.question = ""
    $scope.question_nos = 0
    $scope.answers = []
    $scope.quiz_params = ""
    $scope.shownext = false
    $scope.score = 0  
    $scope.quiz_id = $('#quiz_id').html()
    $scope.canAnswer = true

     
    $scope.getNextQuestion = function() {
        $scope.canAnswer = true
        $scope.shownext = false
        $scope.clicked = 999
        $scope.correct = 999
        $scope.question_nos += 1
        $scope.message = ""
        $http.get("/quiz/" + $scope.quiz_id + "/question/" + $scope.question_nos).success(function(data){
          $scope.question = data.question
          $scope.answers = data.answers
          $scope.quiz_params = data.quiz_params
        })
    
    }

    //show questions when page loads
    $scope.getNextQuestion()

    $scope.submitAnswer = function(index_item) {
      if($scope.canAnswer) {
        $scope.canAnswer = false
        $scope.clicked = index_item
        $http.get("/quiz/" + $scope.quiz_id + "/question/" + $scope.question_nos + "/answer/" + index_item).success(function(data){
            $scope.message = data.message
            $scope.correct = $scope.answers.indexOf(data.answer)
            if($scope.message == "Correct") {
              $scope.score += 1
            }      
            if($scope.question_nos >= $scope.quiz_params.nos_questions) {
              $scope.showFinish = true
            }
            $scope.shownext = true

        })
      } else {
      $scope.message = "You've already submitted an answer!"
    }
    }

    $scope.createQuiz = function() {
      $http.post("create_quiz", $scope.new_quiz).success(function(data) {
        console.log("success")
        $scope.message = "Quiz created"
      });
    }
    
})

app.controller('GenerateQuizController', function($scope, $http) {
  $http.get("/list_quizes").success(function(data) {
    $scope.existing_quizes = data
  })  

    $scope.show_quiz_template = ""
    $scope.quizes = []
    $scope.generated_quiz = {msg: ""}

   
    $scope.showQuizTemplate = function(quiz) {
        $scope.show_quiz_template = quiz
        $scope.showQuizes(quiz._id)
    }

    $scope.showQuizes = function(id){
      $http.get('/list_quizes/' + $scope.show_quiz_template._id).success(function(data){
            $scope.quizes = data 

      })
    }

    $scope.generateQuiz = function() {
      $scope.generated_quiz.msg = "Generating quiz - please wait.."
      $http.get("/generate_quiz/" + $scope.show_quiz_template._id).success(function(data) {
          $scope.generated_quiz.id = data.substring(1,data.length -1)
          // console.log(data)
          $scope.quizes.push($scope.generated_quiz.id)
          $scope.generated_quiz.msg = "Quiz generated - click to play!"
      })
    }


})







app.controller('MultiQuizController', function($scope, $http, socket) {
  $scope.question = ""
  $scope.question_nos = 0
  $scope.answers = []
  $scope.quiz_params = ""
  $scope.shownext = false
  $scope.score = 0  
  $scope.quiz_id = $('#quiz_id').html()
  $scope.socket_id = ""
  $scope.message = ""
  $scope.canAnswer = true
  $scope.stats = {}
  $scope.points = {}
  
  
  var room = "abc123";
  
  
  socket.on('connect', function() {
    $scope.socket_id = this.socket.sessionid
    socket.emit('room', room);
  });

  socket.on('points', function(data) {

    $scope.points = data
  });
  
  socket.on("questions" , function(data) {
    $scope.canAnswer = true
    $scope.shownext = false
    $scope.clicked = 999
    $scope.correct = 999
    $scope.question_nos += 1
    $scope.message = data.message
    $scope.question = data.question
    $scope.answers = data.answers
    $scope.quiz_params = data.quiz_params  
  })

  socket.on("results", function(data) {
    $scope.score = data[$scope.socket_id ].score
    $scope.message = data[$scope.socket_id ].message
    $scope.correct = data[$scope.socket_id ].answer
    $scope.stats = data
    $scope.question_nos = data[$scope.socket_id ].nos
    console.log(data)

  })
  
  $scope.submitAnswer = function(index_item) {
    if($scope.canAnswer) {
      $scope.canAnswer = false
      $scope.clicked = index_item
      $scope.message = "Answer submitted"
      socket.emit("answer", index_item)
    } else {
      $scope.message = "You've already submitted an answer!"
    }
  }

  $scope.submitUsername = function() {
    if($('#currentuser').html()) {
      $scope.username = $('#currentuser').html()
    } else {
      $scope.username = $scope.input_username
    }
    var data = {}
    data[$scope.socket_id] = $scope.username
    socket.emit('username' , data);
  }


})



app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    },
  };
});