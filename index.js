var fs = require('fs'),
    express = require('express');
    server = express();
    port = 8080;

//setup express static server
server.use(express.static(__dirname + '/app'));

//check if json file exists, if not log to console instead of starting server
fs.exists('app/data/cards.json',function(res){
    if(res){
        //start server
        server.listen(port, function(){
            console.log("Server listening on: http://localhost:%s", port);
        });
    }else{
        console.log('No cards.json in /app/data. Please run "npm run generate" from the root directory');
    }
});