'use strict';

function detectStateChange(tile){
  if(tile && tile.name != "player" && tile.sprite){
    switch(tile.state){
      case 0:
        tile.sprite.tint = 0x000000;
      break;
      case 1:
        tile.sprite.tint = 0x5e5e5e;
      break;
      case 2:
        tile.sprite.tint = 0xFFFFFF;
      break;
    }
  }
}

function updateUI(player, target){

  // update player HP
  if(target.name == "player"){
    var hp = $("#health");
    var hp_c = $("#health_container");
    $("#current-hp").text(target.health);
    hp.width(target.health*hp_c.width()/target.maxHealth);
  }else {
    // update player MP
    var mp = $("#magic");
    var mp_c = $("#magic_container");
    $("#current-mp").text(player.magic);
    mp.width(player.magic*mp_c.width()/player.maxMagic);

    // update enemy HP
    var hp = $("#en-health");
    var hp_c = $("#en-health_container");
    $("#en-current-hp").text(target.health);
    hp.width(target.health*hp_c.width()/target.maxHealth);
  }
}

function updateLog(message){
  $(".log-container").append($("<p/>",{
    text: message,
    class: "log-message"
  }));
  if($(".log-container").children().length > 5){
    $(".log-container p").first().remove();
  }
}

function updateInvInfo(){
  let inv = $(".inventory");
  inv.empty();
  for(let i = 0; i < player.inventory.length; i++){
    inv.append($("<span/>",{
      class: "slot",
      style: "background: url('"+player.inventory[i].icon+"'); background-size: cover"
    }).data("num", i));
  }
}

function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };

    this.clear = function(){
      window.clearTimeout(timerId);
      remaining = 0;
    }

    this.resume();
}

function destroyProp(destructor){
  if(destructor.name == "enemy"){
    console.log(destructor.fov);
  }
  for(let j = 0; j < destructor.fov.length; j++){
    if(destructor.fov[j].name == "destructible" && destructor.fov[j].x == destructor.x && destructor.fov[j].y == destructor.y){

      destructor.fov[j].sprite.loadTexture("destr_wood"+getRandomInt(1,3) ,0);
      destructor.fov[j].name = "floor";
      // let destr_dummy = new Tile(destructor.fov[j].x/destructor.fov[j].tile_size.w, destructor.fov[j].y/destructor.fov[j].tile_size.h, "destr_wood"+getRandomInt(1,3), "collision");

      destruct_wood = stage.add.emitter(0, 0, 20);
      destruct_wood.makeParticles('t_destr');
      destruct_wood.gravity = 150;

      // position the hit particles on destructible object
      destruct_wood.x = destructor.fov[j].x + destructor.fov[j].tile_size.w/2;
      destruct_wood.y = destructor.fov[j].y + destructor.fov[j].tile_size.h/2;
      // start to draw destruction particles
      destruct_wood.start(true, 250, null, 20);

      let destr = stage.add.audio("destr"+getRandomInt(1,3));
      destr.play();
    }
  }
}

