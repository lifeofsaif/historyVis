"use strict";
let chromeStorage = chrome.storage.local
angular.module('MainApp', []).controller('MainController', function ($scope) {
    $scope.urls = ["facebook", "google"]
    
    
    $scope.doTheDance = function(){
        $(".loader").css("display", "")
        $(".charts").css("display", "none")
        $("#loadButton").css("display", "none")    
        doTheDance($scope.urls) 
    }
    
    
    
    chromeStorage.get('urls', function (data) {
        if (data.urls) {
            $scope.urls = data.urls
            $("#loadButton").css("display", "none")
            doTheDance(data.urls)
        }
        $scope.$apply() 
        
    })
    
    
    
    var updateUrlsToStorage = function () {
        chrome.storage.local.set({
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