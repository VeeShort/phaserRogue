'use strict';

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
        case "destructible":
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
