'use strict';
let renderer;
let canvas;
let target_sp;
let mc;

let KEYS = {
  W: 87,
  A: 65,
  S: 83,
  D: 68
}

let chest_inv = document.getElementById("container");

// let test_map = [["w", "w", "w", "w", "w", "w", "w", "w", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "c", "0", "0", "0", "w", "0", "w"],
//                 ["w", "0", "0", "0", "w", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "w", "w"],
//                 ["w", "w", "0", "0", "w", "0", "0", "0", "w"],
//                 ["w", "w", "w", "0", "w", "0", "w", "w", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "w", "0", "w", "0", "w", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "w", "w", "w", "0", "w", "w", "w", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "0", "0", "0", "0", "0", "0", "0", "w"],
//                 ["w", "w", "w", "w", "w", "w", "w", "w", "w"]];

let player;

let sprite_map = [];
let collision_map = [];
let item_map = [];
let all_sprites = [];

let moveTimer;

let grid;
let enemies = [];
let step_count = 0;
let gameIsPaused = false;

// SOUNDS
let alert_s, pl_hit, en_hit, dead, pl_dead, game_over;

let player_health, player_health_bg, pl_health_con = [];
let emitter;
let text;
// let g = new PIXI.Graphics();

// creating stage
let stage = new Phaser.Game(608, 608, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

class Tile {
  constructor(x, y, z_index, texture_path, name){
    let self = this;

    // tile size
    this.tile_size = {
      w: 32,
      h: 32
    };

    this.name = name;

    this.x = x * this.tile_size.w;
    this.y = y * this.tile_size.h;

    // layer index
    this.z_index = z_index;
    this.disableControl = false;
    // texture and sprite
    this.texture_path = texture_path;
    // this.sprite = new PIXI.Sprite(new PIXI.Texture.fromImage(this.texture_path));

    // position
    // this.sprite.position.x = x * this.tile_size.w;
    // this.sprite.position.y = y * this.tile_size.h;

    // this.x = this.sprite.position.x/this.tile_size.w;
    // this.y = this.sprite.position.y/this.tile_size.h;
    // interactive sprites
    // this.sprite.interactive ;

    // this.sprite = this.texture_path;
    this.sprite = stage.add.sprite(this.x, this.y, this.texture_path);
    this.sprite.inputEnabled = true;

    // sprite alpha
    // this.sprite.alpha = 0;

    this.state = 0;
    // 0 - hidden
    // 1 - foged
    // 2 - visible
    detectStateChange(this);

    this.tileOnClick();

    // mouse over/out callbacks
    // if(this.sprite.interactive){
      // this.sprite.on('mouseover', function(){
      //   target_sp.x = this.x;
      //   target_sp.y = this.y;
      // });
      // this.sprite.on("click", function(){
      //   if(this.alpha > 0){
      //     player.moveToPoint(this.x, this.y);
      //   }
      // });
    // }
  }

  addToStage(){
    stage.add.sprite(this.sprite);
  }

  tileOnClick(){
    let self = this;
    this.sprite.events.onInputDown.add(function(){
      if(self.state != 0 && !player.disableControl){
        gameIsPaused = false;
        if(this.name && this.name != "enemy" && this.name != "player")
          doStep(player.moveToPoint(this.x, this.y));
        if(this.name && this.name == "enemy"){
          player.hitTarget(this);
          doStep(false);
        }
        if(this.name && this.name == "player"){
          doStep(false);
        }

      }
    }, this);
  }

};




class Chest extends Tile{
  constructor(x, y, z_index, texture_path){
    super(x, y, z_index, texture_path, name);
    let self = this;
    this.container = [];

    this.sprite.on("mouseup", function(){
      // console.log(self.container);
      chest_inv.innerHTML = "";
      for(let i = 0; i < self.container.length; i++){
        var item = document.createElement("DIV");
        item.className = "item_cell";
        item.style.background = "url("+self.container[i].icon+") no-repeat center";
        chest_inv.appendChild(item);
      }
    });
  }
};




class Player extends Tile{
  constructor(x, y, z_index, texture_path, fovRadius, name, health, attack){
    super(x, y, z_index, texture_path, name);
    this.player_path_map = [];
    this.sprite.alpha = 1;
    this.state = 2;
    this.fovRadius = fovRadius;
    this.fov = [];
    this.state = 3;
    this.battleRadius = 1;
    this.moveTimer;
    this.moveDelay = 45; // default - 85, fast - 45
    this.isDetected = false;
    this.health = 100;
    this.attack = 10;
    this.sign;
    this.moved = false;

    this.hasActiveSigns = false;
  }

  centerCamera(){

    stage.camera.x = this.sprite.x - 608/2 + this.tile_size.w/2 ;
    stage.camera.y = this.sprite.y - 608/2 + this.tile_size.h/2;
  }

  removePathAfter(path_length){
    if(this.player_path_map[path_length-1] && this.x == this.player_path_map[path_length-1].sprite.x/this.tile_size.w && this.y == this.player_path_map[path_length-1].sprite.y/this.tile_size.h)
      this.player_path_map[path_length-1].sprite.destroy();
  }

  removeWholePath(){
    for(let i in this.player_path_map){
      this.player_path_map[i].sprite.destroy();
    }
  }

  checkHitAvailability(target){
    if(((target.sprite.x == this.sprite.x) && (target.sprite.y == this.sprite.y + this.tile_size.h))||                    // taget is on top
       ((target.sprite.x == this.sprite.x) && (target.sprite.y == this.sprite.y - this.tile_size.h))||                    // target is on bottom
       ((target.sprite.y == this.sprite.y) && (target.sprite.x == this.sprite.x - this.tile_size.h))||                    // target is on left
       ((target.sprite.y == this.sprite.y) && (target.sprite.x == this.sprite.x + this.tile_size.h))||                    // taget is on right
       ((target.sprite.x == this.sprite.x - this.tile_size.h) && (target.sprite.y == this.sprite.y - this.tile_size.h))|| // top left
       ((target.sprite.x == this.sprite.x - this.tile_size.h) && (target.sprite.y == this.sprite.y + this.tile_size.h))|| // bottom left
       ((target.sprite.x == this.sprite.x + this.tile_size.h) && (target.sprite.y == this.sprite.y - this.tile_size.h))|| // top right
       ((target.sprite.x == this.sprite.x + this.tile_size.h) && (target.sprite.y == this.sprite.y + this.tile_size.h))   // bottom right
    ){
      return true;
    }
    else{
      return false;
    }
  }

  hitTarget(target){
    if(this.checkHitAvailability(target) && this.health > 0){
      emitter.x = target.sprite.x + target.tile_size.w/2;
      emitter.y = target.sprite.y + target.tile_size.h/2;

      emitter.start(true, 800, null, 5);
      target.health -= this.attack;
      // console.log(target.name, "HP:", target.health);
      if(target.name == "player"){
        en_hit.play();
        var hp = $("#health");
        var hp_c = $("#health_container");
        hp.width(target.health*hp_c.width()/100 - this.attack);
        // console.log(hp);
      }else{
        pl_hit.play();
      }
      this.moved = true;
      if(target.health <= 0 && target.name == "player"){
        pl_dead.play();
        target.sprite.loadTexture("pl_dead");
        target.disableControl = true;
        // game_over.play();
      }
    }

  }

  //
  // movePlayer(){
  //   let self = this;
  //   document.onkeydown = function(ev){
  //     switch(ev.keyCode){
  //       case KEYS.W:
  //         self.y -= self.tile_size.h;
  //       break;
  //       case KEYS.A:
  //         self.x -= self.tile_size.w;
  //       break;
  //       case KEYS.S:
  //         self.y += self.tile_size.h;
  //       break;
  //       case KEYS.D:
  //         self.x += self.tile_size.w;
  //       break;
  //     }
  //   }
  //   self.setVisible();
  // }

  //
  //
  //     // g.clear();
  //     // g.lineStyle(1, "0x00ff08", .8);
  //     // for(var i = 0; i < 64; i++){
  //     //   var x, y;
  //     //   g.moveTo(self.sprite.position.x + self.tile_size.w/2, self.sprite.position.y + self.tile_size.h/2);
  //     //   x = self.sprite.position.x + self.tile_size.w/2 + self.tile_size.w*self.fovRadius*Math.cos(i*0.0981747704);
  //     //   y = self.sprite.position.y + self.tile_size.h/2 + self.tile_size.h*self.fovRadius*Math.sin(i*0.0981747704);
  //     //   g.lineTo(x, y);
  //     // }
  //     // stage.addChild(g);
  //
  //
  //     self.setVisible();
  //   }
  // }

  lookForPlayer(sm){
    for(let i in enemies){
      if(sm && sm.x == enemies[i].sprite.x && sm.y == enemies[i].sprite.y && this.name == "player"){
        enemies[i].state = 2;
        detectStateChange(enemies[i]);
      }
    }
  }

  moveToPoint(px, py){
    for(let i in this.player_path_map){
      this.player_path_map[i].sprite.destroy();
    }
    this.player_path_map = [];

    let finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
    let path = finder.findPath(Math.floor(this.sprite.x/this.tile_size.w), Math.floor(this.sprite.y/this.tile_size.h), Math.floor(px/this.tile_size.w), Math.floor(py/this.tile_size.h), grid.clone());

    if(path.length > 0 && this.name == "player"){
      for(let i = 1; i < path.length; i++){
        let pt = new Tile(path[i][0], path[i][1], 4, "t_path", "path");
        pt.sprite.inputEnabled = false;
        pt.state = 2;
        detectStateChange(pt);
        this.player_path_map.push(pt);
      }
    }

    if(this.name == "player" && path.length > 1){
      doStep(path);
    }
    if(path.length > 1)
      return path;
  }



  doFOV(){
    this.fov = [];

    for(let ray = 0; ray < 64; ray++)
  	{
      let x = Math.cos(ray * 0.0981747704);
      let y = Math.sin(ray * 0.0981747704);

      let ox = this.sprite.x + this.tile_size.w/2;
      let oy = this.sprite.y + this.tile_size.h/2;

      for(let i = 0; i < this.tile_size.w*this.fovRadius; i++){
        let sm = sprite_map[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];
        let em = collision_map[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];

        //looking for an enemy
        if(this.name == "player"){
          this.lookForPlayer(sm);

          if(sm && sm.state != 2){
            sm.state = 2;
            detectStateChange(sm);
            this.fov.push(sm);
          }
          if(em && em.state != 2){
            em.state = 2;
            detectStateChange(em);
            this.fov.push(em);
          }
        }

        if(this.name == "enemy"){
          if(sm && sm.name){
            this.fov.push(sm);
            this.fov = unique(this.fov);
          }
        }

        if(em && em.name && em.name == "collision"){
          break;
        }
        ox += x;
        oy += y;
      }
    }
  }

  setVisible(){
    for(let i in all_sprites){
      if(all_sprites[i] && all_sprites[i].state > 1){
        all_sprites[i].state = 1;
        detectStateChange(all_sprites[i]);
      }
    }

    // hide enemies when they are not in players FOV
    if(this.name == "player"){
      for(let i in this.fov){
        for(let j in enemies){
          if(this.fov[i].sprite.x != enemies[j].sprite.x && this.fov[i].sprite.y != enemies[j].sprite.y){
            enemies[j].state = 0;
            detectStateChange(enemies[j]);
          }
        }
      }
    }
  }

  showSignAbove(sprite, sound){
    if(this.sign){
      let sign = this.sign;
      sign.destroy();
      this.sign = undefined;
    }
    let signSprite = stage.add.sprite(this.sprite.x, this.sprite.y-this.tile_size.h, sprite);
    this.sign = signSprite;
    sound.play();
  }

  removeSignAbove(sign){
    if(sign)
    sign.destroy();
  }

}// end of Player class




class Enemy extends Player{
  constructor(x, y, z_index, texture_path, fovRadius, name, objects){
    super(x, y, z_index, texture_path, fovRadius, name);
    this.state = 0;
    this.targetFound = false;
    this.counter = 1;

    this.health = 50;
    this.attack = 5;
    this.collectEnemies();

    this.doFOV();
    this.detectPlayer();
    this.moved = true;
  }

  // push all created enemies to the enemy array
  collectEnemies(){
    enemies.push(this);
  }

  detectPlayer(){

    for(let i in this.fov){
      if(this.fov[i].x == player.x*this.tile_size.w && this.fov[i].y == player.y*this.tile_size.h){
        this.targetFound = true;
        gameIsPaused = true;
        player.removeWholePath();
        // console.log("%c DETECTED! ", "background-color: red; color: #fff");
        break;
        return 0;
      }else {
        this.targetFound = false;
        this.hasActiveSigns = false;
      }
    }

    // if(!this.hasActiveSigns)
    //   this.removeSignAbove(this.sign);

  }

}


class Item{
  constructor(name, price, weight, description, icon){
    this.name = name;
    this.price = price;
    this.weight = weight;
    this.description = description;
    this.icon = icon;
  }
};


class Weapon extends Item{
  constructor(name, price, weight, description, icon, damage){
    super(name, price, weight, description, icon);
    this.damage = damage;
  }
};


function detectStateChange(tile){
  if(tile && tile.name != "player"){
    switch(tile.state){
      case 0:
        tile.sprite.tint = 0x000000;
      break;
      case 1:
        tile.sprite.tint = 0x333333;
      break;
      case 2:
        tile.sprite.tint = 0xFFFFFF;
      break;
      case 3:
        tile.sprite.alpha = 0.2;
        // tile.sprite.tint = 0xFFFFFF;
      break;
    }
  }
}

function doStep(path){
  let i = 1;
  player.moved = false;

  clearInterval(player.moveTimer);
  player.moveTimer = setInterval(function(){
    if(!gameIsPaused){
      // move playerayer to the next path section
      if(path){
        // let path = player.moveToPoint(px, py);
        player.sprite.x = path[i][0] * player.tile_size.w;
        player.sprite.y = path[i][1] * player.tile_size.h;
        player.x = path[i][0];
        player.y = path[i][1];
      }
      player.setVisible();
      player.doFOV();
      player.removePathAfter(i);
      player.centerCamera();
      player.moved = true;

      for(let j in enemies){
        let enemy = enemies[j];
        enemy.counter = 1;
        enemy.moved = false;

        // OPTIMIZE THIS FUNCTIONS //
        enemy.doFOV();
        enemy.detectPlayer();
        // // // // // // // // // //

        console.log("enemies loop");
        if(enemy.targetFound){
          let epath = enemy.moveToPoint(player.sprite.x, player.sprite.y);

          if(epath && enemy.counter < epath.length - 1){
            grid.setWalkableAt(enemy.sprite.x/enemy.tile_size.w, enemy.sprite.y/enemy.tile_size.h, true);

            enemy.sprite.x = epath[enemy.counter][0] * enemy.tile_size.w;
            enemy.sprite.y = epath[enemy.counter][1] * enemy.tile_size.h;
            enemy.x = epath[enemy.counter][0];
            enemy.y = epath[enemy.counter][1];

            enemy.moved = true;

            grid.setWalkableAt(enemy.sprite.x/enemy.tile_size.w, enemy.sprite.y/enemy.tile_size.h, false);
            enemy.counter++;
          }
        }


          if(!enemy.moved){
            setTimeout(function(){
              enemy.hitTarget(player);
            }, 150);
            if(enemy.hasActiveSigns)
              enemy.showSignAbove('t_alert', alert_s);
            if(enemy.health <= 0){ // remove enemy from the game if it's health <= 0
              enemy.sprite.destroy();
              dead.play();
              grid.setWalkableAt(enemy.sprite.x/enemy.tile_size.w, enemy.sprite.y/enemy.tile_size.h, true);
              var z = enemies.indexOf(enemy);
              if(z != -1) {
              	enemies.splice(z, 1);
              }
            }
          }
    }

      player.setVisible();
      player.doFOV();

      // if(i < path.length-1 && path[i][0] > path[i+1][0] && path[i][1] == path[i+1][1]){
      //   player.sprite.play("left");
      // }
      // if(i < path.length-1 && path[i][0] < path[i+1][0] && path[i][1] == path[i+1][1]){
      //   player.sprite.play("right");
      // }
      // if(i < path.length-1 && path[i][0] == path[i+1][0] && path[i][1] > path[i+1][1]){
      //   player.sprite.play("up");
      // }
      // if(i < path.length-1 && path[i][0] == path[i+1][0] && path[i][1] < path[i+1][1]){
      //   player.sprite.play("down");
      // }
      // countStep();
      if(path && i == path.length - 1){
        clearInterval(player.moveTimer);
        // player.sprite.animations.stop();
      }
      if(!path){
        clearInterval(player.moveTimer);
      }

      i++;

    }
  }, player.moveDelay);
}

function countStep(){
  step_count++;
  // for(let j in enemies){
  //   if(!enemies[j].moved)
  //     setTimeout(function(){
  //       enemies[j].hitTarget(playerF);
  //     }, 150);
  //   if(enemies[j].hasActiveSigns)
  //     enemies[j].showSignAbove('t_alert', alert_s);
  //   if(enemies[j].health <= 0){ // remove enemy from the game if it's health <= 0
  //     enemies[j].sprite.destroy();
  //     dead.play();
  //     grid.setWalkableAt(enemies[j].sprite.x/enemies[j].tile_size.w, enemies[j].sprite.y/enemies[j].tile_size.h, true);
  //     var z = enemies.indexOf(enemies[j]);
  //     if(z != -1) {
  //     	enemies.splice(z, 1);
  //     }
  //   }
  // }

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
  return Math.floor(Math.random() * (max - min)) + min;
}

function setRandomPos(){
  let rand_pos;
  while(rand_pos === undefined){
    let point = all_sprites[getRandomInt(0, all_sprites.length-1)];
    if(point && point.name && point.name == "floor" && point.sprite.x != player.sprite.x && point.sprite.y != player.sprite.x){
      rand_pos = point;
    }
  }
  return rand_pos;
}


function preload() {
    // SPRITSHEET
    // player walk animation
    stage.load.spritesheet('mc_player', '/images/player_walk.png', 32, 32);

    // SPRITES
    stage.load.image('t_floor', '/images/test_floor.png');
    stage.load.image('t_wall', '/images/test_wall.png');
    stage.load.image('t_player', '/images/test_player.png');
    stage.load.image('t_path', '/images/path_01.png');
    stage.load.image('dummy', '/images/test_dragon.png');
    stage.load.image("path_end", "/images/path_end.png")
    stage.load.image('walls', "/images/spritesheet/Objects/Wall.png");
    stage.load.image('t_alert', "/images/alert.png");
    stage.load.image("t_hit", "/images/hit_particle.png");
    stage.load.image("pl_dead", "/images/pl_dead.png");
    stage.load.image("loot", "/images/loot.png");
    stage.load.image("skeleton", "/images/skeleton.png");

    //AUDIO
    stage.load.audio('game_over', "/sound/ascending.mp3");
    stage.load.audio('alert', "/sound/alert.wav");
    stage.load.audio('pl_hit', "/sound/pl_hit.wav");
    stage.load.audio('en_hit', "/sound/en_hit.wav");
    stage.load.audio('dead', "/sound/dead.wav");
    stage.load.audio('pl_dead', "/sound/pl_dead.wav");

}

function create() {
    stage.world.setBounds(-Dungeon.map_size*32, -Dungeon.map_size*32, Dungeon.map_size*32*4, Dungeon.map_size*32*4);

    grid = new PF.Grid(Dungeon.map_size, Dungeon.map_size);

    // draw only floor
    for(let i = 0; i < Dungeon.map_size; i++){
      sprite_map[i] = [];
      for(let j = 0; j < Dungeon.map_size; j++){
        if(Dungeon.map[i][j] == 1){
          let floor = new Tile(i, j, 2, 't_floor', "floor");
          sprite_map[i][j] = floor;
          sprite_map[i][j].addToStage();
        }
      }
    }

    // draw interactive objects on the floor
    for(let i = 0; i < Dungeon.map_size; i++){
      collision_map[i] = [];
      for(let j = 0; j < Dungeon.map_size; j++){
        // if(Dungeon.map[i][j] == "c"){
        //   let chest_01 = new Chest(i, j, 2, "/images/test_chest.png", "chest");
        //   chest_01.container.push(wpn_01);
        //   chest_01.container.push(wpn_02);
        //   collision_map[i][j] = chest_01;
        //   collision_map[i][j].addToStage();
        //   grid.setWalkableAt(i, j, false);
        // }
        if(Dungeon.map[i][j] == 2){
          let wall_01 = new Tile(i, j, 2, 't_wall', "collision");
          collision_map[i][j] = wall_01;
          wall_01.sprite.inputEnabled = false;
          wall_01.addToStage();
          grid.setWalkableAt(i, j, false);
        }

        // if(Dungeon.map[i][j] == 2  && Dungeon.map[i][j+1] == 1){
        //   let wall_01 = new Tile(i, j, 2, 'wall-t', "collision");
        //   collision_map[i][j] = wall_01;
        //   collision_map[i][j].sprite.inputEnabled = false;
        //   collision_map[i][j].addToStage();
        //   grid.setWalkableAt(i, j, false);
        // }
        // if(Dungeon.map[i][j] == 2  && Dungeon.map[i+1][j] == 2 && Dungeon.map[i][j+1] == 2){
        //   let wall_01 = new Tile(i, j, 2, 'wall-t-c', "collision");
        //   collision_map[i][j] = wall_01;
        //   collision_map[i][j].sprite.inputEnabled = false;
        //   collision_map[i][j].addToStage();
        //   grid.setWalkableAt(i, j, false);
        // }
        // if(i > 0 && Dungeon.map[i][j] == 2  && (Dungeon.map[i+1][j] == 1 || Dungeon.map[i-1][j] == 1)){
        //   let wall_01 = new Tile(i, j, 2, 'wall-side', "collision");
        //   collision_map[i][j] = wall_01;
        //   collision_map[i][j].sprite.inputEnabled = false;
        //   collision_map[i][j].addToStage();
        //   grid.setWalkableAt(i, j, false);
        // }
        // if(i > 0 && Dungeon.map[i][j] == 2 && Dungeon.map[i-1][j] == 1 && Dungeon.map[i][j+1] == 1){
        //   let wall_01 = new Tile(i, j, 2, 'wall-t', "collision");
        //   collision_map[i][j] = wall_01;
        //   collision_map[i][j].sprite.inputEnabled = false;
        //   collision_map[i][j].addToStage();
        //   grid.setWalkableAt(i, j, false);
        // }
      }
    }

    for(let i = 0; i < Dungeon.map_size; i++){
      for(let j = 0; j < Dungeon.map_size; j++){
        if(collision_map[i][j])
          all_sprites.push(collision_map[i][j]);
      }
    }

    for(let i = 0; i < Dungeon.map_size; i++){
      for(let j = 0; j < Dungeon.map_size; j++){
        if(sprite_map[i][j])
          all_sprites.push(sprite_map[i][j]);
      }
    }

    // SOUNDS

    alert_s = stage.add.audio('alert');
    en_hit = stage.add.audio('en_hit');
    pl_hit = stage.add.audio('pl_hit');
    dead = stage.add.audio('dead');
    pl_dead = stage.add.audio('pl_dead');
    game_over = stage.add.audio('game_over');

    target_sp = new Phaser.Sprite();
    stage.add.sprite(target_sp);

    // let en_01 = new Enemy(8, 5, 3, "/images/test_dragon.png", 3, "enemy");
    // // en_01.addToStage();
    //

    stage.physics.startSystem(Phaser.Physics.ARCADE);

    // player = new Player(1, 1, 3, "mc_player", 8, "player");
    player = new Player(1, 1, 3, "t_player", 4, "player");
    player.addToStage();

    // player_health = new Phaser.Rectangle(player.sprite.x - 11, player.sprite.y - 5, 50, 5);
    // player_health_bg = new Phaser.Rectangle(player.sprite.x - 11, player.sprite.y - 5, 50, 5);

    player.setVisible();
    player.doFOV();
    player.centerCamera();

    for(let i = 0; i < 10; i++){
      var rand_pos = setRandomPos();
      var skeleton = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "skeleton", 4, "enemy");
      skeleton.attack = 3;
      skeleton.health = 25;
      skeleton.addToStage();
    }

    for(let i = 0; i < 3; i++){
      var rand_pos = setRandomPos();
      var dragon = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "dummy", 4, "enemy");
      dragon.attack = 10;
      dragon.health = 45;
      dragon.addToStage();
    }

    emitter = stage.add.emitter(0, 0, 20);

    emitter.makeParticles('t_hit');
    emitter.gravity = 200;

    doStep(false);

    // player movement animation
    // player.sprite.animations.add('left', [4, 5, 6, 7], 10, true);
    // player.sprite.animations.add('right', [8, 9, 10, 11], 10, true);
    // player.sprite.animations.add('up', [12, 13, 14, 15], 10, true);
    // player.sprite.animations.add('down', [0, 1, 2, 3], 10, true);
}

function update(){
  emitter.forEachAlive(function(p){	p.tint = 0xCC1100;	p.alpha= p.lifespan / emitter.lifespan;	});
}

function render(){
  // stage.debug.geom(player_health_bg,'#7a0303');
  // stage.debug.geom(player_health,'#d10202');
}
