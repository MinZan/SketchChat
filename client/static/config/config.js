var app = angular.module('app', ['ngRoute', 'ngAnimate']);

app.config(function($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'partials/lobby.html'
    })
    .when('/:id', {
        templateUrl: 'partials/draw.html'
    })
    .otherwise({
        redirectTo: '/'
    })
})
