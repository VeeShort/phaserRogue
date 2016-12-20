'use strict';
let renderer;
let canvas;
let target_sp;
let mc;

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
let alert_s, pl_hit, en_hit, fire_hit, dead, pl_dead, game_over, miss, bad_hit;

let player_health, player_health_bg, pl_health_con = [];
// PARTICLES
let emitter, death_effect;

// KEYS
let rKey;

//CLASSES
let isMage = false;
let isWarrior = false;

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
        }
        if(this.name && this.name == "player"){
          updateLog("You choose to do nothing");
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
  constructor(x, y, z_index, texture_path, fovRadius, name, hero_name){
    super(x, y, z_index, texture_path, name);
    this.player_path_map = [];
    this.sprite.alpha = 1;
    this.state = 2;
    this.fovRadius = fovRadius;
    this.fov = [];
    this.state = 3;
    this.meleeR = 1;
    this.rangedR = 5;
    this.moveTimer;
    this.moveDelay = 45; // default - 85, fast - 45
    this.isDetected = false;

    this.health = undefined;
    this.maxHealth = undefined;

    this.magic = undefined;
    this.maxMagic = undefined;

    this.stat = {
      dexterity: 20
    }

    this.sign;
    this.moved = false;
    this.fovLines = 56;
    this.hero_name = hero_name;
    this.inRangedCombat = false;
    this.activeWeapon = undefined;

    this.inventory = [];

    this.equiped = {
      main_hand: undefined,
      off_hand: undefined,
      chest: undefined,
      wrist: undefined,
      boots: undefined,
      waist: undefined,
      pants: undefined,
      helm: undefined
    }

    this.hasActiveSigns = false;
  }

  getTotalArmorPoints(){
    let totalArmor = 0;
    for(let i in this.equiped){
      if(this.equiped[i] && this.equiped[i].armorValue){
        totalArmor += this.equiped[i].armorValue;
      }
    }
    return totalArmor;
  }

  setHealth(hp){
    this.health = hp;
    this.maxHealth = hp;
  }

  setMagic(mp){
    this.magic = mp;
    this.maxMagic = mp;
  }

  equipItem(item){
    if(item.equipable){
      this.equiped[item.slot] = item;
      if((item.type == "melee" || item.type == "ranged") && item.slot == "main_hand"){
        this.activeWeapon = item;
      }
    }
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

  changeActiveWeapon(){
    if(this.equiped["main_hand"] == this.activeWeapon && this.equiped["off_hand"]){
      this.activeWeapon = this.equiped["off_hand"];
      this.equiped["off_hand"] = this.activeWeapon;
      if(this.name == "player"){
        $("#pl-weapon").text(this.activeWeapon.name);
      }
    }else if(this.equiped["off_hand"] == this.activeWeapon && this.equiped["main_hand"]){
      this.activeWeapon = this.equiped["main_hand"];
      this.equiped["main_hand"] = this.activeWeapon;
      if(this.name == "player"){
        $("#pl-weapon").text(this.activeWeapon.name);
      }
    }else{
      return false;
    }
  }

  checkHitAvailability(target){
    if(this.activeWeapon.type == "melee" && this.activeWeapon.manaCost <= this.magic){
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
    }else if(this.activeWeapon.type == "ranged" && this.activeWeapon.manaCost <= this.magic){
      if(this.rangedR*this.tile_size.w >= Math.sqrt((target.sprite.x - this.sprite.x)*(target.sprite.x - this.sprite.x) + (target.sprite.y - this.sprite.y)*(target.sprite.y - this.sprite.y))){
        return true;
      }else{
        return false;
      }
    }
  }

  hitTarget(target){
    if(target.health > 0 && this.checkHitAvailability(target)){
      // position the hit particles on target's position
      emitter.x = target.sprite.x + target.tile_size.w/2;
      emitter.y = target.sprite.y + target.tile_size.h/2;

      // start to draw melee particles
      emitter.start(true, 800, null, 5);

      // calculating weapon damage
      let damage = getRandomInt(this.activeWeapon.minDamage, this.activeWeapon.maxDamage);

      // calculating damage multiplier
      let d_mult = 1 - 0.06 * target.getTotalArmorPoints()/(1 + (0.06*target.getTotalArmorPoints()));

      // calculating final damage dealt to the target
      damage = Math.floor(damage * d_mult);

      switch (this.activeWeapon.nature) {
        case "fire":
          fire_hit.play();
        break;
      }

      // play hit sound or absorb damage sound
      if(damage > 0){
        // target is hit
        en_hit.play();
      }else{
        // target absorbs damage
        bad_hit.play();
      }

      // recalculating players magic points relative to mana cost of the used weapon
      this.magic = this.magic - this.activeWeapon.manaCost;

      // calculating hit/miss rates relative to target's dexterity stat
      if(getRandomInt(1,100) > target.stat.dexterity) {
        // target is hit
        target.health -= damage;
        updateLog("["+this.hero_name + "] hits ["+target.hero_name+"] with "+ damage + " damage");
      } else {
        // target is missed
        miss.play();
        updateLog("["+this.hero_name + "] misses ["+target.hero_name+"] with [" + this.activeWeapon.name + "]");
      }

      // update user interface information on hit (like health, magic, etc.)
      updateUI(this, target);

      // if current hit was fatal
      if(target.health <= 0){
        updateLog("["+this.hero_name + "] kills ["+target.hero_name+"] with [" + this.activeWeapon.name + "]");

        // death of the hero player
        if(target.name == "player"){
          pl_dead.play();
          target.sprite.loadTexture("pl_dead");
          target.disableControl = true;
          death_effect.x = target.sprite.x + target.tile_size.w/2;
          death_effect.y = target.sprite.y + target.tile_size.h/2;
          death_effect.start(false, 2000, 100);
        }else{
          // death of other stuff (like enemies)
          target.sprite.destroy();
          dead.play();
          grid.setWalkableAt(target.sprite.x/target.tile_size.w, target.sprite.y/target.tile_size.h, true);
          var z = enemies.indexOf(target);
          if(z != -1) {
            enemies.splice(z, 1);
          }
          $(".container.target").css("opacity", 0);
        }
      }

      // count current hit attempt as step
      doStep(false);
    }

    // update enemy UI info
    if(target.name == "enemy"){
      if(target.health > 0){
        $(".container.target").css("opacity", 1);
      }
      $("#en-port").attr("src", target.portrait);
      $("#en-name").text(target.hero_name);
      var hp = $("#en-health");
      $("#en-max-hp").text(target.maxHealth);
      var hp_c = $("#en-health_container");
      $("#en-current-hp").text(target.health);
      hp.width(target.health*hp_c.width()/target.maxHealth);
    }
  }

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
      dontCrossCorners: false
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
    // check if player is in enemy's fov radius
    if( this.name == "enemy" && this.fovRadius*this.tile_size.w < Math.sqrt((player.sprite.x - this.sprite.x)*(player.sprite.x - this.sprite.x) + (player.sprite.y - this.sprite.y)*(player.sprite.y - this.sprite.y)) ){
      return false;
    }
    this.fov = [];

    for(let ray = 0; ray < this.fovLines; ray++)
  	{
      let x = Math.cos(ray * 360/this.fovLines*Math.PI/180);
      let y = Math.sin(ray * 360/this.fovLines*Math.PI/180);

      let ox = this.sprite.x + this.tile_size.w/2;
      let oy = this.sprite.y + this.tile_size.h/2;

      for(let i = 0; i < this.tile_size.w*this.fovRadius; i++){
        let sm = sprite_map[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];
        let em = collision_map[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];

        // looking for an enemy
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

    for(let i in all_sprites){
      if(all_sprites[i] && all_sprites[i].state > 1){
        all_sprites[i].state = 1;
        detectStateChange(all_sprites[i]);
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
  constructor(x, y, z_index, texture_path, fovRadius, name, hero_name, portrait){
    super(x, y, z_index, texture_path, fovRadius, name, hero_name);
    this.state = 0;
    this.targetFound = false;
    this.hasRanged = false;
    this.health = 50;
    this.attack = 5;
    this.collectEnemies();
    this.portrait = portrait;

    this.counter = 1;
    this.doFOV();
    this.detectPlayer();
  }

  // push all created enemies to the enemy array
  collectEnemies(){
    enemies.push(this);
  }

  detectPlayer(){
    if(this.fov.length > 0){
      for(let i in this.fov){
        if(this.fov[i].x == player.x*this.tile_size.w && this.fov[i].y == player.y*this.tile_size.h){
          console.log(this.meleeR*this.tile_size.w+16, Math.floor(Math.sqrt((player.sprite.x+16 - this.sprite.x+16)*(player.sprite.x+16 - this.sprite.x+16) + (player.sprite.y+16 - this.sprite.y+16)*(player.sprite.y+16 - this.sprite.y+16))))
          if(this.activeWeapon.type == "melee" &&
             this.meleeR*this.tile_size.w < Math.floor(Math.sqrt((player.sprite.x - this.sprite.x)*(player.sprite.x - this.sprite.x) + (player.sprite.y - this.sprite.y)*(player.sprite.y - this.sprite.y)))){
            this.changeActiveWeapon();
          }else if(this.activeWeapon.type == "ranged" && this.magic <= 0){
            this.changeActiveWeapon();
          }
          this.targetFound = true;
          gameIsPaused = true;
          player.removeWholePath();
          break;
          return true;
        }else {
          this.targetFound = false;
          this.hasActiveSigns = false;
        }
      }
    }
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
  constructor(name, price, weight, description, icon, minDamage, maxDamage, type, manaCost, nature, equipable, slot){
    super(name, price, weight, description, icon);
    this.type = type;
    this.equipable = equipable;
    this.minDamage = minDamage;
    this.maxDamage = maxDamage;
    this.manaCost = manaCost;
    this.nature = nature;
    this.slot = slot;
  }
};

class Armor extends Item{
  constructor(name, price, weight, description, icon, armorValue, equipable, slot){
    super(name, price, weight, description, icon);
    this.equipable = equipable;
    this.slot = slot;
    this.armorValue = armorValue;
  }
};


function detectStateChange(tile){
  if(tile && tile.name != "player"){
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
      case 3:
        tile.sprite.alpha = 0.2;
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

function doStep(path){
  let i = 1;
  player.moved = false;

  clearInterval(player.moveTimer);
  player.moveTimer = setInterval(function(){
    if(!gameIsPaused){
      // move player to the next path section
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

        enemy.doFOV();
        enemy.detectPlayer();
        enemy.moved = false;

        if(enemy.targetFound){
          if(enemy.activeWeapon.type == "melee"){
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
              enemy.moved = true;
            }, 150);
            // if(enemy.hasActiveSigns)
            //   enemy.showSignAbove('t_alert', alert_s);
          }
        }
    }

    player.setVisible();
    player.doFOV();

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
    if(point && point.name && point.name == "floor" && point.sprite.x != player.sprite.x && point.sprite.y != player.sprite.x){
      rand_pos = point;
    }
  }
  return rand_pos;
}


function preload() {
    // SPRITSHEET
    // player walk animation
    stage.load.spritesheet('mc_player', './images/player_walk.png', 32, 32);

    // SPRITES
    stage.load.image('t_floor', './images/test_floor.png');
    stage.load.image('t_floor2', './images/test_floor2.png');
    stage.load.image('t_wall', './images/test_wall.png');
    stage.load.image('t_wall2', './images/test_wall2.png');
    stage.load.image('pl_warrior', './images/pl_warrior.png');
    stage.load.image('pl_wizard', './images/pl_wizard.png');
    stage.load.image('t_path', './images/path_01.png');
    stage.load.image('dummy', './images/test_dragon.png');
    stage.load.image("path_end", "./images/path_end.png")
    stage.load.image('walls', "./images/spritesheet/Objects/Wall.png");
    stage.load.image('t_alert', "./images/alert.png");
    stage.load.image("t_hit", "./images/hit_particle.png");
    stage.load.image("pl_dead", "./images/pl_dead.png");
    stage.load.image("loot", "./images/loot.png");
    stage.load.image("skeleton", "./images/skeleton.png");
    stage.load.image("skeleton2", "./images/skeleton_2.png");

    //AUDIO
    stage.load.audio('game_over', "./sound/ascending.mp3");
    stage.load.audio('alert', "./sound/alert.wav");
    stage.load.audio('pl_hit', "./sound/pl_hit.wav");
    stage.load.audio('en_hit', "./sound/en_hit.wav");
    stage.load.audio('fire_hit', "./sound/fire.wav");
    stage.load.audio('dead', "./sound/dead.wav");
    stage.load.audio('pl_dead', "./sound/pl_dead.wav");
    stage.load.audio('miss', "./sound/miss.wav");
    stage.load.audio('bad_hit', "./sound/bad_hit.wav");

}

function create() {
    // let plClass = prompt("Enter your class name [warrior or wizard]", 'warrior');

    let plClass = "warrior";

    if(plClass != "warrior" && plClass != "wizard"){
      plClass = "warrior"
    }

    stage.world.setBounds(-Dungeon.map_size*32, -Dungeon.map_size*32, Dungeon.map_size*32*4, Dungeon.map_size*32*4);

    grid = new PF.Grid(Dungeon.map_size, Dungeon.map_size);

    // draw only floor
    for(let i = 0; i < Dungeon.map_size; i++){
      sprite_map[i] = [];
      for(let j = 0; j < Dungeon.map_size; j++){
        if(Dungeon.map[i][j] == 1){
          let chance = getRandomInt(1,100);
          let floor;
          if(chance <= 80){
            floor = new Tile(i, j, 2, 't_floor', "floor");
          }else{
            floor = new Tile(i, j, 2, 't_floor2', "floor");
          }
          sprite_map[i][j] = floor;
          sprite_map[i][j].addToStage();
        }
      }
    }

    // draw interactive objects on the floor
    for(let i = 0; i < Dungeon.map_size; i++){
      collision_map[i] = [];
      for(let j = 0; j < Dungeon.map_size; j++){
        if(Dungeon.map[i][j] == 2){
          let chance = getRandomInt(1,100);
          let wall_01;
          if(chance <= 80){
            wall_01 = new Tile(i, j, 2, 't_wall', "collision");
          }else{
            wall_01 = new Tile(i, j, 2, 't_wall2', "collision");
          }
          collision_map[i][j] = wall_01;
          wall_01.sprite.inputEnabled = false;
          wall_01.addToStage();
          grid.setWalkableAt(i, j, false);
        }
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

    // // SOUNDS
    alert_s = stage.add.audio('alert');
    en_hit = stage.add.audio('en_hit');
    pl_hit = stage.add.audio('pl_hit');
    bad_hit = stage.add.audio('bad_hit');
    miss = stage.add.audio('miss')
    fire_hit = stage.add.audio("fire_hit");
    dead = stage.add.audio('dead');
    pl_dead = stage.add.audio('pl_dead');
    game_over = stage.add.audio('game_over');

    target_sp = new Phaser.Sprite();
    stage.add.sprite(target_sp);

    // // ITEMS
    // WEAPONS
    // name, price, weight, description, icon, damage, type, mana cost, equipable
    let dragon_claws = new Weapon("Dragon Claws", 0, 0, "These are very sharp", "n/a", 7, 10, "melee", 0, "default", true, "main_hand");
    let bone = new Weapon("Bone fists", 0 ,0, "Skeletons have these", "n/a", 1, 3, "melee", 0, "default", true, "main_hand");
    let iron_sword = new Weapon("Iron Sword", 0, 0, "Regular iron sword for killing stuff", "n/a", 10, 15, "melee", 0, "default", true, "main_hand");
    let rusty_sword = new Weapon("Rusty Sword", 0, 0, "Ancient sword covered with rust", "n/a", 3, 6, "melee", 0, "default", true, "main_hand");

    let fireball_sp = new Weapon("Sphere of Fire", 0, 0, "Regular fireball", "n/a", 15, 25, "ranged", 1, "fire", true, "off_hand");

    // ARMOR
    // name, price, weight, description, icon, armorValue, equipable, slot
    let iron_chest = new Armor("Iron chest", 0, 0, "Regular iron chest", "n/a", 15, true, "chest");
    let magic_robe = new Armor("Leather robe", 0, 0, "Wizards rule", "n/a", 5, true, "chest");

    // test
    let holy_plates = new Armor("Admin Admin", 0, 0, "Not for balance", "n/a", 80, true, "pants");

    // stage.physics.startSystem(Phaser.Physics.ARCADE);

    // SPAWN PLAYERS
    player = new Player(1, 1, 3, "pl_"+plClass, 4, "player", "Hero " + plClass);

    switch(plClass){
      case "warrior":
        player.setHealth(50);
        player.setMagic(5);
        player.equipItem(iron_sword);
        player.equipItem(fireball_sp);
        player.equipItem(iron_chest);
        player.equipItem(holy_plates);
        player.stat.dexterity = 15;
      break;
      case "wizard":
        player.setHealth(25);
        player.setMagic(25);
        player.equipItem(iron_sword);
        player.equipItem(fireball_sp);
        player.equipItem(magic_robe);
        player.inRangedCombat = true;
        player.stat.dexterity = 25;
        player.fovRadius = 5;
        player.rangedR = 8;
      break;
    }

    player.addToStage();
    player.setVisible();
    player.doFOV();
    player.centerCamera();

    $("#current-hp").text(player.health);
    $("#max-hp").text(player.maxHealth);

    $("#current-mp").text(player.magic);
    $("#max-mp").text(player.maxMagic);

    $("#pl-name").text(player.hero_name);

    $("#pl-weapon").text(player.equiped["main_hand"].name);

    $("#pl-dex").text(player.stat.dexterity);
    $("#pl-arm").text(player.getTotalArmorPoints());

    for(let i = 0; i < 10; i++){
      let rand_pos = getRandomPos();
      let skeleton = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "skeleton", 4, "enemy", "Spooky skeleton", "./images/skeleton_port.png");
      skeleton.stat.dexterity = 15;
      skeleton.x = rand_pos.x/32;
      skeleton.y = rand_pos.y/32;
      skeleton.setHealth(25);
      skeleton.setMagic(0);
      skeleton.equipItem(bone);
      skeleton.addToStage();
    }

    for(let i = 0; i < 5; i++){
      let rand_pos = getRandomPos();
      let skeleton2 = new Enemy(rand_pos.x/32, rand_pos.y/32, 4, "skeleton2", 4, "enemy", "Angry skeleton", "./images/skeleton2_port.png");
      skeleton2.stat.dexterity = 30;
      skeleton2.x = rand_pos.x/32;
      skeleton2.y = rand_pos.y/32;
      skeleton2.setHealth(30);
      skeleton2.setMagic(0);
      skeleton2.equipItem(rusty_sword);
      skeleton2.addToStage();
    }

    for(let i = 0; i < 3; i++){
      let rand_pos = getRandomPos();
      let dragon = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "dummy", 4, "enemy", "Red fire dragon", "./images/dragon_port.png");
      dragon.stat.dexterity = 5;
      dragon.rangedR = dragon.fovRadius;
      dragon.x = rand_pos.x/32;
      dragon.y = rand_pos.y/32;
      dragon.setHealth(45);
      dragon.setMagic(3);
      dragon.equipItem(dragon_claws);
      dragon.equipItem(fireball_sp);
      dragon.addToStage();
    }

    emitter = stage.add.emitter(0, 0, 20);
    emitter.makeParticles('t_hit');
    emitter.gravity = 200;

    death_effect = stage.add.emitter(0, 0, 500);
    death_effect.makeParticles("t_hit");
    death_effect.gravity = 0;

    death_effect.setYSpeed(-40, 10);
	  death_effect.setXSpeed(-15, 15);

    // INPUTS
    // enabled ranged mode
    rKey = stage.input.keyboard.addKey(Phaser.Keyboard.R);

    rKey.onDown.add(function(){
      player.changeActiveWeapon();
    }, this);
    // player movement animation
    // player.sprite.animations.add('left', [4, 5, 6, 7], 10, true);
    // player.sprite.animations.add('right', [8, 9, 10, 11], 10, true);
    // player.sprite.animations.add('up', [12, 13, 14, 15], 10, true);
    // player.sprite.animations.add('down', [0, 1, 2, 3], 10, true);
}

function update(){
  emitter.forEachAlive(function(p){	p.tint = 0xCC1100;	p.alpha= p.lifespan / emitter.lifespan;	});
  death_effect.forEachAlive(function(p){	p.tint = 0x333333;	p.alpha= p.lifespan / emitter.lifespan;	});
}

function render(){
}
