'use strict';

var app = angular.module('quizApp', ['ngRoute']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/'});
}]);

app.controller('CreateQuizController', function($scope, $http) {
    $scope.keys = ""
    $scope.example_data = ""

    $scope.getSampleData = function (collection) {
      $scope.keys = ""
      $scope.example_data = ""
      $http.get("create_quiz/" + collection).success(function(data) {
         $scope.keys = data.keys
         $scope.example_data = data.example_data
       });
    }

    $scope.createQuiz = function() {
      $http.post("create_quiz", $scope.new_quiz).success(function(data) {
        console.log("success")
        $scope.message = "Quiz created"
      });
    }
    
})
