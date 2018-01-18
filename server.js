//Express
var debug=false;
var express = require('express');
var app = express();
var https = require('https');
var request = require("request");

var http = require('http').createServer(app);
var port = process.env.PORT || 7246;
var server = app.listen(port);
var fs = require('fs');
//ejs
var git = require('simple-git');
var dayStart=new Date(2018,00,07,0,0)// for some reason months start in 0 but year or day don't
//var dayStart=new Date(2017,11,17)// for some reason months start in 0 but year or day don't
var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
// the problem is that the .getTime() returns ms from 1971
//var today = new Date(new Date()-msOffset);
var today = new Date();
var daysPassed = Math.floor(Math.abs((today.getTime()-dayStart.getTime())/(oneDay)));
//Since the .toISOString returns the right format but GMT zone we need to substract 11
var msOffset=11*60*60*1000;
var gitToday=new Date(new Date()-msOffset);
var githubDate=gitToday.toISOString().substring(0, 10);
//var githubDate=today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate();
// var githubDate=today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getUTCDate();
var commitsToday = JSON.parse(fs.readFileSync('values.json', 'utf8'))[daysPassed];
var commitsDone=0;
var commitLimit=5;
var todayContributions=0;

if(debug){
    console.log("DEBUG TRUE");
    console.log("today is: "+today);
    console.log("time is: "+gitToday.toISOString().substring(11,23));
    console.log("github date is: "+githubDate);
    console.log("Days passed: "+daysPassed);
    console.log("Commits Scheduled: "+commitsToday);
}

//console.log(today)

checkContributions();
//updateFile();

function updateFile(){
  //save a file with a random string, this to make sure the file is always changing and git will take it
  var text = "";
  var possible = "ABCDEF0123456789";
  for (var i = 0; i < 30; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  fs.writeFile("ID.md", "Today Secret Id: "+text, function(err) {
    if(err) {
        return console.log(err);
    }
    git().add(['ID.md'],function(){
      git().commit("Changed Code "+ githubDate, function(){
          git().push(['origin', 'master'],delayCommits);
      })
    });
    // console.log("The file was saved!");
  });
}

function checkContributions(){
  request("http://www.github.com/sebmorales", function(error, response, body) {
    //make a http request to my git. And parse the response though a regex to get today's data
    var rePattern = new RegExp('data-count=\"\\d\" data-date=\"'+githubDate);
    var arrMatches = body.match(rePattern);
      if(debug){
	  console.log("scrape from Github: "+arrMatches);
      }
    todayContributions=(arrMatches[0].split(" "))[0].split('\"')[1];
    console.log( "Github has "+ todayContributions+" today.")
    if(!debug && todayContributions<commitsToday){
      updateFile();
      // console.log("Today needs "+commitsToday+" contributions");
      // console.log("So far we have "+todayContributions);
      // console.log("Still need "+(commitsToday-todayContributions))

    }
    else{
      console.log("Today needs "+commitsToday+" contributions");
      console.log("So far we have "+todayContributions);
      console.log("Still need "+(commitsToday-todayContributions))
      server.close();
    }
  });
}

function delayCommits(){
  if(!debug && commitsDone<commitLimit){
    commitsDone++;
    setTimeout(function(){ checkContributions()}, 3000);
  }
  else{
    console.log("Today needs "+commitsToday+" contributions");
    console.log("So far we have "+todayContributions);
    console.log("Still need "+(commitsToday-todayContributions))
    server.close();
  }

}
