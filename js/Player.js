'use strict';

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
    this.movePath = undefined;

    this.health = undefined;
    this.maxHealth = undefined;

    this.magic = undefined;
    this.maxMagic = undefined;

    this.stat = {
      dexterity: 20,
      luck: 50
    }

    this.sign;
    this.moved = false;
    this.fovLines = 64;
    this.hero_name = hero_name;
    this.inRangedCombat = false;
    this.activeWeapon = undefined;

    this.inventory = {
      container: [],
      maxLength: 30
    };

    this.equiped = {
      main_hand: undefined,
      off_hand: undefined,
      chest: undefined,
      wrist: undefined,
      boots: undefined,
      waist: undefined,
      pants: undefined,
      helm: undefined
    };

    this.hasActiveSigns = false;
  }

  destroyProp(){
    for(let j = 0; j < this.fov.length; j++){
      if(this.fov[j].name == "destructible" && this.fov[j].x == this.x && this.fov[j].y == this.y){

        this.fov[j].sprite.loadTexture("destr_wood"+getRandomInt(1,3) ,0);
        this.fov[j].name = "floor";
        // let destr_dummy = new Tile(this.fov[j].x/this.fov[j].tile_size.w, this.fov[j].y/this.fov[j].tile_size.h, "destr_wood"+getRandomInt(1,3), "collision");

        destruct_wood = stage.add.emitter(0, 0, 20);
        destruct_wood.makeParticles('t_destr');
        destruct_wood.gravity = 150;

        // position the hit particles on destructible object
        destruct_wood.x = this.fov[j].x + this.fov[j].tile_size.w/2;
        destruct_wood.y = this.fov[j].y + this.fov[j].tile_size.h/2;
        // start to draw destruction particles
        destruct_wood.start(true, 250, null, 20);

        let destr = stage.add.audio("destr"+getRandomInt(1,3));
        destr.play();
      }
    }
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
    this.inventory.container.push(item);
    updateInvInfo();
  }

  equipItem(item){
    if(item.equipable){
      let dummyItem = item;
      this.equiped[item.slot] = dummyItem;
      if(dummyItem.slot == "main_hand"){
        this.activeWeapon = dummyItem;
      }
      dummyItem.isEquiped = true;
      // updateUI (inventory)
      updateInvInfo();
    }
  }

  lootItems(){
    if(!this.disableControl){
      for(let i = 0; i < lootArr.length; i++){
        if(this.x == lootArr[i].x && this.y == lootArr[i].y){
          for(let j = 0; j < lootArr[i].loot.length; j++){
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

  getRandomLoot(){
    let loot = [];
    let totalToLoot = getRandomInt(1, Object.keys(this.equiped).length); // total number of looted items
    let itemsToLoot = [];
    itemsToLoot.push(getRandomInt(1, totalToLoot)); // numbers of items to loot
    let currentLoot = undefined;

    while(itemsToLoot.length < totalToLoot){
      currentLoot = getRandomInt(1, totalToLoot);
      if(!itemsToLoot.includes(currentLoot))
        itemsToLoot.push(currentLoot);
    }

    let i = 0;
    for(let currentLoot in this.equiped){
      i++;
      if(itemsToLoot.includes(i) && this.equiped[currentLoot]){
        this.equiped[currentLoot].isEquiped = false;
        loot.push(this.equiped[currentLoot]);
      }
    }
    console.log("loot:", loot);
    return loot;
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

      // start to draw hit particles
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
          if(getRandomInt(0, 100) <= this.stat.luck){
            let loot_chest = new Chest(target.x/this.tile_size.w, target.y/this.tile_size.h, 3, "loot", "loot", target.getRandomLoot());
            loot_chest.state = 2;
            detectStateChange(loot_chest);
            lootArr.push(loot_chest);
            this.fov.push(loot_chest);
          }

          // target.sprite.destroy();
          gr_players.remove(target.sprite);
          dead.play();
          grid.setWalkableAt(target.x/target.tile_size.w, target.y/target.tile_size.h, true);

          for(let z in en_priority){
            if(en_priority[z].portrait && en_priority[z].health <= 0){
              $("#en-l-"+z).next("div").remove();
              $("#en-l-"+z).remove();
            }
          }

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
    let finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: false
    });
    let path = finder.findPath(Math.floor(this.x/this.tile_size.w), Math.floor(this.y/this.tile_size.h), Math.floor(px/this.tile_size.w), Math.floor(py/this.tile_size.h), grid.clone());
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
          if(cm && cm.name == "destructible"){
            this.fov.push(cm);
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
