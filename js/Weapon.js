'use strict';

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
    this.isEquiped = false;
    this.rarity = obj.rarity;
    this.aditionalDmgTo = obj.aditionalDmgTo;
  }
};
