Card = function(name, image){
    this.setName(name);
    this.setImage(image);
}

Card.prototype.getName = function(){
    return this._name;
}

Card.prototype.setName = function( name ){
    this._name = name;
}

Card.prototype.getImage = function(){
    return this._image;
}

Card.prototype.setImage = function( image ){
    this._image = image;
}