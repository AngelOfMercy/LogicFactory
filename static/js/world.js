

//----------------------------------------------------
//Global Variables
//----------------------------------------------------
var DEFAULT_X = 50, DEFAULT_Y = 50;
var bg_colour;
var library;

//Stage Objects Map
//TODO Change this into a single object.
var world_obj = [];
/**
 * type:
 * bonsai:
 * nameplate:
 * name:
 */
var stage_obj_types = [];
var stage_obj_map = [];
var stage_obj_nameplate = [];
var stage_obj_title = [];

var grid_lines = [[],[]];
var selected_object;
var expressionArray = [];
var gotExpr = false;
var timerRanOut = false;

var Colour = {
  red:4280549631,
  green:1355315455,
  blue:8388607,
  orange:4289003775,
  yellow:4294377727,
  purple:3664828159,
  brown:3430359807,
  black:255,
  white:4294967295
};



//----------------------------------------------------
//Messsage Handling
//----------------------------------------------------
stage.on('message', handleMessage);

/**
 * Populates the world initially.
 *Draws the Grid and Sets the background colour, based on library specifications. 
 */
function buildWorld(){
    if(library.grid_width != undefined && library.grid_height != undefined)
        drawGrid(library.grid_width, library.grid_height);
    if(!library.bg_colour){
	stage.setBackgroundColor(getColour(library.background));
    }
      
}

/**
 * Takes a message from outside process scope and handles it
 * @param {message} message to be handled
 * 
 */
function handleMessage(message) {
    console.log('message', message);
    if (message === 'getworldforeval'){
        stage.sendMessage('evalworld', getWorld());
    } 
    else if(message === 'clearworld'){
      console.log("TIME TO CLEAN UP");
      clearWorld();
      buildWorld();
    }
    else if(message === 'buildworld'){
      buildWorld();
    }
    else if(message === 'removeObj'){
	removeSelectedObject();
    }
    else if(message === 'cloneObj'){
	cloneSelectedObject();
    }
    else if(message === 'needWorldJSON'){
      var hackyFix = []; //For some reason we need to pass some kind of data in the message to make the handler receive it on the other side. This array doesnt matter, it will always be blank
      console.log("need world JSON clicked");
      stage.sendMessage('saveData', {
	library_name: library.library_name,
	world: getWorld()
      });
      console.log("Message Sent");
      
    }

}

stage.on('message:needWorldJSON', function(data){
   stage.sendMessage('getExpr');
   setTimeout(function(){
     timerRanOut = true;
   },5000);
   while(gotExpr == false){
     if(timerRanOut == true){
       throw "List of Expressions could not be found";
       return;
     }
   }
   timerRanOut = false;
   gotExpr = false;
   saveSend(data);
  
});


stage.on('message:saveClicked', function(data){
   hrefLink = data
   stage.sendMessage('');
  
});

stage.on('message:exprArray', function(data){
  console.log("World: Received Expr Array");
  expressionArray = data;
  gotExpr = true;
  saveSend(data);
});



/**
 * Handles the message to take a given world from a file.
 * @param {data}  The world information to generate from.
 */

stage.on('message:generateWorld', function(data){
  generateWorldFromFile(data);
});

/**
 * Sets the current library
 * @param {data} The library data to change the world to operate off.
 */
stage.on('message:setlibrary', function(data){
    setLibrary(data);
});

stage.on('message:setSelectedObjectTitle', function(data){
  console.log("Setting Title");
  if(!selected_object)
    return;
  var index = stage_obj_map.indexOf(selected_object);
  stage_obj_title[index] = data;
  updateTitles(selected_object);
});

function updateTitles(obj){
  
  var index = stage_obj_map.indexOf(obj);
  //Remove the existing nameplate
  
  
  var txt = new Text(stage_obj_title[index]);
  txt.attr({
    x:stage_obj_nameplate[index]._attributes.x,
    y:stage_obj_nameplate[index]._attributes.y,
    selectable:false
  });
  stage.addChild(txt);
  stage.removeChild(stage_obj_nameplate[index]);
  stage_obj_nameplate[index] = txt;
}

/**
 * Adds a specified object to the world
 * 
 */
