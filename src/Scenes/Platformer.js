class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 3000;
        this.DRAG = 20000;    // DRAG < ACCELERATION = icy slide
        this.AIRDRAG = 4000;
        this.MAX_SPEED = 200;
        this.physics.world.gravity.y = 2000;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 40;
        this.SCALE = 2.0;
        this.STEP_TIME = 15;
    }

    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', "animatedTiles", "animatedTiles");
    
        this.load.setPath('./assets/Audio_Impacts/');
        this.load.audio('step', 'footstep_grass_000.ogg');
        this.load.audio('land', 'impactSoft_medium_001.ogg');
        this.load.audio('key', 'impactMining_001.ogg');
        this.load.audio('door', 'impactWood_light_003.ogg');

        this.load.setPath('./assets/Audio_Interface');
        this.load.audio('jump', 'drop_001.ogg')
        this.load.audio('spring', 'drop_004.ogg');
        this.load.audio('death', 'error_007.ogg');
        this.load.audio('coin', 'glass_004.ogg');
        this.load.audio('win', 'minimize_009.ogg');
        this.load.audio('speak', 'toggle_001.ogg');
        this.load.audio('chest', 'question_003.ogg');
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 144, 27);

        // begin animation
        this.animatedTiles.init(this.map);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 21
        });

        this.spawn = this.map.createFromObjects("Objects", {
            name: "spawn",
            key: "tilemap_sheet",
            frame: 0
        });

        this.springs = this.map.createFromObjects("Objects", {
            name: "spring",
            key: "tilemap_sheet",
            frame: 164
        });

        this.spikes = this.map.createFromObjects("Objects", {
            name: "spikes",
            key: "tilemap_sheet",
            frame: 183
        });

        this.door1 = this.map.createFromObjects("Objects", {
            name: "door1",
            key: "tilemap_sheet",
            frame: 59
        });

        this.door2 = this.map.createFromObjects("Objects", {
            name: "door2",
            key: "tilemap_sheet",
            frame: 59
        });

        this.chest = this.map.createFromObjects("Objects", {
            name: "chest",
            key: "tilemap_sheet",
            frame: 389
        });

        this.exit = this.map.createFromObjects("Objects", {
            name: "exit",
            key: "tilemap_sheet",
            frame: 57
        });

        this.key = this.map.createFromObjects("Objects", {
            name: "key",
            key: "tilemap_sheet",
            frame: 96
        });

        this.physics.world.TILE_BIAS = 20;
        this.physics.world.setBounds(0, 0, this.map.displayWidth, this.map.displayHeight);

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.springs, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.door1, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.door2, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.chest, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.exit, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.key, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.springGroup = this.add.group(this.springs);
        this.spikesGroup = this.add.group(this.spikes);

        // counters
        this.coinCount = 0;
        this.deathCount = 0;

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawn[0].x, this.spawn[0].y, "character_sheet");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setSize(12, 16);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.cKey = this.input.keyboard.addKey('C');
        this.shiftKey = this.input.keyboard.addKey('SHIFT');

        // animate all coins
        for (const coin of this.coinGroup.getChildren()) {
            coin.anims.play('coin');
        }

        // dialogue triggers
        this.shiftHelpGiven = false;
        this.keyWonder = false;
        this.doorHelp = false;
        this.keyHelp = false;
        this.missingKey = false;
        this.doorOpenDialogue = false;

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            my.vfx.coin.x = obj2.body.x + obj2.displayWidth/2;
            my.vfx.coin.y = obj2.body.y + obj2.displayHeight/2;
            my.vfx.coin.start();
            this.sound.play('coin', {volume: 0.1});
            obj2.destroy(); // remove coin on overlap
            this.coinCount++;
        });

        // also a spikes collision handler
        this.physics.add.overlap(my.sprite.player, this.spikesGroup, (obj1, obj2) => {
            this.playerDeath();
        });

        // work with doors
        this.physics.add.overlap(my.sprite.player, this.door1, (obj1, obj2) => {
            if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
                obj1.x = this.door2[0].x;
                obj1.y = this.door2[0].y;
                this.sound.play('door', {volume: 0.4});
            }
        });
        this.physics.add.overlap(my.sprite.player, this.door2, (obj1, obj2) => {
            if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
                obj1.x = this.door1[0].x;
                obj1.y = this.door1[0].y;
                this.sound.play('door', {volume: 0.4});
            }
        });

        this.doubleJump = false;
        // chest interaction
        this.physics.add.overlap(my.sprite.player, this.chest, (obj1, obj2) => {
            if (!this.doubleJump) {
                if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
                    this.doubleJump = true;
                    obj2.anims.play('chest_open');
                    this.sound.play('key', {volume: 1});
                    this.sound.play('chest', {volume: 0.7})
                    console.log(obj2);

                    this.bigTextTimer = 200;
                }
            }
        });

        this.hasKey = false;
        // key interaction
        this.physics.add.overlap(my.sprite.player, this.key, (obj1, obj2) => {
            my.vfx.coin.x = obj2.body.x + obj2.displayWidth/2;
            my.vfx.coin.y = obj2.body.y + obj2.displayHeight/2;
            my.vfx.coin.start();
            this.sound.play('key', {volume: 0.8});
            obj2.destroy(); // remove key on overlap
            this.hasKey = true;
            this.speak("to the end!", 300);
        });

        this.doorOpen = false;
        this.physics.add.overlap(my.sprite.player, this.exit, (obj1, obj2) => {
            if (this.doorOpen) {
                if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
                    this.win();
                }
            }
            else if (this.hasKey) {
                if (!this.doorOpenDialogue) {
                    this.doorOpenDialogue = true;
                    this.speak("time to go!", 500);
                }
                if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
                    obj2.anims.play('open_door');
                    this.sound.play('door', {volume: 0.4});
                    this.doorOpen = true;
                }
            }
            else {
                if (!this.missingKey) {
                    this.missingKey = true;
                    this.speak("this door has\na keyhole...", 500);
                }
            }
        });

        // the vfx. all the magic happens here

        my.vfx.walking = this.add.particles(0, 6, "kenny-particles", {
            frame: ['smoke_07.png', 'smoke_01.png'],
            random: true,
            scaleX: {start: 0.03, end: 0.01},
            scaleY: 0.02,
            speedY: {min: -30, max: 0},
            speedX: {min: -50, max: 50},
            lifespan: 150,
        });

        my.vfx.jump = this.add.particles(0, 6, "kenny-particles", {
            frame: ['circle_05.png'],
            scale: {start: 0.03, end: 0.02},
            duration: 100,
            lifespan: 100,
            speedY: 3,
            maxAliveParticles: 8
        });

        my.vfx.springJump = this.add.particles(0, 6, "kenny-particles", {
            frame: ['circle_05.png'],
            scale: {start: 0.03, end: 0.02},
            duration: 300,
            lifespan: 200,
            speedY: 3,
        });

        my.vfx.land = this.add.particles(0, 6, "kenny-particles", {
            frame: ['trace_01.png'],
            random: true,
            scaleX: 0.1,
            scaleY: 0.02,
            duration: 40,
            lifespan: 400,
            speedX: {min: -50, max: 50, ease: 5},
            speedY: {min: -100, max: 0, ease: 5}
        })

        my.vfx.coin = this.add.particles(0, 6, "kenny-particles", {
            frame: ['star_05.png', 'star_04.png'],
            random: true,
            scale: {start: 0.1, end: 0.02},
            duration: 40,
            lifespan: 250,
            speedX: {min: -150, max: 150},
            speedY: {min: -150, max: 150},
            alpha: {start: 1, end: 0.3}
        })

        // also a spring collision handler
        this.physics.add.overlap(my.sprite.player, this.springGroup, (obj1, obj2) => {
            obj2.anims.play('spring_up');
            obj1.body.setVelocityY(this.JUMP_VELOCITY * 1.3);
            my.vfx.springJump.startFollow(obj1, 0, obj1.displayHeight/2-5, false);
            my.vfx.springJump.start();
            this.sound.play("spring", {volume: 0.3});
        });

        my.vfx.coin.stop();
        my.vfx.walking.stop();
        my.vfx.jump.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // text
        this.infoText = this.add.text(
            this.cameras.main.x + 20,
            this.cameras.main.y + 12,
            "",
            {
                fontFamily: 'Times, Serif',
                fontSize: 15,
                stroke: '#000000',
                strokeThickness: 4
            }
        )

        this.speechText = this.add.text(
            my.sprite.player.x,
            my.sprite.player.y - 20,
            "bingus",
            {
                fontFamily: 'Arial',
                fontSize: 10,
                stroke: '#000000',
                strokeThickness: 4
            }
        )
        this.speechText.setOrigin(0.5);
        this.speechText.visible = false;

        this.doubleJumpText = this.add.text(
            0,
            this.map.heightInPixels/2 - 50,
            "DOUBLE JUMP!",
            {
                fontFamily: 'Arial Black',
                fontSize: 50,
                stroke: '#000000',
                strokeThickness: 12
            }
        )
        this.doubleJumpText.setDepth(5);
        this.doubleJumpText.visible = false;

        // player on top of everything
        my.sprite.player.setDepth(2);

        this.particleTrigger = false;
        this.jumpedOnce = false;

        // audio timers/handlers
        this.stepTimer = 0;
        this.speechTimer = 0;
        this.bigTextTimer = 0;

        // event triggers
        this.death1 = false;
        this.death5 = false;
        this.death10 = false;

        this.coins10 = false;
        this.coins20 = false;
        this.coins60 = false;
    }

    update() {
        // update text fields
        this.minutes = Math.round(this.time.now/60000);
        this.seconds = Math.round(this.time.now/1000 % 60);
        this.infoText.setText(
            "coins - " + this.coinCount +
            "\ndeaths - " + this.deathCount + 
            "\ntime - " + String(this.minutes).padStart(2, '0') + ":" + String(this.seconds).padStart(2, '0')
        );

        this.infoText.x = this.cameras.main.scrollX + 300;

        this.speechText.x = my.sprite.player.x;
        this.speechText.y = my.sprite.player.y - 20

        this.doubleJumpText.x = this.cameras.main.scrollX + 357;

        // dialogue for the little guy
        this.speechTimer--;
        if (this.speechTimer < 0) {
            this.speechText.visible = false;
        }

        // event based dialogue
        if (this.deathCount === 1 && !this.death1) {
            this.death1 = true;
            this.speak("OUCH! that hurt...", 250);
        }
        if (this.deathCount === 5 && !this.death5) {
            this.death5 = true;
            this.speak("maybe stop dying!!", 250);
        }
        if (this.deathCount === 10 && !this.death10) {
            this.death10 = true;
            this.speak("i feel like this\nis on purpose...", 400);
        }

        if (this.coinCount === 10 && !this.coins10) {
            this.coins10 = true;
            this.speak("10 coins?\nthat's a lot!", 300);
        }
        if (this.coinCount === 20 && !this.coins20) {
            this.coins20 = true;
            this.speak("so many coins!!!", 300);
        }
        if (this.coinCount === 60 && !this.coins60) {
            this.coins60 = true;
            this.speak("IM RICH!!!!!!!!!!!!!", 400);
        }

        this.stepTimer--;
        this.bigTextTimer--;

        if (this.bigTextTimer < 0) {
            this.doubleJumpText.visible = false;
        }
        else {
            this.doubleJumpText.visible = true;
        }
        
        // bunch of dialogue
        if (my.sprite.player.x > 320 && !this.shiftHelpGiven) {
            this.shiftHelpGiven = true;
            this.speak("hold the SHIFT key\nto walk!", 500);
        }
        else if (my.sprite.player.x > 1056 && !this.keyWonder) {
            this.keyWonder = true;
            this.speak("can't get that\nkey right now...", 500);
        }     
        else if (my.sprite.player.x > 1620 && !this.doorHelp) {
            this.doorHelp = true;
            this.speak("press C to go\nthrough doors and\nopen chests!", 500);
        }   
        else if (my.sprite.player.x > 1730 && !this.keyHelp && this.doubleJump) {
            this.keyHelp = true;
            this.speak("maybe I can get\nthat key now!", 500);
        }

        // console.log(my.sprite.player.body.velocity.x);
        // death condition for player falling out of world
        if (my.sprite.player.y > this.map.heightInPixels) {
            this.playerDeath();
        }

        if(cursors.left.isDown) {
            // enforce a maximum speed
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            if (my.sprite.player.body.velocity.x < -this.MAX_SPEED) {
                my.sprite.player.body.velocity.x = -this.MAX_SPEED;
            }
            my.sprite.player.setFlip(true, false);
            if (this.doubleJump) {
                my.sprite.player.anims.play('walk_double', true);
            }
            else {
                my.sprite.player.anims.play('walk', true);
            }

            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2, my.sprite.player.displayHeight/2-5, false);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                if (this.stepTimer < 0) {
                    this.sound.play("step", {volume: 0.3});
                    this.stepTimer = this.STEP_TIME;
                }
            }
            else {
                my.vfx.walking.stop();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            if (my.sprite.player.body.velocity.x > this.MAX_SPEED) {
                my.sprite.player.body.velocity.x = this.MAX_SPEED;
            }
            my.sprite.player.resetFlip();
            if (this.doubleJump) {
                my.sprite.player.anims.play('walk_double', true);
            }
            else {
                my.sprite.player.anims.play('walk', true);
            }
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, -my.sprite.player.displayWidth/2, my.sprite.player.displayHeight/2-5, false);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                if (this.stepTimer < 0) {
                    this.sound.play("step", {volume: 0.3});
                    this.stepTimer = this.STEP_TIME;
                }
            }
            else {
                my.vfx.walking.stop();
            }


        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            if(!my.sprite.player.body.blocked.down) {
                my.sprite.player.setDragX(this.AIRDRAG);
            }
            else {
                my.sprite.player.setDragX(this.DRAG);
            }
            if (this.doubleJump) {
                my.sprite.player.anims.play('idle_double', true);
            }
            else {
                my.sprite.player.anims.play('idle', true);
            }
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"

        if(!my.sprite.player.body.blocked.down) {
            if (!this.particleTrigger) {
                this.particleTrigger = true;
            }
            if (this.doubleJump) {
                my.sprite.player.anims.play('jump_double', true);
            }
            else {
                my.sprite.player.anims.play('jump', true);
            }
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            this.jumpedOnce = true;
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);

            my.vfx.jump.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jump.start();

            this.sound.play('jump', {volume: 0.3});
        }

        if (this.doubleJump) {
            if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpedOnce) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.jumpedOnce = false;

                my.vfx.jump.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight/2-5, false);
                my.vfx.jump.start();

                this.sound.play('jump', {volume: 0.3});
            }
        }

        if (my.sprite.player.body.blocked.down && this.particleTrigger) {
            my.vfx.land.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight/2-5, false);
            my.vfx.land.start();
            this.sound.play('land', {volume: 0.3})

            this.cameras.main.shake(100, 0.0005);

            this.jumpedOnce = false;
            this.particleTrigger = false;
        }

        if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
            this.MAX_SPEED = 100;
        }
        if (Phaser.Input.Keyboard.JustUp(this.shiftKey)) {
            this.MAX_SPEED = 200;
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    playerDeath() {
        this.cameras.main.shake(100, 0.005);
        this.sound.play('death', {volume: 0.6})
        my.sprite.player.x = this.spawn[0].x;
        my.sprite.player.y = this.spawn[0].y;
        this.deathCount++;
    }

    win() {
        this.sound.play('win');
        this.scene.start("win", {
            coins: this.coinCount,
            deaths: this.deathCount,
            time: this.time.now
        });
    }

    speak(text, time) {
        this.sound.play('speak', {volume: 0.6});
        this.speechText.visible = true;
        this.speechText.setText(text);
        this.speechTimer = time;
    }
}