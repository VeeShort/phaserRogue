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

    // particles
    stage.load.image("t_hit", "./images/hit_particle.png");
    stage.load.image("t_destr", "./images/destr_particle.png");
    stage.load.image("pl_dead", "./images/pl_dead.png");

    stage.load.image("loot", "./images/loot.png");
    stage.load.image("skeleton", "./images/skeleton.png");
    stage.load.image("skeleton2", "./images/skeleton_2.png");
    stage.load.image("dark_wizard", "./images/dark_wizard.png");
    stage.load.image("door_c", "./images/door_c.png");
    stage.load.image("door_o", "./images/door_o.png");
    stage.load.image("loot", "./images/loot.png");

    // destructible
    stage.load.image("barrel_wood1", "./images/barrel_wood1.png");
    stage.load.image("barrel_wood2", "./images/barrel_wood2.png");
    stage.load.image("barrel_wood3", "./images/barrel_wood3.png");
    stage.load.image("barrel_wood4", "./images/barrel_wood4.png");
    stage.load.image("table_wood1", "./images/table_wood1.png");
    stage.load.image("table_wood2", "./images/table_wood2.png");
    stage.load.image("destr_wood1", "./images/destr_wood1.png");
    stage.load.image("destr_wood2", "./images/destr_wood2.png");
    stage.load.image("destr_wood3", "./images/destr_wood3.png");

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

    // destruction audio
    stage.load.audio('destr1', "./sound/destr1.wav");
    stage.load.audio('destr2', "./sound/destr2.wav");
    stage.load.audio('destr3', "./sound/destr3.wav");
}


function create() {
    grid = new PF.Grid(Dungeon.map_size, Dungeon.map_size);

    stage.world.setBounds(-Dungeon.map_size*32, -Dungeon.map_size*32, Dungeon.map_size*32*4, Dungeon.map_size*32*4);

    gr_map = stage.add.group();
    gr_items = stage.add.group();
    gr_players = stage.add.group();


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
  // destruct_wood.forEachAlive(function(p){	p.tint = 0x633C14; p.alpha = p.lifespan/emitter.lifespan; });
  death_effect.forEachAlive(function(p){ p.tint = 0x333333; p.alpha = p.lifespan/emitter.lifespan; });
}

function render(){
}