stage.on('message:addobject', function(data){
  console.log("DATA MESSAGE", data);
  addObject(data.type, {x: data.x, y: data.y, width: data.width, height: data.height, def_col: data.colour, name:data.name});
});

/**
 * Changes the size of the selected object, if the data is +1, increase in size.
 * Otherwise it decreases in size.
 */
stage.on('message:changeSize', function(data){
  var scale = (data == 1) ? 1.4 : (1/1.4); 
  selected_object.animate(10, {
      radius: selected_object._attributes.radius*scale,
      width: selected_object._attributes.width*scale,
      height: selected_object._attributes.height*scale
  });
});

stage.on('message:addName', function(data){
  var index = stage_obj_map.indexOf(selected_object);
  if(index >= 0){
     stage_obj_nameplate = "data";
  }
});

//----------------------------------------------------
//Getters and Setters
//----------------------------------------------------
function getSelectedObject(){
  return selected_object;
}

function setLibrary(lib){
    library = lib;
}

/**
 * Gets the state of the world and expressions and sends it out as a message for anything that needs the data. This function is called on reception of needWorldJSON message
 * @param {bonsai_obj} Bonsai object to find coordinates for
 */
function saveSend(expressions){
  var tempWorld = getWorld();
  var tempExpressions = expressions;
  var JSONString = "{\"library_name\":\"" + library.library_name + "\",\n"//{"library_name":"Noughts and Crosses",;
  
  for(var i =0; i< tempWorld.length;i++){
    
    
    
  }
  
  stage.sendMessage("saveData",JSONString);
  
}

/**
 * Deals with creating the world object, and then returns it.
 */
function getWorld(){
    var world = [];
    var item;
    
    for(var i = 0; i < stage_obj_map.length; i++){
	world.push(getWorldObject(i));
	console.log("TESTESTET", stage_obj_nameplate);
	if(stage_obj_nameplate[i])
	  world[i].name = stage_obj_title[i];
    }
    console.log("World", world);
    return world;
}

function getWorldObject(i){    
      	var item = new Object();
      	item.x = stage_obj_map[i]._attributes.x;
      	item.y = stage_obj_map[i]._attributes.y;

	if(grid_lines[0].length > 0){
	    var obj = getGridCoord(stage_obj_map[i]);
	    item.x = obj.x;
	    item.y = obj.y;
	}
	else{
	    item.x = stage_obj_map[i]._attributes.x;
	    item.y = stage_obj_map[i]._attributes.y;
	}

      	item.colour = stage_obj_map[i]._attributes.fillColor;
      	item.type = stage_obj_types[i];
	item.size = stage_obj_map[i]._attributes.radius*2;
        if(!item.size){
          item.size = Math.max(stage_obj_map[i]._attributes.width, stage_obj_map[i]._attributes.height);
        }
        /**else if(!item.size){
	    item.size = stage_obj_map[i]._attribute.radius;
	}*/
        else if(item.width !== undefined && item.height !== undefined){
          item.height = stage_obj_map[i]._attributes.height;
          item.width = stage_obj_map[i]._attributes.width; 
        }
        return item;
}

function getColour(col){
	if (!col) return Colour['white'];
  	if(Colour[col.toString().toLowerCase()]){
		col = Colour[col.toString().toLowerCase()];
  	}
  	return col;
}

function getColours(){
    return colour;
}

//----------------------------------------------------
//World Handling
//----------------------------------------------------

function clearWorld(){
    stage_obj_map.forEach(function(entry){
	stage.removeChild(entry);
    });
    
    stage_obj_nameplate.forEach(function(entry){
	stage.removeChild(entry);
    });
    
    for(var i = 0; i < 2; i++){
      for(var j = 0; j < grid_lines[i].length; j++){
	stage.removeChild(grid_lines[i][j]);
      }
    }
    grid_lines = [[],[]];
    stage_obj_map = [];
    stage_obj_types = [];
    stage_obj_nameplate = [];
    stage_obj_title = [];
    console.log('cleared grid',grid_lines);
    
}

/**
 * Finds coordinates of object on grid, assuming grid exists.
 * @param {bonsai_obj} Bonsai object to find coordinates for
 */
