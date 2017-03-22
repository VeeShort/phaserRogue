'use strict';

class Armor extends Item{
  constructor(name, price, weight, description, icon, type, armorValue, equipable, slot, itemIcon, lootIcon){
    super(name, price, weight, description, icon);
    this.equipable = equipable;
    this.slot = slot;
    this.armorValue = armorValue;
    this.type = type;
    this.itemIcon = itemIcon;
    this.lootIcon = lootIcon;
  }
};
