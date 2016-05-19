function init(){
    var renderer = new PIXI.autoDetectRenderer(800, 600);
    console.log(document.getElementById('map'));
    document.getElementById('map').appendChild(renderer.view);
    // You need to create a root container that will hold the scene you want to draw.
    var stage = new PIXI.Container();

    var loader = PIXI.loader;
    var loading_screen = true;
    loader.add('cards','../data/cards.json').load(function (loader, resources){
        if(!resources.cards.error){
            var cards = resources.cards.data;
            //loop through and load in images
            async.each(cards,function(card, callback){
                loader.add('card-'+card.multiverseid,'../data/img/'+card.img);
                callback();
            },function(){
                loader.load(function(loader, resources){
                    //create objects out of cards + images
                    console.log(loader.resources);
                    loading_screen = false;
                    //create deck and deal

                });
            })
        }else{
            error('Could not load cards');
            //write error message
        }
    });
    animate();

    function animate() {
        if(loading_screen){
            
        }
        // start the timer for the next animation loop
        requestAnimationFrame(animate);

        // this is the main render call that makes pixi draw your container and its children.
        renderer.render(stage);
    }
    
    function error(message){
        
    }
}