function getGridCoord(bonsai_obj){
    var x, y;
    
    for(y = 0; y < grid_lines[0].length; y++){
	var temp = grid_lines[0][y]._segments[0][1];
	if(temp > bonsai_obj._attributes.y){
	  break;
	}
    }
    
    for(x = 0; x < grid_lines[1].length;x++){
	var temp = grid_lines[1][x]._segments[1][2];
	if(temp > bonsai_obj._attributes.x){
	  break;
	}
    }
    return {x: x, y: y};
}

//THIS METHOD NEEDS TO BE CALLED ON RECEPTION OF MESSAGE TO WORKER THREAD rather than directly from saveload.js in order to get scope of bonsai
//gets passed a tree structure from saveload - TODO: Make sure library is loaded before user uploads world - will want to add check from library name of world load to library name on server
function generateWorldFromFile(worldJSON){

  clearWorld();
  buildWorld();
  var worldObjects = [];
  var obj_list = []; //List of objects to draw to screen
  var ind_list = []; //List of indexes mapped to same position as obj_list
  //Make sure to Change background colour
  for(var i = 0; i< worldJSON.world.length; i++){
  worldObjects.push(worldJSON.world[i]);//populate each loaded object into buffer - Can be set as the main world buffer at the end of this function to keep concurrent with evaluator
  var obj = worldObjects[i];
  var lib_index = null;
  for(var index = 0; index < library.library.length;index++){
    if(library.library[index].type == obj.type){
    		var keys = Object.keys(library.library[index]).forEach(function(key){
	  	  if(Object.keys(obj).indexOf(key) >= 0 && obj[key] != undefined){
	 	   }
	 	   else
			obj[key] = library.library[index][key];
		});
      lib_index = index;
    }
  }
  if(lib_index == null){
    alert("Your loaded world has an object not supported in the current library");
    return false;
  }
  
  
  obj_list.push(obj);
  

ind_list.push(lib_index);
  //TODO: nullchecking for above vars
  
  
  
  }
  
  for(var i = 0; i<obj_list.length;i++){
    
  if(obj_list[i] != null && ind_list[i] != null){
 
  createBonsaiShape(obj_list[i]);
  }
  }
}  

//----------------------------------------------------
//Object Handling
//----------------------------------------------------

/**
 * Removes the selected object from the bonsai object list, and its entry from the type list.
 */
function removeSelectedObject(){
    if(!selected_object)
      return;
    var index = stage_obj_map.indexOf(selected_object);
    if(index == -1)
      return;
    stage_obj_map.splice(index, 1);
    stage_obj_types.splice(index, 1);
    var np = stage_obj_nameplate[index];
    stage_obj_nameplate.splice(index, 1);
    stage_obj_title.splice(index, 1);
    
    
    stage.removeChild(selected_object);
    stage.removeChild(np);
    selected_object = null;
}

/**
 * Copies the object and places the copy at its location.
 */
function cloneSelectedObject(){
  if(!selected_object)
    return;
  var index = stage_obj_map.indexOf(selected_object);
  
  var attributes = getWorldObject(index);
  
  attributes.height = stage_obj_map[index]._attributes.height;
  attributes.width = stage_obj_map[index]._attributes.width;
  
  
  
  attributes.x = stage_obj_map[index]._attributes.x + ((attributes.height) ? attributes.height/2 : 5);
  attributes.y = stage_obj_map[index]._attributes.y + ((attributes.width) ? attributes.width/2 : 5);
  
  attributes.def_col = attributes.colour;
  
  attributes.name = stage_obj_title[index];
  
  console.log("ATTRIBUTES:", attributes);
  addObject(stage_obj_types[index], attributes);
}

