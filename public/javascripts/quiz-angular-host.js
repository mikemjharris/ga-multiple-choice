'use strict';

var app = angular.module('quizHostApp', ['ngRoute']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/'});
}]);


app.controller('MultiQuizController', function($scope, $http, socket) {
    $scope.question = ""
    $scope.question_nos = 0
    $scope.answers = []
    $scope.quiz_params = ""
    $scope.shownext = false
    $scope.score = {}  
    $scope.quiz_id = $('#quiz_id').html()
    $scope.players = []
    $scope.message = {}
    $scope.stats = {}
    $scope.firstAnswer = true


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
            $scope.stats[data.id].score  = ($scope.stats[data.id].score + 1) 
            $scope.stats[data.id].message = "You were correct and the fastest!"
           } else {
            $scope.stats[data.id] = $scope.stats[data.id] || {score: 0 , message: "" }
            $scope.stats[data.id].message = "You got the right answer but weren't quick enough"
           }
        } else {
            $scope.stats[data.id].message = "You got the answer wrong"
        }
        console.log(data.answer)
        console.log(data)
        $scope.stats[data.id].answer = $scope.question_data["question" + $scope.question_nos].answer
    });

    socket.on("players", function(data) {
      $scope.players = data[""]

    })
    
    $scope.sendMessage = function () {
      console.log("hi")
      socket.emit('message', "test");
      // socket.emit.to("abc123").emit('message', test);
    }
    $scope.getNextQuestion = function() {
      $scope.shownext = false
      $scope.clicked = 999
      $scope.correct = 999
      $scope.question_nos += 1
      $scope.message = ""
      $scope.firstAnswer = true

      
      $scope.question = $scope.question_data["question" + $scope.question_nos].question
      $scope.answers = $scope.question_data["question" + $scope.question_nos].answers
      $scope.quiz_params = $scope.question_data.quiz_params
      socket.emit("questions" , {question: $scope.question, answers: $scope.answers, quiz_params: $scope.quiz_params, message: ""});
    }

    $scope.sendResults = function() {
      socket.emit("results" , $scope.stats)

    }

    // $scope.getNextQuestion()

    $scope.submitAnswer = function(index_item) {
      $scope.clicked = index_item
      $http.get("/quiz/" + $scope.quiz_id + "/question/" + $scope.question_nos + "/answer/" + index_item).success(function(data){
          $scope.message = data.message
          $scope.correct = $scope.answers.indexOf(data.answer)
          console.log(data.answer)
          console.log($scope.correct)
          if($scope.message == "correct") {
            $scope.score += 1
          }
          
          $scope.shownext = true
      })
      console.log(index_item)
    }


    $scope.createQuiz = function() {
      $http.post("create_quiz", $scope.new_quiz).success(function(data) {
        console.log("success")
      });
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