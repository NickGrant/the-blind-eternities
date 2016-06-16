/*
 * Generate Data for Application
 */

/** DEPENDENCIES **/
var fs = require("fs"),
    request = require('request'),
    async = require('async');

/** HELPER FUNCTIONS **/
var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

/** THE GUTS **/

var cards = [],
    raw_cards = [],
    lists = [
        'http://mtgjson.com/json/HOP.json',
        'http://mtgjson.com/json/PC2.json'
    ],
    cur_list = 0;

async.eachSeries(lists,function(url, callback){
    console.log('getting '+url);
    request.get(url,function(err, resp, body){
        if(!err && resp.statusCode == 200 && body){
            var json = JSON.parse(body);
            async.each(json.cards,function(card, callback){
                if(card.type.indexOf('Plane') != -1 || card.type.indexOf('Phenomenon') != -1){
                    raw_cards.push(card);
                }
                callback();
            },function(err){
                if(err){
                    throw err;
                }
                console.log('retrieved '+ url);
            });
        }
        callback();
    });
},function(err){
    if(err){
        throw err;
    }
    /** PARSE RAW CARDS **/
    async.each(raw_cards,function(card, callback){
        var c = {
            name: card.name ? card.name : null,
            multiverseid: card.multiverseid ? card.multiverseid : null,
            type: card.type ? card.type : null,
            text: card.text ? card.text : null,
            img: card.multiverseid ? 'card_'+card.multiverseid+'.jpg' : null
        }
        if(card.subtypes){
            c.subtypes = card.subtypes;
        }
        //pull image if not exists
        fs.exists('app/data/img/'+c.img,function(res){
            if(!res){
                if(c.multiverseid){
                    download("http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid="+c.multiverseid+"&type=card",'app/data/img/'+c.img,function(){
                        console.log('downloaded '+c.img);
                    });    
                }
            }
        });
        cards.push(c);
        callback();
    },function(err){
        if(err){
            throw err;
        }
        fs.writeFile('app/data/cards.json',JSON.stringify(cards), function(err){
            if(err){
                throw err;
            }else{
                console.log('Finished');
            }
        });
    });
});