function doStep(path){
  let i = 1;

  player.disableControl = false;
  // clearInterval(player.moveTimer);
  // player.moveTimer = setInterval(function(){

  player.moveTimer = new Timer(function(){
    player.moveTimer.resume();
    if(!gameIsPaused){
      if($(".warning").is(":visible"))
        $(".warning").hide();

      // move player to the next path section
      if(path){
        if($(".wait").not(":visible"))
          $(".wait").show();

        for(let j = 0; j < doors.length; j++){
          if(player.x == doors[j].x && player.y == doors[j].y){
            doors[j].name = "door_closed";
            doors[j].sprite.loadTexture("door_c");
            doorclosed.play();
            // break;
          }
        }

        player.sprite.x = path[i][0] * player.tile_size.w;
        player.sprite.y = path[i][1] * player.tile_size.h;
        player.x = player.sprite.x;
        player.y = player.sprite.y;

        destroyProp(player);

        for(let j = 0; j < doors.length; j++){
          if(player.x == doors[j].x && player.y == doors[j].y){
            doors[j].name = "door_opened";
            doors[j].sprite.loadTexture("door_o");
            dooropened.play();
            // break;
          }
        }

        for(let j = 0; j < lootArr.length; j++){
          if(player.x == lootArr[j].x && player.y == lootArr[j].y){
            if($(".on-loot").not(":visible")){
              $(".on-loot").css("display", "block");
              break;
              }
            }else if($(".on-loot").is(":visible")){
                $(".on-loot").hide();
            }
        }

      }

      player.setVisible();
      player.doFOV();
      // player.removePathAfter(i);
      player.centerCamera();
      player.moved = true;



      for(let j = 0; j < enemies.length; j++){
        if(j == 0){
          en_priority = [];
        }
        let enemy = enemies[j];
        enemy.counter = 1;
        enemy.doFOV();
        enemy.detectPlayer();
        enemy.moved = false;

        if(enemy.targetFound){

          en_priority.push(enemy);
          if($(".enemy-list img").length > 0)
            $(".enemy-list").empty();

          for(let z in en_priority){
            if(en_priority[z].portrait){
              $(".enemy-list").append($("<img/>",{
                src: en_priority[z].portrait,
                class: "enemy-list-ico",
                id: "en-l-"+z
              }));
            $("#en-l-"+z).after("<div class='portrait-hp' style='width:"+en_priority[z].health*$("#en-l-"+z).width()/en_priority[z].maxHealth+"px'><div/>");
            }
          }

          if($(".warning").not(":visible"))
            $(".warning").css("display", "block");
          if($(".wait").is(":visible"))
              $(".wait").hide();

          // clearInterval(player.moveTimer);
          player.moveTimer.clear();

          player.disableControl = false;

          if(enemy.activeWeapon.type == "melee"){
            let epath = enemy.moveToPoint(player.x, player.y);

            if(epath && enemy.counter < epath.length - 1){
              grid.setWalkableAt(enemy.x/enemy.tile_size.w, enemy.y/enemy.tile_size.h, true);

              enemy.sprite.x = epath[enemy.counter][0] * enemy.tile_size.w;
              enemy.sprite.y = epath[enemy.counter][1] * enemy.tile_size.h;
              enemy.x = enemy.sprite.x;
              enemy.y = enemy.sprite.y;

              destroyProp(enemy);

              enemy.moved = true;

              grid.setWalkableAt(enemy.x/enemy.tile_size.w, enemy.y/enemy.tile_size.h, false);
              enemy.counter++;
            }
          }
          if(!enemy.moved){
            // console.log(enemies.length);
            setTimeout(function(){
              enemy.hitTarget(player);
            }, 200); //def: 200
          }
        }
      }

      player.setVisible();
      player.doFOV();

      if(path && i == path.length - 1 || !path){
        player.disableControl = false;
        if($(".wait").is(":visible"))
          $(".wait").hide();
        // clearInterval(player.moveTimer);
        player.moveTimer.clear();
      }

      i++;
      updateMiniMap();

    }
  }, player.moveDelay);
}

function countStep(){
  step_count++;
}

