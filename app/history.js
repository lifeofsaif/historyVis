var DataFrame = dfjs.DataFrame
let now = new Date()
const lastWeek = new Date(now.getTime() - (60 * 60 * 24 * 7 * 1000));
const lastThirtyOneDays = new Date(now.getTime() - (60 * 60 * 24 * 31 * 1000));
const lastHour = new Date(now.getTime() - (1000 * 60 * 60))
const lastEightHours = new Date(now.getTime() - (1000 * 60 * 60 * 8))
const lastDay = new Date(now.getTime() - (1000 * 60 * 60 * 24))

function formatWeekArray(df) {
    df = df.where(function (row) {
        return row.get('visitTime') > lastWeek
    })
    df = df.groupBy('dayOfWeek').aggregate(group => group.count()).rename('aggregation', 'groupCount')
    let arr = []
    for (let i = 1; i <= 7; i++) {
        let saif = ((new Date(lastWeek.getTime() + (1000 * 60 * 60 * 24) * i)).getDay())
        let row = df.find({
            'dayOfWeek': saif
        })
        if (row === undefined) {
            arr.push([saif, 0])
        } else {
            arr.push([saif, row.get('groupCount')])
        }
    }
    return arr;
}

function formatMonthArray(df) {
    df = df.where(function (row) {
        return row.get('visitTime') > lastThirtyOneDays
    })
    df = df.groupBy('dayOfMonth').aggregate(group => group.count()).rename('aggregation', 'groupCount')
    let arr = []
    for (let i = 1; i <= 31; i++) {
        let saif = ((new Date(lastThirtyOneDays.getTime() + (1000 * 60 * 60 * 24) * i)).getDate())
        let row = df.find({
            'dayOfMonth': saif
        })
        if (row === undefined) {
            arr.push([saif, 0])
        } else {
            arr.push([saif, row.get('groupCount')])
        }
    }
    return arr
}

function formatDayArray(df) {
    df = df.where(function (row) {
        return row.get('visitTime') > lastDay
    })
    df = df.groupBy('hours').aggregate(group => group.count()).rename('aggregation', 'groupCount')
    let arr = []
    for (let i = 1; i <= 24; i++) {
        let saif = ((new Date(lastDay.getTime() + (1000 * 60 * 60) * i)).getHours())
        let row = df.find({
            'hours': saif
        })
        if (row === undefined) {
            arr.push([saif, 0])
        } else {
            arr.push([saif, row.get('groupCount')])
        }
    }
    return arr
}

//TODO 
function formatHourArray(df) {
    df = df.where(function (row) {
        return row.get('visitTime') > lastHour
    })
    /*
    
        for(let i = 1; i < 32; i++){
    
            
        }
    
        */
    return []
}

function formatArrays(df) {
    let week = formatWeekArray(df)
    let eightHour = formatHourArray(df)
    let month = formatMonthArray(df)
    let day = formatDayArray(df)
    return {
        week: week,
        month: month,
        day: day
    }
}

function timeFormatDataFrame(df) {
    df = df.restructure(['visitTime']).withColumn('date', function (row) {
        return (new Date(row.get('visitTime')))
    }).withColumn('month', function (row) {
        return (new Date(row.get('visitTime'))).getMonth()
    }).withColumn('dayOfWeek', function (row) {
        return (new Date(row.get('visitTime'))).getDay()
    }).withColumn('dayOfMonth', function (row) {
        return (new Date(row.get('visitTime'))).getDate()
    }).withColumn('hours', function (row) {
        return (new Date(row.get('visitTime'))).getHours()
    }).withColumn('minutes', function (row) {
        return (new Date(row.get('visitTime'))).getMinutes()
    }).restructure(['visitTime', 'month', 'dayOfMonth', 'dayOfWeek', 'hours', 'minutes'])
    return df;
}

/* 
THIS RIGHT HERE IS THE HEAD HONCHO BIG MACHINE IF YOU GOTTA FIX PERFORMANCE
IT IS VERY LIKELY TO BE IN HERE
*/ 
function getTheDataframe(name) {
    let mainDfPromise = Q.defer()

    function searchHistory() {
        let deferred = Q.defer()
        chrome.history.search({
            text: name
        }, function (searchResults) {
            console.log(searchResults.length)
            if(searchResults.length === 0){
                mainDfPromise.resolve(null)
            }else{
                deferred.resolve(searchResults)    
            }
        })
        return deferred.promise;
    }
    searchHistory().then(function (searchResults) {
        function urlVisits() {
            let saif = []
            let deferred = Q.defer()

            searchResults.forEach(function (searchResult) {
                chrome.history.getVisits({
                    url: searchResult.url
                }, function (visitResults) {
                    saif.push(visitResults)
                    if (saif.length === searchResults.length) {
                        deferred.resolve(saif)
                    }
                })
            })
            return deferred.promise
        }
        return urlVisits()
    }).then(function (urlVisits) {
        let deferred = Q.defer()
        let df
        //    FLAG
        //    Async code in forEach without promise handling may cause problems later ......
        urlVisits.forEach(function (urlVisit) {
            if (df === undefined) {
                df = new DataFrame(urlVisit, Object.keys(urlVisit[0]))
            } else {
                df = df.union(new DataFrame(urlVisit, Object.keys(urlVisit[0])))
            }
        })
        deferred.resolve(df)
        return deferred.promise
    }).then(function (df) {
        mainDfPromise.resolve({
            df: df,
            name: name
        })
    })
    return mainDfPromise.promise
}

