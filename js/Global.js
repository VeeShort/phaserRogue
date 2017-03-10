'use strict';

var upKey;
var downKey;
var leftKey;
var rightKey;

let renderer;
let canvas;
let target_sp;
let mc;

let en_priority = []; // list of enemies that agro to you at the moment (updates dynamicaly)

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
let alert_s, pl_hit, en_hit, fire_hit, curse_hit, dead, pl_dead, game_over, miss, bad_hit, dooropened, doorclosed,
    hit_collision;

let player_health, player_health_bg, pl_health_con = [];
// PARTICLES
let emitter, death_effect, destruct_wood;

let aimLine = {
  lineObj: undefined,
  angle: undefined,
  x1: undefined,
  y1: undefined,
  xo: undefined,
  yo: undefined,
  l: undefined
};

let equipedSprites = {
  helm: undefined,
  chest: undefined,
  boots: undefined,
  gloves: undefined,
  main_hand: undefined
}

// KEYS
let rKey, spaceKey;

//CLASSES
let isMage = false;
let isWarrior = false;

let gr_map, gr_players, gr_items,
  gr_playerItems;

// creating stage
let stage = new Phaser.Game(608, 608, Phaser.AUTO, 'main-scene', { preload: preload, create: create, update: update, render: render });

// minimap
let minimap = document.getElementById("minimap");
let c = minimap.getContext("2d");
c.canvas.width = 209;
c.canvas.height = 209;

let iron_sword, iron_boots;