function unique(arr) {
  var result = [];

  nextInput:
    for (var i = 0; i < arr.length; i++) {
      var str = arr[i]; // для каждого элемента
      for (var j = 0; j < result.length; j++) { // ищем, был ли он уже?
        if (result[j] == str) continue nextInput; // если да, то следующий
      }
      result.push(str);
    }

  return result;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPos(){
  let rand_pos;
  while(rand_pos === undefined){
    let point = all_sprites[getRandomInt(0, all_sprites.length-1)];
    if(point && point.name && point.name == "floor" && point.name != "door_closed" && point.name != "door_opened" && point.x != player.x && point.y != player.y){
      rand_pos = point;
    }
  }
  return rand_pos;
}

function updateMiniMap(){
  let scale = c.canvas.width/Dungeon.map_size;
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  for(let i = 0; i < all_sprites.length; i++){
    if(all_sprites[i].name && all_sprites[i].state != 0){
      if(all_sprites[i].name && all_sprites[i].name == "floor" && all_sprites[i].state == 2){
        c.fillStyle = "#fff";
        c.fillRect((all_sprites[i].x/32)*scale, (all_sprites[i].y/32)*scale, 32/scale, 32/scale);
      }
      if(all_sprites[i].name && all_sprites[i].name == "floor" && all_sprites[i].state == 1){
        c.fillStyle = "#333";
        c.fillRect((all_sprites[i].x/32)*scale, (all_sprites[i].y/32)*scale, 32/scale, 32/scale);
      }
      if(all_sprites[i].name == "door_closed" || all_sprites[i].name == "door_opened"){
        c.fillStyle = "#893a02";
        c.fillRect((all_sprites[i].x/32)*scale, (all_sprites[i].y/32)*scale, 32/scale, 32/scale);
      }
      c.fillStyle = "#2b8e1d";
      c.fillRect((player.x/32)*scale, (player.y/32)*scale, 32/scale, 32/scale);
    }
  }
}

Dungeon = {
  display: null,
  map_size: 40,
  map: {},

  init: function() {
    this._generateMap();
  },

  _generateMap: function() {
    var digger = new ROT.Map.Digger(this.map_size, this.map_size);
    var freeCells = [];

    var digCallback = function(x, y, value) {
      if (value) {
        var key = x+","+y;
        this.map[key] = 0;
        return;
      }

      var key = x+","+y;
      this.map[key] = 1;
      freeCells.push(key);
    }

    digger.create(digCallback.bind(this));

    this._generateBoxes(freeCells);

    this._drawWholeMap();

    var drawDoor = function(x, y) {
      let door = new Tile(x, y, 2, 'door_c', 'door_closed');
      doors.push(door);
      // door.addToStage();
      collision_map.push(door);
    }

    var rooms = digger.getRooms();
    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        room.getDoors(drawDoor);
    }

  },

  _generateBoxes: function(freeCells) {
    // for (var i = 0; i < 31; i++) {
      var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      var key = freeCells.splice(index, 1)[0];
      this.map[key] = "*";
    // }

  },
  _drawWholeMap: function() {
    for (let key in this.map) {
      let parts = key.split(",");
      let x = parseInt(parts[0]);
      let y = parseInt(parts[1]);

      // this.display.draw(x, y, this.map[key]);
      if(this.map[key] == 1 || this.map[key] == "*"){
        let chance = getRandomInt(1,100);
        let floor;
        if(chance <= 80){
          floor = new Tile(x, y, 2, 't_floor', "floor");
        }else{
          floor = new Tile(x, y, 2, 't_floor2', "floor");
        }
        sprite_map.push(floor);

        // let barrel;
        // if(this.map[key] == "brl"){
        //   barrel = new Tile(x, y, 2, 'barrel_wood', "floor");
        //   sprite_map.push(barrel);
        // }
        // floor.addToStage();
      }else{
        let chance = getRandomInt(1,100);
        let wall_01;
        if(chance <= 80){
          wall_01 = new Tile(x, y, 2, 't_wall', "collision");
        }else{
          wall_01 = new Tile(x, y, 2, 't_wall2', "collision");
        }
        collision_map.push(wall_01);
        wall_01.sprite.inputEnabled = false;
        // wall_01.addToStage();
        grid.setWalkableAt(x, y, false);
      }
      if(this.map[x+","+y] == 1 &&
         this.map[(x-1)+","+y] == 0 &&
         this.map[x+","+(y-1)] == 0 &&
         this.map[(x+1)+","+y] == 1 &&
         this.map[x+","+(y+1)] == 1 &&
         this.map[(x-1)+","+(y-1)] == 0 &&
         this.map[(x+1)+","+(y+1)] == 1 ||

         this.map[x+","+y] == 1 &&
         this.map[(x-1)+","+(y-1)] == 0 &&
         this.map[x+","+(y-1)] == 0 &&
         this.map[(x+1)+","+(y-1)] == 0 &&
         this.map[x+","+(y+1)] == 1 &&
         this.map[(x+1)+","+(y+1)] == 1 &&
         this.map[(x-1)+","+(y+1)] == 1 ||

         this.map[x+","+y] == 1 &&
         this.map[(x-1)+","+(y+1)] == 0 &&
         this.map[x+","+(y+1)] == 0 &&
         this.map[(x+1)+","+(y+1)] == 0 &&
         this.map[x+","+(y-1)] == 1 &&
         this.map[(x+1)+","+(y-1)] == 1 &&
         this.map[(x-1)+","+(y-1)] == 1 ||

         this.map[x+","+y] == 1 &&
         this.map[(x+1)+","+y] == 0 &&
         this.map[x+","+(y-1)] == 0 &&
         this.map[(x-1)+","+y] == 1 &&
         this.map[x+","+(y+1)] == 1 &&
         this.map[(x+1)+","+(y-1)] == 0 &&
         this.map[(x-1)+","+(y+1)] == 1 ||

         this.map[x+","+y] == 1 &&
         this.map[(x+1)+","+y] == 0 &&
         this.map[x+","+(y-1)] == 0 &&
         this.map[(x-1)+","+y] == 1 &&
         this.map[x+","+(y+1)] == 1 &&
         this.map[(x+1)+","+(y-1)] == 0 &&
         this.map[(x-1)+","+(y+1)] == 1
       ){
         if(getRandomInt(1, 100) <= 70){
           if(getRandomInt(1, 100) <= 30){
             let barrel = new Tile(x, y, 3, "barrel_wood"+getRandomInt(1, 4), "destructible");
             collision_map.push(barrel);
             grid.setWalkableAt(x, y, true);
           }
       }else{
         if(getRandomInt(1, 100) <= 30){
           let table = new Tile(x, y, 3, "table_wood"+getRandomInt(1, 2), "destructible");
           collision_map.push(table);
           grid.setWalkableAt(x, y, true);
         }
       }
      }
    }
  }

};
