'use strict';

let renderer;
let canvas;
let target_sp;
let mc;

let chest_inv = document.getElementById("container");

let Dungeon;

let player;

let sprite_map = [];
let collision_map = [];
let item_map = [];
let all_sprites = [];
let doors = [];
let lootArr = [];

let smArr = [];
let cmArr = [];
let lmArr = [];

let moveTimer;

let grid;
let enemies = [];
let step_count = 0;
let gameIsPaused = false;

// SOUNDS
let alert_s, pl_hit, en_hit, fire_hit, curse_hit, dead, pl_dead, game_over, miss, bad_hit,
    dooropened, doorclosed;

let player_health, player_health_bg, pl_health_con = [];
// PARTICLES
let emitter, death_effect;

// KEYS
let rKey, spaceKey;

//CLASSES
let isMage = false;
let isWarrior = false;

// let g = new PIXI.Graphics();
let gr_map, gr_players, gr_items;
// creating stage
let stage = new Phaser.Game(608, 608, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

// minimap
let minimap = document.getElementById("minimap");
let c = minimap.getContext("2d");
c.canvas.width = 209;
c.canvas.height = 209;

let iron_sword, iron_boots;

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

    // this.sprite = stage.add.sprite(this.x, this.y, this.texture_path);
    this.addToStage();
    this.sprite.inputEnabled = true;

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
    if(this.name){
      switch(this.name){
        case "player":
          this.sprite = gr_players.create(this.x, this.y, this.texture_path);
        break;
        case "enemy":
          this.sprite = gr_players.create(this.x, this.y, this.texture_path);
        break;
        case "floor":
          this.sprite = gr_map.create(this.x, this.y, this.texture_path);
        break;
        case "collision":
          this.sprite = gr_map.create(this.x, this.y, this.texture_path);
        break;
        case "door_closed":
          this.sprite = gr_items.create(this.x, this.y, this.texture_path);
        break;
        case "door_opened":
          this.sprite = gr_items.create(this.x, this.y, this.texture_path);
        break;
        case "loot":
          this.sprite = gr_items.create(this.x, this.y, this.texture_path);
        break;
      }
    }
    // stage.add.sprite(this.sprite);
  }

  tileOnClick(){
    let self = this;
    this.sprite.events.onInputDown.add(function(result){
      if(self.state != 0 && !player.disableControl){
        gameIsPaused = false;
        if(this.name && this.name != "enemy" && this.name != "player"){
          doStep(player.moveToPoint(this.x, this.y));
        }
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
  constructor(x, y, z_index, texture_path, name, loot){
    super(x, y, z_index, texture_path, name);
    this.loot = loot;
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
    this.fovLines = 64;
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

  giveItem(item){
    this.inventory.push(item);
    updateInvInfo();
  }

  equipItem(item){
    if(item.equipable){
      this.equiped[item.slot] = item;
      if((item.type == "melee" || item.type == "ranged") && item.slot == "main_hand"){
        this.activeWeapon = item;
      }

      // updateUI
      if(this.name == "player" && item.type == "armor")
        $("#"+item.slot).css("background", "url("+item.icon+")").css("background-color", "#009688");
      if((item.type == "melee" || item.type == "ranged") && this.name === "player"){
        $("#"+item.slot).css("background", "url("+item.icon+")").css("background-color", "#009688");
      }
    }
  }

  lootItems(){
    if(!this.disableControl){
      for(let i = 0; i < lootArr.length; i++){
        if(this.x == lootArr[i].x && this.y == lootArr[i].y){
          for(let j in lootArr[i].loot){
            this.giveItem(lootArr[i].loot[j]);
          }
          updateInvInfo();
          lootArr[i].sprite.destroy();
          lootArr.splice(i, 1);
          if($(".on-loot").is(":visible")) $(".on-loot").hide();
        }
      }
    }
  }

  centerCamera(){
    stage.camera.x = this.x - 608/2 + this.tile_size.w/2 ;
    stage.camera.y = this.y - 608/2 + this.tile_size.h/2;
  }

  removePathAfter(path_length){
    if(this.player_path_map[path_length-1] && this.x == this.player_path_map[path_length-1].x/this.tile_size.w && this.y == this.player_path_map[path_length-1].y/this.tile_size.h)
      this.player_path_map[path_length-1].sprite.destroy();
  }

  removeWholePath(){
    for(let i in this.player_path_map){
      this.player_path_map[i].sprite.destroy();
    }
  }

  changeActiveWeapon(){
    if(this.equiped["main_hand"] == this.activeWeapon && this.equiped["off_hand"] && (this.equiped["off_hand"].type == "melee" || this.equiped["off_hand"].type == "ranged") ){
      this.activeWeapon = this.equiped["off_hand"];
      // this.equiped["off_hand"] = this.activeWeapon;
      if(this.name == "player"){
        $("#pl-weapon").text(this.activeWeapon.name+" ["+this.activeWeapon.minDamage+"-"+this.activeWeapon.maxDamage+"]");
        $("#pl-"+this.activeWeapon.slot).text(this.activeWeapon.name+" ["+this.activeWeapon.minDamage+"-"+this.activeWeapon.maxDamage+"]");
      }
    }else if(this.equiped["off_hand"] == this.activeWeapon && this.equiped["main_hand"]){
      this.activeWeapon = this.equiped["main_hand"];
      // this.equiped["main_hand"] = this.activeWeapon;
      if(this.name == "player"){
        $("#pl-weapon").text(this.activeWeapon.name+" ["+this.activeWeapon.minDamage+"-"+this.activeWeapon.maxDamage+"]");
        $("#pl-"+this.activeWeapon.slot).text(this.activeWeapon.name+" ["+this.activeWeapon.minDamage+"-"+this.activeWeapon.maxDamage+"]");
      }
    }else{
      return false;
    }
  }

  checkHitAvailability(target){
    if(this.activeWeapon.type == "melee" && this.activeWeapon.manaCost <= this.magic){
      if(((target.sprite.x == this.sprite.x) && (target.sprite.y == this.sprite.y + this.tile_size.h))||                    // target is on top
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

      // show enemy when he attacks you from the shadow
      if(this.name == "enemy" || this.state != 2){
        this.state = 2;
        detectStateChange(this);
      }
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
        case "curse":
          curse_hit.play();
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

      if(target.name == "enemy"){
        target.fov.push(this.sprite);
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

          // spawn loot
          let loot_chest = new Chest(target.x/this.tile_size.w, target.y/this.tile_size.h, 3, "loot", "loot", {
            iron_sword,
            iron_boots
          });
          loot_chest.state = 2;
          detectStateChange(loot_chest);
          lootArr.push(loot_chest);

          this.fov.push(loot_chest);

          // target.sprite.destroy();
          gr_players.remove(target.sprite);
          dead.play();
          grid.setWalkableAt(target.x/target.tile_size.w, target.y/target.tile_size.h, true);

          var z = enemies.indexOf(target);
          if(z != -1) {
            enemies.splice(z, 1);
          }
          $(".container.target").css("opacity", 0);
        }
      }

      // count current hit attempt as step
      if(this.name == "player")
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
    for(let i = 0; i < enemies.length; i++){
      if(sm && sm.x == enemies[i].x && sm.y == enemies[i].y && this.name == "player"){
        enemies[i].state = 2;
        detectStateChange(enemies[i]);
      }
    }
  }

  moveToPoint(px, py){
    // for(let i in this.player_path_map){
    //   this.player_path_map[i].sprite.destroy();
    // }
    // this.player_path_map = [];

    let finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: false
    });
    let path = finder.findPath(Math.floor(this.x/this.tile_size.w), Math.floor(this.y/this.tile_size.h), Math.floor(px/this.tile_size.w), Math.floor(py/this.tile_size.h), grid.clone());

    // if(path.length > 0 && this.name == "player"){
    //   for(let i = 1; i < path.length; i++){
    //     let pt = new Tile(path[i][0], path[i][1], 4, "t_path", "path");
    //     pt.sprite.inputEnabled = false;
    //     pt.state = 2;
    //     detectStateChange(pt);
    //     this.player_path_map.push(pt);
    //   }
    // }

    // if(this.name == "player" && path.length > 1){
    //   doStep(path);
    // }
    if(path.length > 1)
      return path;
  }



  doFOV(){
    // check if player is in enemy's fov radius
    if( this.name == "enemy" && this.fovRadius*this.tile_size.w < Math.sqrt((player.x - this.x)*(player.x - this.x) + (player.y - this.y)*(player.y - this.y)) ){
      return false;
    }
    this.fov = [];

    for(let ray = 0; ray < this.fovLines; ray++)
  	{
      let x = Math.cos(ray * 360/this.fovLines*Math.PI/180);
      let y = Math.sin(ray * 360/this.fovLines*Math.PI/180);

      let ox = this.x + this.tile_size.w/2;
      let oy = this.y + this.tile_size.h/2;

      // console.log("ox:", ox, "oy:", oy);

      for(let i = 0; i < this.tile_size.w*this.fovRadius; i++){
        let sm = smArr[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];
        let cm = cmArr[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];
        // let lm = lmArr[Math.floor(ox/this.tile_size.w)][Math.floor(oy/this.tile_size.h)];

        // looking for an enemy
        if(this.name == "player"){
          this.lookForPlayer(sm);

          if(sm && sm.state != 2){
            sm.state = 2;
            detectStateChange(sm);
            this.fov.push(sm);
            // console.log("sm", sm);
          }
          if(cm && cm.state != 2){
            cm.state = 2;
            detectStateChange(cm);
            this.fov.push(cm);
          }
        }

        if(this.name == "enemy"){
          if(sm && sm.name){
            this.fov.push(sm);
            this.fov = unique(this.fov);
          }
        }

        if(cm && cm.name && (cm.name == "collision" || cm.name == "door_closed")){
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
      for(let i = 0; i < this.fov.length; i++){
        for(let j = 0; j < enemies.length; j++){
          if(this.fov[i].x != enemies[j].x && this.fov[i].y != enemies[j].y){
            enemies[j].state = 0;
            detectStateChange(enemies[j]);
          }
        }
        this.fov[i].state = 1;
        detectStateChange(this.fov[i]);
      }
    }
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
    this.portrait = portrait;
    this.counter = 1;

    this.collectEnemies();
    this.doFOV();
    this.detectPlayer();
  }

  // push all created enemies to the enemy array
  collectEnemies(){
    enemies.push(this);
  }

  detectPlayer(){
    if(this.fov.length > 0){
      for(let i = 0; i < this.fov.length; i++){
        if(this.fov[i].x == player.x && this.fov[i].y == player.y){
          // console.log(this.meleeR, Math.floor(Math.sqrt(Math.pow(((player.sprite.x)/32 - (this.sprite.x)/32),2) + Math.pow(((player.sprite.y)/32 - (this.sprite.y)/32),2))));
          if(this.activeWeapon && this.magic >= this.activeWeapon.manaCost && this.activeWeapon.type == "melee" &&
             this.meleeR < Math.floor(Math.sqrt(Math.pow(((player.x)/32 - (this.x)/32),2) + Math.pow(((player.y)/32 - (this.y)/32),2)))){
            this.changeActiveWeapon();
          }else if(this.activeWeapon && this.activeWeapon.type == "ranged" && this.magic < this.activeWeapon.manaCost){
            this.changeActiveWeapon();
          }

          this.targetFound = true;
          gameIsPaused = true;
          // player.removeWholePath();
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

class Armor extends Item{
  constructor(name, price, weight, description, icon, type, armorValue, equipable, slot){
    super(name, price, weight, description, icon);
    this.equipable = equipable;
    this.slot = slot;
    this.armorValue = armorValue;
    this.type = type;
  }
};

class Weapon{
  constructor(obj){
    this.name = obj.name;
    this.price = obj.price;
    this.weight = obj.weight;
    this.description = obj.description;
    this.icon = obj.icon;
    this.type = obj.type;
    this.equipable = obj.equipable;
    this.minDamage = obj.minDamage;
    this.maxDamage = obj.maxDamage;
    this.manaCost = obj.manaCost;
    this.nature = obj.nature;
    this.slot = obj.slot;
    this.wield = obj.wield;
  }
};

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

function doStep(path){
  let i = 1;

  player.disableControl = true;
  // clearInterval(player.moveTimer);
  player.moveTimer = setInterval(function(){
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

      // let time = 0;
      for(let j = 0; j < enemies.length; j++){
        let enemy = enemies[j];
        enemy.counter = 1;
        enemy.doFOV();
        enemy.detectPlayer();
        enemy.moved = false;

        if(enemy.targetFound){

          if($(".warning").not(":visible"))
            $(".warning").css("display", "block");
          if($(".wait").is(":visible"))
              $(".wait").hide();

          clearInterval(player.moveTimer);
          player.disableControl = false;
          if(enemy.activeWeapon.type == "melee"){
            let epath = enemy.moveToPoint(player.x, player.y);

            if(epath && enemy.counter < epath.length - 1){
              grid.setWalkableAt(enemy.x/enemy.tile_size.w, enemy.y/enemy.tile_size.h, true);

              enemy.sprite.x = epath[enemy.counter][0] * enemy.tile_size.w;
              enemy.sprite.y = epath[enemy.counter][1] * enemy.tile_size.h;
              enemy.x = enemy.sprite.x;
              enemy.y = enemy.sprite.y;

              enemy.moved = true;

              grid.setWalkableAt(enemy.x/enemy.tile_size.w, enemy.y/enemy.tile_size.h, false);
              enemy.counter++;
            }
          }
          if(!enemy.moved){
            setTimeout(function(){
              enemy.hitTarget(player);
            }, 200);
          }
        }
      }

      player.setVisible();
      player.doFOV();

      if(path && i == path.length - 1 || !path){
        player.disableControl = false;
        if($(".wait").is(":visible"))
          $(".wait").hide();
        clearInterval(player.moveTimer);
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
    if(point && point.name && point.name == "floor" && point.name != "door_closed" && point.x != player.x && point.y != player.y){
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
    stage.load.image('t_alert', "./images/alert.png");
    stage.load.image("t_hit", "./images/hit_particle.png");
    stage.load.image("pl_dead", "./images/pl_dead.png");
    stage.load.image("loot", "./images/loot.png");
    stage.load.image("skeleton", "./images/skeleton.png");
    stage.load.image("skeleton2", "./images/skeleton_2.png");
    stage.load.image("dark_wizard", "./images/dark_wizard.png");
    stage.load.image("door_c", "./images/door_c.png");
    stage.load.image("door_o", "./images/door_o.png");
    stage.load.image("loot", "./images/loot.png");

    //AUDIO
    stage.load.audio('game_over', "./sound/ascending.mp3");
    stage.load.audio('alert', "./sound/alert.wav");
    stage.load.audio('pl_hit', "./sound/pl_hit.wav");
    stage.load.audio('en_hit', "./sound/en_hit.wav");
    stage.load.audio('fire_hit', "./sound/fire.wav");
    stage.load.audio('curse_hit', "./sound/curse.wav");
    stage.load.audio('dead', "./sound/dead.wav");
    stage.load.audio('pl_dead', "./sound/pl_dead.wav");
    stage.load.audio('miss', "./sound/miss.wav");
    stage.load.audio('bad_hit', "./sound/bad_hit.wav");
    stage.load.audio('dooropened', "./sound/dooropened.wav");
    stage.load.audio('doorclosed', "./sound/doorclosed.wav");
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
    // for (var i=0;i<10;i++) {
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
    }
  }

};

function create() {
    grid = new PF.Grid(Dungeon.map_size, Dungeon.map_size);

    stage.world.setBounds(-Dungeon.map_size*32, -Dungeon.map_size*32, Dungeon.map_size*32*4, Dungeon.map_size*32*4);

    gr_map = stage.add.group();
    gr_items = stage.add.group();
    gr_players = stage.add.group();

    console.log("map:", gr_map.z, "items:", gr_items.z, "players:", gr_players.z);

    Dungeon.init();

    for(let i = 0; i < Dungeon.map_size; i++){
      smArr[i] = [];
      cmArr[i] = [];
      for(let j = 0; j < Dungeon.map_size; j++){
        for(let s in sprite_map){
          if(sprite_map[s].x/32 == i && sprite_map[s].y/32 == j){
            smArr[i][j] = sprite_map[s];
            // continue;
          }
        }
        for(let c in collision_map){
          if(collision_map[c].x/32 == i && collision_map[c].y/32 == j){
            cmArr[i][j] = collision_map[c];
            // continue;
          }
        }
      }
    }

    for(let i in sprite_map){
      all_sprites.push(sprite_map[i]);
    }
    for(let i in collision_map){
      all_sprites.push(collision_map[i]);
    }


    // // SOUNDS
    alert_s = stage.add.audio('alert');
    en_hit = stage.add.audio('en_hit');
    pl_hit = stage.add.audio('pl_hit');
    bad_hit = stage.add.audio('bad_hit');
    miss = stage.add.audio('miss')
    fire_hit = stage.add.audio("fire_hit");
    curse_hit = stage.add.audio("curse_hit");
    dead = stage.add.audio('dead');
    pl_dead = stage.add.audio('pl_dead');
    game_over = stage.add.audio('game_over');
    dooropened = stage.add.audio('dooropened');
    doorclosed = stage.add.audio('doorclosed');

    // target_sp = new Phaser.Sprite();
    // stage.add.sprite(target_sp);

    // // ITEMS
    // WEAPONS
    // name, price, weight, description, icon, damage, type, mana cost, equipable
    let dragon_claws = new Weapon({
      name: "Dragon Claws",
      price: 0,
      weight: 0,
      description: "These are very sharp",
      icon: undefined,
      minDamage: 7,
      maxDamage: 10,
      type: "melee",
      manaCost: 0,
      nature: "default",
      equipable: true,
      slot: "main_hand"
    });

    let bone = new Weapon({
      name: "Bone fists",
      price: 0,
      weight: 0,
      description: "Skeletons have these",
      icon: undefined,
      minDamage: 1,
      maxDamage: 3,
      type: "melee",
      manaCost: 0,
      nature: "default",
      equipable: true,
      slot: "main_hand"
    });

    iron_sword = new Weapon({
      name: "Iron Sword",
      price: 0,
      weight: 0,
      description: "Regular iron sword for killing stuff",
      icon: "./images/icons/weapon/iron_sword.png",
      minDamage: 10,
      maxDamage: 15,
      type: "melee",
      manaCost: 0,
      nature: "default",
      equipable: true,
      slot: "main_hand"
    });

    let rusty_sword = new Weapon({
      name: "Rusty Sword",
      price: 0,
      weight: 0,
      description: "Ancient sword covered with rust",
      icon: undefined,
      minDamage: 3,
      maxDamage: 6,
      type: "melee",
      manaCost: 0,
      nature: "default",
      equipable: true,
      slot: "main_hand"
    });

    let fireball_sp = new Weapon({
      name: "Sphere of Fire",
      price: 0,
      weight: 0,
      description: "Regular fireball",
      icon: undefined,
      minDamage: 13,
      maxDamage: 20,
      type: "ranged",
      manaCost: 1,
      nature: "fire",
      equipable: true,
      slot: "off_hand"
    });

    let wand_of_curse = new Weapon({
      name: "Wand of Curse",
      price: 0,
      weight: 0,
      description: "Dark wizards make this at home",
      icon: undefined,
      minDamage: 8,
      maxDamage: 10,
      type: "ranged",
      manaCost: 1,
      nature: "curse",
      equipable: true,
      slot: "main_hand"
    });

    let wizard_staff = new Weapon({
      name: "Wizard's staff",
      price: 0,
      weight: 0,
      description: "Basic wooden staff",
      icon: undefined,
      minDamage: 20,
      maxDamage: 25,
      type: "ranged",
      manaCost: 1,
      nature: "fire",
      equipable: "true",
      slot: "main_hand"
    });

    let scroll_of_fire = new Weapon({
      name: "Scroll of Fire",
      price: 0,
      weight: 0,
      description: "Old scroll",
      icon: "./images/icons/weapon/scroll_white.png",
      minDamage: 15,
      maxDamage: 23,
      type: "ranged",
      manaCost: 1,
      nature: "fire",
      equipable: "true",
      slot: "off_hand"
    });

    // ARMOR
    // name, price, weight, description, icon, type, armorValue, equipable, slot
    let iron_chest = new Armor("Iron chest", 0, 0, "Regular iron chest", "./images/icons/armor/iron_chest.png", "armor", 15, true, "chest");
    iron_boots = new Armor("Iron boots", 0, 0, "Heavy stuff", "./images/icons/armor/iron_boots.png", "armor", 5, true, "boots")
    let magic_robe = new Armor("Leather robe", 0, 0, "Wizards rule", "n/a", "armor", 5, true, "chest");
    let magic_socks = new Armor("Magic socks", 0, 0, "Stinks alot", "n/a", "armor", 3, true, "boots");
    // test
    let holy_plates = new Armor("Admin Admin", 0, 0, "Not for balance", "n/a", "armor", 80, true, "pants");

    // stage.physics.startSystem(Phaser.Physics.ARCADE);

    let plClass = "warrior";

    if(plClass != "warrior" && plClass != "wizard"){
      plClass = "warrior"
    }

    // SPAWN PLAYERS
    for(let key in Dungeon.map){
      if(Dungeon.map[key] == "*"){
        let parts = key.split(",");
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        player = new Player(x, y, 3, "pl_"+plClass, 4, "player", "Hero " + plClass);
        break;
      }
    }

    switch(plClass){
      case "warrior":
        player.setHealth(50);
        player.setMagic(5);
        player.equipItem(iron_sword);
        player.equipItem(scroll_of_fire);
        player.equipItem(iron_chest);
        player.equipItem(iron_boots);
        player.stat.dexterity = 15;
      break;
      case "wizard":
        player.setHealth(25);
        player.setMagic(25);
        player.equipItem(iron_sword);
        player.equipItem(fireball_sp);
        player.equipItem(magic_robe);
        player.equipItem(magic_socks);
        player.inRangedCombat = true;
        player.stat.dexterity = 25;
        player.fovRadius = 5;
        player.rangedR = 8;
      break;
    }

    $("#current-hp").text(player.health);
    $("#max-hp").text(player.maxHealth);

    $("#current-mp").text(player.magic);
    $("#max-mp").text(player.maxMagic);

    $("#pl-name").text(player.hero_name);

    $("#pl-weapon").text(player.activeWeapon.name+" ["+player.activeWeapon.minDamage+"-"+player.activeWeapon.maxDamage+"]");

    $("#pl-dex").text(player.stat.dexterity);
    $("#pl-arm").text(player.getTotalArmorPoints());

    for(let i = 0; i < 7; i++){
      let rand_pos = getRandomPos();
      let skeleton = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "skeleton", 4, "enemy", "Spooky skeleton", "./images/skeleton_port.png");
      skeleton.stat.dexterity = 15;
      skeleton.x = rand_pos.x;
      skeleton.y = rand_pos.y;
      skeleton.setHealth(25);
      skeleton.setMagic(0);
      skeleton.equipItem(bone);
      grid.setWalkableAt(skeleton.x/32, skeleton.y/32, false);
      // skeleton.addToStage();
    }

    for(let i = 0; i < 1; i++){
      let rand_pos = getRandomPos();
      let dark_wizard = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "dark_wizard", 6, "enemy", "Dark Wizard", "./images/dark_wizard_port.png");
      dark_wizard.stat.dexterity = 25;
      dark_wizard.x = rand_pos.x;
      dark_wizard.y = rand_pos.y;
      dark_wizard.setHealth(15);
      dark_wizard.setMagic(15);
      dark_wizard.equipItem(rusty_sword);
      dark_wizard.equipItem(wand_of_curse);
      grid.setWalkableAt(dark_wizard.x/32, dark_wizard.y/32, false);
      // dark_wizard.addToStage();
    }

    for(let i = 0; i < 5; i++){
      let rand_pos = getRandomPos();
      let skeleton2 = new Enemy(rand_pos.x/32, rand_pos.y/32, 4, "skeleton2", 4, "enemy", "Angry skeleton", "./images/skeleton2_port.png");
      skeleton2.stat.dexterity = 20;
      skeleton2.x = rand_pos.x;
      skeleton2.y = rand_pos.y;
      skeleton2.setHealth(30);
      skeleton2.setMagic(0);
      skeleton2.equipItem(rusty_sword);
      grid.setWalkableAt(skeleton2.x/32, skeleton2.y/32, false);
      // skeleton2.addToStage();
    }

    for(let i = 0; i < 2; i++){
      let rand_pos = getRandomPos();
      let dragon = new Enemy(rand_pos.x/32, rand_pos.y/32, 3, "dummy", 4, "enemy", "Red fire dragon", "./images/dragon_port.png");
      dragon.stat.dexterity = 5;
      dragon.rangedR = dragon.fovRadius;
      dragon.x = rand_pos.x;
      dragon.y = rand_pos.y;
      dragon.setHealth(45);
      dragon.setMagic(3);
      dragon.equipItem(dragon_claws);
      dragon.equipItem(fireball_sp);
      // dragon.addToStage();
    }

    emitter = stage.add.emitter(0, 0, 20);
    emitter.makeParticles('t_hit');
    emitter.gravity = 200;

    death_effect = stage.add.emitter(0, 0, 500);
    death_effect.makeParticles("t_hit");
    death_effect.gravity = 0;

    death_effect.setYSpeed(-40, 10);
	  death_effect.setXSpeed(-15, 15);

    // player.addToStage();
    player.setVisible();
    player.doFOV();
    player.centerCamera();

    // INPUTS
    // enabled ranged mode
    rKey = stage.input.keyboard.addKey(Phaser.Keyboard.R);

    rKey.onDown.add(function(){
      player.changeActiveWeapon();
    }, this);

    spaceKey = stage.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    spaceKey.onDown.add(function(){
      player.lootItems();
    }, this);
    // player movement animation
    // player.sprite.animations.add('left', [4, 5, 6, 7], 10, true);
    // player.sprite.animations.add('right', [8, 9, 10, 11], 10, true);
    // player.sprite.animations.add('up', [12, 13, 14, 15], 10, true);
    // player.sprite.animations.add('down', [0, 1, 2, 3], 10, true);

    let info = $(".info");
    $(".slot").hover(function(){
      let self = $(this);
      let container;

      if(self.parent().hasClass("slots")){
        container = player.equiped[self.attr("id")];
        for(let i in container){
          if(i != "icon" && i != "equipable" && i)
            info.append($("<span/>",{
              text: i + ": " + container[i]
            }));
        }
      }
      if(self.parent().hasClass("inventory")){
        container = player.inventory;
        for(let i in container[self.data("num")]){
          if(i != "icon" && i != "equipable" && i){
            info.append($("<span/>",{
              text: i + ": " + container[self.data("num")][i]
            }));
          }
        }
      }

      info.show();

    }, function(){
      if(info.is(":visible")){
        info.empty();
        info.hide();
      }
    });

    updateMiniMap();

}

function update(){
  emitter.forEachAlive(function(p){	p.tint = 0xCC1100; p.alpha = p.lifespan/emitter.lifespan; });
  death_effect.forEachAlive(function(p){ p.tint = 0x333333; p.alpha = p.lifespan/emitter.lifespan; });
}

function render(){
}