function getAllTheDataframes(queries) {
    let unfound = 0
    let deferred = Q.defer();
    let dataframes = []
    for (let i = 0; i < queries.length; i++) {
        getTheDataframe(queries[i]).then(function (data) {
            
            if(data==null){
                console.log("nothing was found for your search: " + queries[i])
                unfound++
            }else{
                let arrays = formatArrays(timeFormatDataFrame(data.df))
                arrays.name = data.name
                dataframes.push(arrays)
            }
            
            if (dataframes.length === queries.length - unfound) {
                deferred.resolve(dataframes)
            }
        })
    }
    return deferred.promise
}

function doTheDance(arr) {
    getAllTheDataframes(arr).then(function (dataframes) {
        visualizeThatShit(dataframes)
    })
}
//////////////////
//////////////////
//////////////////
//////////////////
let colors = [
            'rgb(244, 61, 61)'
          , 'rgb(244, 131, 61)'
          , 'rgb(244, 222, 61)'
          , 'rgb(76, 244, 61)'
          , 'rgb(61, 244, 167)'
          , 'rgb(61, 219, 244)'
          , 'rgb(61, 140, 244)'
          , 'rgb(152, 61, 244)'
          , 'rgb(228, 61, 244)'
         ]
colors.sort(function (a, b) {
    return 0.5 - Math.random()
});

function visualizeThatShit(dataframes) {    
    let monthConfig = visualizeMonths(dataframes)
    let weekConfig = visualizeWeek(dataframes)
    let dayConfig = visualizeDay(dataframes)
    
}

function visualizeMonths(dataframes) {
    let datasets = []
    let x = getArrayOfLast31Days()
    dataframes.forEach(function (arrays, index) {
        let month = arrays.month
        let y = []
        month.forEach(function (day) {
            y.push(day[1])
        })
        datasets.push({
            label: arrays.name,
            backgroundColor: colors[index],
            borderColor: colors[index],
            data: y,
            fill: false
        })
    })
    let config = getConfigDefault()
    config.data = {
        labels: x,
        datasets: datasets
    }
    config.options.title.text = 'Last 31 Days'
    let ctx = document.getElementById("canvas").getContext("2d");
    window.myLine = new Chart(ctx, config);
    return config

}
function visualizeWeek(dataframes) {
    let datasets = []
    let x = getArrayOfLast7Days()
    dataframes.forEach(function (arrays, index) {
        let week = arrays.week
        let y = []
        week.forEach(function (day) {
            y.push(day[1])
        })
        datasets.push({
            label: arrays.name,
            backgroundColor: colors[index],
            borderColor: colors[index],
            data: y,
            fill: false
        })
    })
    let config = getConfigDefault()
    config.data = {
        labels: x,
        datasets: datasets
    }
    config.options.title.text = 'Last 7 Days'
    let ctx = document.getElementById("canvas2").getContext("2d");
    window.myLine = new Chart(ctx, config);
    return config
}
function visualizeDay(dataframes) {
    let datasets = []
    let x = getArrayOfLast24Hours()

    dataframes.forEach(function (arrays, index) {
        let day = arrays.day
        let y = []
        day.forEach(function (day) {
            y.push(day[1])
        })
        datasets.push({
            label: arrays.name,
            backgroundColor: colors[index],
            borderColor: colors[index],
            data: y,
            fill: false
        })
    })
    let config = getConfigDefault()
    config.data = {
        labels: x,
        datasets: datasets
    }
    config.options.title.text = 'Last 24 Hours'
    let ctx = document.getElementById("canvas3").getContext("2d");
    window.myLine = new Chart(ctx, config);
    return config
}

function getArrayOfLast31Days() {
    let x = []
    for (let i = 1; i <= 31; i++) {
        x.push((new Date(lastThirtyOneDays.getTime() + (1000 * 60 * 60 * 24) * i)).getDate())
    }
    return x
}
function getArrayOfLast7Days() {
    let x = []
    for (let i = 1; i <= 7; i++) {
        x.push((new Date(lastWeek.getTime() + (1000 * 60 * 60 * 24) * i)).getDate())
    }
    return x
}
function getArrayOfLast24Hours() {
    let x = []
    for (let i = 1; i <= 24; i++) {
        x.push((new Date(lastWeek.getHours() + (1000 * 60 * 60) * i)).getHours())
    }
    return x
}

function getConfigDefault() {
    return {
        type: 'line',
        options: {
            responsive: true,
            title: {
                display: true
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: false,
                        labelString: 'Month'
                    }
                    }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                    }]
            }
        }
    };
}
