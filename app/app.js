"use strict";
var chromeStorage = chrome.storage.local
angular.module('MainApp', []).controller('MainController', function ($scope) {
    $scope.urls = ["facebook", "google"]
    
    $scope.doTheDance = function(){
        doTheDance($scope.urls) 
    }
    
    
    chromeStorage.get('urls', function (data) {
        if (data.urls) {
            $scope.urls = data.urls
        }
        $scope.$apply()
        doTheDance($scope.urls) 
    })
    
    var updateUrlsToStorage = function () {
        chromeStorage.set({
            urls: $scope.urls
        })
    }
    $scope.addUrl = function () {
        //do some more error/string handling here
        if ($scope.urls.indexOf($scope.url) == -1) {
            $scope.urls.push($scope.url)
            updateUrlsToStorage()
        }
        else {
            alert("no duplicate strings please")
        }
        $scope.url = undefined
    }
    $scope.removeUrl = function (url) {
        $scope.urls.splice($scope.urls.indexOf(url), 1);
        updateUrlsToStorage()
    }
});