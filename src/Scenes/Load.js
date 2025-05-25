class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");                         // Packed tilemap
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet("character_sheet", "characters_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('character_sheet', { frames: [2, 3] }),
            frameRate: 20,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames('character_sheet', { frames: [0] }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNames('character_sheet', { frames: [5] }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'walk_double',
            frames: this.anims.generateFrameNames('character_sheet', { frames: [9, 10] }),
            frameRate: 20,
            repeat: -1
        });

        this.anims.create({
            key: 'idle_double',
            frames: this.anims.generateFrameNames('character_sheet', { frames: [7] }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'jump_double',
            frames: this.anims.generateFrameNames('character_sheet', { frames: [12] }),
            frameRate: 30,
            repeat: -1
        });

        this.anims.create({
            key: 'spring_up',
            frames: this.anims.generateFrameNames('tilemap_sheet', { frames: [165, 163, 164]})
        });

        this.anims.create({
            key: 'coin',
            frames: this.anims.generateFrameNames('tilemap_sheet', {frames: [21, 22]}),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'chest_open',
            frames: this.anims.generateFrameNames('tilemap_sheet', { frames: [390]})
        });

        this.anims.create({
            key: 'open_door',
            frames: this.anims.generateFrameNames('tilemap_sheet', { frames: [390]})
        });


         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}