//Passing null for x->height will make it use the default values.
function addObject(obj_type, data){
    if(!data.name)
      data.name = "";
    console.log("DATA TEST:", data);
    var lib_obj = new Object();
    if(data.size)
      data.size = data.size/2;
    //Cloning the object from the library.
    console.log("DATA", data);
    for(var i = 0; i < library.library.length; i++){
	//If we find the correct object to create from.
      if(library.library[i].type == obj_type){
	var keys = Object.keys(library.library[i]).forEach(function(key){
	    console.log(key)
	    if(data && Object.keys(data).indexOf(key) >= 0 && data[key]){
		lib_obj[key] = data[key];
	    }
	    else
		lib_obj[key] = library.library[i][key];
	});
	console.log("KEYS", keys);

      }
    }
    
    console.log()
    
    if(lib_obj.poly <= 2 && data.size){
	lib_obj.radius = data.size;
    }
    if(!lib_obj.x && data.x)
      lib_obj.x = data.x;
    else
      lib_obj.x = DEFAULT_X;
    
    if(!lib_obj.y && data.y)
      lib_obj.y = data.y;
    else
      lib_obj.y = DEFAULT_Y;
    
    console.log("X AND Y", lib_obj);
    
    console.log(lib_obj);
    createBonsaiShape(lib_obj);
    
    //If the object had a value for its name.
    
    //if(data.name){
	//Create new nameplate.
	var txt = new Text(data.name);//data.name);
	//The bonsai object we just created is the last in the list.
	var bonsai = stage_obj_map[stage_obj_map.length-1];
	
	var displacement = bonsai._attributes.radius;
	//If the bonsai object does not have a radius.
	if(!displacement){
	  //Get half its height for the vertical displacement for the nameplate.
	  displacement = lib_obj.height;
	}
	//Add 5 units of displacement.
	displacement += 5;
	console.log("TESTING:", displacement);
	var x = lib_obj.x;
	var y = lib_obj.y-20;
	console.log(x, y);
	txt.attr({
	  x: x,
	  y: y,
	  selectable:false
	});
	
	console.log("width", txt);
	stage.addChild(txt);
	
	//Add it to the map.
	stage_obj_nameplate[stage_obj_map.indexOf(bonsai)] = txt;
	stage_obj_title[stage_obj_map.indexOf(bonsai)] = data.name;
	
   // }
}


/**
 * Figures out what type of bonsai object the structure will become
 * @param {obj} Object passed from json tree structure - contains an image path for this function to deal with ELSE it is a polygon/other defined shape
 */
function createBonsaiShape(obj){
  var bonsaiObj;
  
    
  if(obj.image_path == undefined)
      bonsaiObj = bonsaiPoly(obj);
  else
      bonsaiObj = bonsaiImage(obj);
      
  var x_offset = 0, y_offset = 0;
  //If it is an image or a square
  //Create an offset.
  //This is because thier coords are in the top left of the object, and not the centre.
  if(obj.image_path != undefined || obj.poly == 4){
      
      x_offset = obj.width/2;
      y_offset = obj.height/2;
      console.log('Creating Offset', x_offset, y_offset);
  }
      
  bonsaiObj.on('multi:pointerdown', function(e){
        x = this.attr('x'); 
        y = this.attr('y');
        this.addTo(this.parent); 
      })
      .on('multi:drag', function(e){
        this.attr({
          x: objMove(x, 1, e.diffX, this),
          y: objMove(y, 2, e.diffY, this)
        });
      })
      .on('multi:pointerup', function(e){
	this.attr({
	  x: gridSnap(x, 1, this, e.diffX, this._attributes.width/2),
	  y: gridSnap(y, 2, this, e.diffY, this._attributes.height/2)
	});
      })
      .on("pointerdown", function(e){
	//Dehighlight the previous selected object.
	if(selected_object != null && selected_object != undefined){
	  selected_object.attr('filters', new filter.Opacity(1));
	  //selected_object.stroke('#000',2);
	}
	selected_object = this;
	stage.sendMessage('objectSelected', stage_obj_title[stage_obj_map.indexOf(selected_object)]);
	this.attr('filters', new filter.Opacity(.5));
	//selected_object.stroke("#FFF", 2); 
    }); 
      
  stage_obj_types.push(obj.type);
  console.log(stage_obj_types);
  stage_obj_map.push(bonsaiObj);
     
}



/**
 * Deals with creating a bonsai object from an image
 * @param {obj} Object passed from json tree structure - contains an image path for this function to deal with
 */
