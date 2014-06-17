'use strict';

var app = angular.module('quizHostApp', ['ngRoute']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/'});
}]);


app.controller('MultiQuizController', function($scope, $http, socket) {
    $scope.question = ""
    $scope.points = {first: 1 , right: 0, wrong: 0}
    $scope.question_nos = 0
    $scope.answers = []
    $scope.quiz_params = ""
    $scope.shownext = false
    $scope.score = {}  
    $scope.quiz_id = $('#quiz_id').html()
    $scope.players = []
    $scope.message = ""
    $scope.stats = {}
    $scope.firstAnswer = true
    $scope.gameStarted = false
    $scope.showNextQn = true

    $http.get("/quiz/" + $scope.quiz_id + "/host_question/").success(function(data){
      $scope.question_data = data
    });

    $scope.question_data = ""
    var room = "abc123";
    
    socket.on('connect', function() {
      // Connected, let's sign-up for to receive messages for this room
        socket.emit('room', room);
      });
 
    socket.on('message', function(data) {
        console.log('Incoming message:', data);
    });

    socket.on('answer', function(data) {
        $scope.stats[data.id] = $scope.stats[data.id] || {score: 0 , message: "", answer: 999 }
        if($scope.answers[data.answer] == $scope.question_data["question" + $scope.question_nos].answer) {
          if($scope.firstAnswer == true) {
            $scope.firstAnswer = false
            $scope.stats[data.id].score  = ($scope.stats[data.id].score + $scope.points.first) 
            $scope.stats[data.id].message = "You were correct and the fastest!"
           } else {
            $scope.stats[data.id] = $scope.stats[data.id] || {score: 0 , message: "" }
            $scope.stats[data.id].score  = ($scope.stats[data.id].score + $scope.points.right) 
            $scope.stats[data.id].message = "You got the right answer but you weren't the quickest"
           }
        } else {
            $scope.stats[data.id].score  = ($scope.stats[data.id].score + $scope.points.wrong)
            $scope.stats[data.id].message = "You got the answer wrong"
        }
        $scope.stats[data.id].answer = $scope.question_data["question" + $scope.question_nos].answer
    });

    socket.on("players", function(data) {
      $scope.players = data;
      });

    socket.on("username" , function(data) {
      if(!$scope.gameStarted) {
        var id = Object.keys(data)[0]
        $scope.stats[id] = {score: 0 , message: "Please wait for the game to start", answer: 999, username: data[id] }
        for(var key in $scope.stats) {
          if($scope.players[""].indexOf(key) == -1) {
              delete $scope.stats[key] 
            }
        }
        socket.emit("results" , $scope.stats)
      }
    });

    $scope.getNextQuestion = function() {
      $scope.gameStarted = true
      $scope.shownext = false
      $scope.showNextQn = false
      $scope.clicked = 999
      $scope.correct = 999
      $scope.question_nos += 1
      $scope.message = ""
      $scope.firstAnswer = true
      $scope.question = $scope.question_data["question" + $scope.question_nos].question
      $scope.answers = $scope.question_data["question" + $scope.question_nos].answers
      $scope.quiz_params = $scope.question_data.quiz_params
      console.log($scope.stats)
      for(var key in $scope.stats) {
        console.log(key)
        if($scope.stats[key]) {
          $scope.stats[key].message = "Question " + $scope.question_nos + " of "  + $scope.quiz_params.nos_questions
        }
      }
      socket.emit("questions" , {question: $scope.question, answers: $scope.answers, quiz_params: $scope.quiz_params, message: ""});
      socket.emit("results" , $scope.stats)
      $scope.message = "Question " + $scope.question_nos + " of "  + $scope.quiz_params.nos_questions
    }

    $scope.sendResults = function() {
      $scope.showNextQn = true
      $scope.message = "Answers sent to clients - click to go to next question"
      socket.emit("results" , $scope.stats)
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
    }
  };
});