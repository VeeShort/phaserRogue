'use strict';

class Enemy extends Player {
    constructor(
        x,
        y,
        z_index,
        texture_path,
        fovRadius,
        name,
        hero_name,
        portrait
    ) {
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
    collectEnemies() {
        enemies.push(this);
    }

    detectPlayer() {
        if (this.fov.length > 0) {
            for (let i = 0; i < this.fov.length; i++) {
                if (this.fov[i].x == player.x && this.fov[i].y == player.y) {
                    if (
                        this.equiped['main_hand'] &&
                        this.magic >= this.equiped['main_hand'].manaCost &&
                        this.equiped['main_hand'].type == 'melee' &&
                        this.meleeR <
                            Math.floor(
                                Math.sqrt(
                                    Math.pow(player.x / 32 - this.x / 32, 2) +
                                        Math.pow(player.y / 32 - this.y / 32, 2)
                                )
                            )
                    ) {
                        this.changeActiveWeapon();
                    } else if (
                        this.equiped['main_hand'] &&
                        this.equiped['main_hand'].type == 'ranged' &&
                        this.magic < this.equiped['main_hand'].manaCost
                    ) {
                        this.changeActiveWeapon();
                    }

                    this.targetFound = true;
                    // gameIsPaused = true;
                    // player.removeWholePath();
                    break;
                } else {
                    this.targetFound = false;
                    this.hasActiveSigns = false;
                }
            }
        }
    }
}
