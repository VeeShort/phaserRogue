'use strict';

class Chest extends Tile{
  constructor(x, y, z_index, texture_path, name, loot){
    super(x, y, z_index, texture_path, name);
    this.loot = loot;
  }
};
