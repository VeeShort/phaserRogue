'use strict';

function detectStateChange(tile) {
  if (tile && tile.name != "player" && tile.sprite) {
    switch (tile.state) {
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

function updateUI(player, target) {
  // update player HP
  if (target.name == "player") {
    var hp = $("#health");
    var hp_c = $("#health_container");
    $("#current-hp").text(target.health);
    hp.width(target.health * hp_c.width() / target.maxHealth);
  } else {
    // update player MP
    var mp = $("#magic");
    var mp_c = $("#magic_container");
    $("#current-mp").text(player.magic);
    mp.width(player.magic * mp_c.width() / player.maxMagic);

    // update enemy HP
    var hp = $("#en-health");
    var hp_c = $("#en-health_container");
    $("#en-current-hp").text(target.health);
    hp.width(target.health * hp_c.width() / target.maxHealth);
  }
}

function updateLog(message) {
  $(".log-container").append($("<p/>", {
    text: message,
    class: "log-message"
  }));
  if ($(".log-container").children().length > 5) {
    $(".log-container p").first().remove();
  }
}

function sortInvByName(){
  let inv = player.inventory.container;
  inv.sort(function(a, b){
    var nameA = a.name.toLowerCase(), nameB=b.name.toLowerCase();
    if (nameA > nameB) //sort string ascending
    return 1;
    if (nameA < nameB)
    return -1;
    return 0; //default return value (no sorting)
  });
  player.inventory.sorted.by = "name";
  player.inventory.sorted.oreder = "ascending";

  updateInvInfo();
}

function updateInvInfo() {
  let inv = player.inventory.container;
  for(let i = 0; i < inv.length; i++){
    if(inv[i]){
      $("#inv-"+i).css("background", "url('"+inv[i].icon+"')").css("background-size", "cover");
      if(!inv[i].isEquiped){
        $("#inv-"+i).removeClass("isEquiped")
      }
      if(inv[i].isEquiped){
        $("#inv-"+i).addClass("isEquiped");
      }
      if(!inv[i].icon){
        inv[i].icon = "./images/icons/noico.png";
      }
    }else{
      $("#inv-"+i).css("background", "transparent");
      $("#inv-"+i).removeClass("isEquiped")
    }
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

  this.clear = function() {
    window.clearTimeout(timerId);
    remaining = 0;
  };

  this.resume();
}

function countStep() {
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

function getRandomPos() {
  let rand_pos;
  while (rand_pos === undefined) {
    let point = all_sprites[getRandomInt(0, all_sprites.length - 1)];
    if (point && point.name &&
        point.name != "collision" &&
        point.name != "door_closed" &&
        point.name != "destructible" &&
        collision_map.indexOf(point) == -1 &&
        point.x != player.x &&
        point.y != player.y) {
      let d = 0;
      for(let i = 0; i < doors.length; i++){
        if(doors[i].x != point.x && doors[i].y != point.y){
          d++;
        }
      }
      if(d == doors.length){
        rand_pos = {
          x: point.x,
          y: point.y
        };
      }
    }
  }

  return rand_pos;
}

function updateMiniMap() {
  let scale = c.canvas.width / Dungeon.map_size;
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  for (let i = 0; i < all_sprites.length; i++) {
    if (all_sprites[i].name && all_sprites[i].state != 0) {
      if (all_sprites[i].name && all_sprites[i].name == "floor" && all_sprites[i].state == 2) {
        c.fillStyle = "#fff";
        c.fillRect((all_sprites[i].x / 32) * scale, (all_sprites[i].y / 32) * scale, 32 / scale, 32 / scale);
      }
      if (all_sprites[i].name && all_sprites[i].name == "floor" && all_sprites[i].state == 1) {
        c.fillStyle = "#333";
        c.fillRect((all_sprites[i].x / 32) * scale, (all_sprites[i].y / 32) * scale, 32 / scale, 32 / scale);
      }
      if (all_sprites[i].name == "door_closed" || all_sprites[i].name == "door_opened") {
        c.fillStyle = "#893a02";
        c.fillRect((all_sprites[i].x / 32) * scale, (all_sprites[i].y / 32) * scale, 32 / scale, 32 / scale);
      }
      c.fillStyle = "#2b8e1d";
      c.fillRect((player.x / 32) * scale, (player.y / 32) * scale, 32 / scale, 32 / scale);
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
    var map = new ROT.Map.Digger(
      this.map_size, this.map_size, {
      roomWidth: [4,6],
      roomHeight: [4, 6],
      timeLimit: 4000
    }
  );
    var freeCells = [];

    var digCallback = function(x, y, value) {
      if (value) {
        var key = x + "," + y;
        this.map[key] = 0;
        return;
      }

      var key = x + "," + y;
      this.map[key] = 1;
      freeCells.push(key);
    }

    map.create(digCallback.bind(this));

    this._generateBoxes(freeCells);

    this._drawWholeMap();
    console.log("seed:", ROT.RNG.getSeed());

    var drawDoor = function(x, y) {
      let door = new Tile(x, y, 2, 'door_c', 'door_closed');
      doors.push(door);
      collision_map.push(door);
    }

    var rooms = map.getRooms();
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
      if (this.map[key] == 1 || this.map[key] == "*") {
        let chance = getRandomInt(1, 100);
        let floor;
        if (chance <= 80) {
          floor = new Tile(x, y, 2, 't_floor', "floor");
        } else {
          floor = new Tile(x, y, 2, 't_floor2', "floor");
        }
        sprite_map.push(floor);

        // let barrel;
        // if(this.map[key] == "brl"){
        //   barrel = new Tile(x, y, 2, 'barrel_wood', "floor");
        //   sprite_map.push(barrel);
        // }
        // floor.addToStage();
      } else {
        let chance = getRandomInt(1, 100);
        let wall_01;
        if (chance <= 80) {
          wall_01 = new Tile(x, y, 2, 't_wall', "collision");
        } else {
          wall_01 = new Tile(x, y, 2, 't_wall2', "collision");
        }
        collision_map.push(wall_01);
        wall_01.sprite.inputEnabled = false;
        // wall_01.addToStage();
        grid.setWalkableAt(x, y, false);
      }
      if (this.map[x + "," + y] == 1 &&
        this.map[(x - 1) + "," + y] == 0 &&
        this.map[x + "," + (y - 1)] == 0 &&
        this.map[(x + 1) + "," + y] == 1 &&
        this.map[x + "," + (y + 1)] == 1 &&
        this.map[(x - 1) + "," + (y - 1)] == 0 &&
        this.map[(x + 1) + "," + (y + 1)] == 1 ||

        this.map[x + "," + y] == 1 &&
        this.map[(x - 1) + "," + (y - 1)] == 0 &&
        this.map[x + "," + (y - 1)] == 0 &&
        this.map[(x + 1) + "," + (y - 1)] == 0 &&
        this.map[x + "," + (y + 1)] == 1 &&
        this.map[(x + 1) + "," + (y + 1)] == 1 &&
        this.map[(x - 1) + "," + (y + 1)] == 1 ||

        this.map[x + "," + y] == 1 &&
        this.map[(x - 1) + "," + (y + 1)] == 0 &&
        this.map[x + "," + (y + 1)] == 0 &&
        this.map[(x + 1) + "," + (y + 1)] == 0 &&
        this.map[x + "," + (y - 1)] == 1 &&
        this.map[(x + 1) + "," + (y - 1)] == 1 &&
        this.map[(x - 1) + "," + (y - 1)] == 1 ||

        this.map[x + "," + y] == 1 &&
        this.map[(x + 1) + "," + y] == 0 &&
        this.map[x + "," + (y - 1)] == 0 &&
        this.map[(x - 1) + "," + y] == 1 &&
        this.map[x + "," + (y + 1)] == 1 &&
        this.map[(x + 1) + "," + (y - 1)] == 0 &&
        this.map[(x - 1) + "," + (y + 1)] == 1 ||

        this.map[x + "," + y] == 1 &&
        this.map[(x + 1) + "," + y] == 0 &&
        this.map[x + "," + (y - 1)] == 0 &&
        this.map[(x - 1) + "," + y] == 1 &&
        this.map[x + "," + (y + 1)] == 1 &&
        this.map[(x + 1) + "," + (y - 1)] == 0 &&
        this.map[(x - 1) + "," + (y + 1)] == 1
      ) {
        if (getRandomInt(1, 100) <= 70) {
          if (getRandomInt(1, 100) <= 30) {
            let barrel = new Tile(x, y, 3, "barrel_wood" + getRandomInt(1, 4), "destructible");
            collision_map.push(barrel);
            all_sprites.push(barrel);
            grid.setWalkableAt(x, y, true);
          }
        } else {
          if (getRandomInt(1, 100) <= 30) {
            let table = new Tile(x, y, 3, "table_wood" + getRandomInt(1, 2), "destructible");
            collision_map.push(table);
            all_sprites.push(table);
            grid.setWalkableAt(x, y, true);
          }
        }
      }
    }
  }

};