function bonsaiImage(obj){
  console.log('exception', library, obj);
  
  var image =  new Bitmap(obj.image_path, function(err) {
    if (err){
      console.log(err);
      return;
    }
    this.attr({
      y: obj.y,
      x: obj.x,
      width: obj.width,
      height: obj.height
    });
      
    console.log(obj);
    stage.addChild(this);
  });
  
  //stage.addChild(this);
  
  return image;
}


/**
 * Deals with creating a bonsai object that is not from an image
 * @param {obj} Object passed from json tree structure - contains information pertinent to which shape it will draw
 */
function bonsaiPoly(obj){ //What does this method do?
  var sides = obj.poly;
  var myPoly;
  if(sides <= 2){
    //We assume that the circle has a radius, and do not account for the case where the lib specifies size instead.
    var radius = obj.radius;
    if(!radius && obj.size)
      radius = obj.size;
    myPoly = new Circle(obj.x, obj.y, radius);
  }else if(sides == 4){
    //We handle an edge case for rectangles, as the Polygon method would create a diamond shape.
    myPoly = new Rect(obj.x, obj.y, obj.width, obj.height);
  }else{
    //We make the inverse assumtion to the Circle.
    myPoly = new Polygon(obj.x,obj.y,obj.size,obj.poly);
  }
	  
  myPoly.addTo(stage);
  
  var colour = getColour(obj.def_col);
  console.log(colour);
  
  myPoly.fill(colour)
  .stroke('#000', 2);
  
  return myPoly;
}

//i = 1, for x.
//i = 2, for y.
function objMove(x, i, diff, obj){
  
  
  var new_co = x + diff;
  var name = stage_obj_nameplate[stage_obj_map.indexOf(obj)];
  var index = stage_obj_map.indexOf(obj);
  if(name){
      //console.log('?',name);
      var title = stage_obj_title[index];
      //console.log("TITLE & NAME", title, name);
      var txt = new Text(title);
      stage.removeChild(name);
      if(i == 1)
	txt.attr({
	  x:new_co,
	  y:obj._attributes.y-20,
	  selectable:false
	});
      else
	txt.attr({
	   x:obj._attributes.x,
	   y:new_co-20,
	  selectable:false
	});
      stage_obj_nameplate[stage_obj_map.indexOf(obj)] = txt;
      stage.addChild(txt);
  }
  
  return new_co;
}

function gridSnap(coord, i, obj, diff, offset){
  //If there is a grid
  if(grid_lines[i%2].length > 0){
      var grid_location = getGridCoord(obj);
      if(i == 1) 
	grid_location = grid_location.x;
      else
	grid_location = grid_location.y;
      
      //If it is outside the grid
      if(grid_location == 0 || grid_location == grid_lines[i%2].length){
	console.log('why am I here?');
      }
      else{
	//The Line before the object
	var first_line = grid_lines[i%2][grid_location-1]._segments[2-i][3-i];
	//Line after the object
	var second_line = grid_lines[i%2][grid_location]._segments[2-i][3-i];
	//Return the mid point of the two lines.
	return (first_line+second_line)/2 - offset;
      }
      
  }
  //If there is no grid, dont snap to grid.
  else{
    return coord + diff;
  }
}

function getValue(obj, key){ //What value is this referring to?
  var index = obj.field_key.indexOf(key);
  if(index < 0)
    return null;
  return obj.field_vals[index];
}

/**
 * Draws grid on the screen - this function is called on load if a grid is defined in a library or saved world.
 */
function drawGrid(x, y){ 
  var cell_width = stage.width/x;
  var cell_height = stage.height/y;

  //vertical
 for(var i=0; i<=y;i++){
   grid_lines[0][i] = new Path()
   .moveTo(i*cell_height,0)
   .lineTo(i*cell_height,stage.height)//Height
   .stroke('#000', 1)
   .addTo(stage);   
 }
 //horizontal 
   for(var i=0; i <= x;i++){
   grid_lines[1][i] = new Path()
   .moveTo(0,i*cell_width)
   .lineTo(stage.width,i*cell_width)//width
   .stroke('#000', 1)
   .addTo(stage);   
 }
  
}