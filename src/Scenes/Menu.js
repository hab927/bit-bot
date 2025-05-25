class Menu extends Phaser.Scene {
    constructor() {
        super("menu");
    }

    preload() {
        this.load.setPath("./assets/Audio_Interface/");
        this.load.audio('confirm', 'maximize_003.ogg');
    }

    create() {
        this.title = this.add.text(game.config.width/2, game.config.height/2 - 200,
            "BIT BOT",
            {
                fontFamily: 'Times, Serif',
                fontSize: 60
            }
        )
        this.title.setOrigin(0.5);

        this.infoText = this.add.text(game.config.width/2, game.config.height/2 + 120,
            "Welcome to Bit Bot!\nYour goal as Bit is to make it to the end.\n\nPress 'C' to begin.",
            {
                fontSize: 30
            }
        )
        this.infoText.setOrigin(0.5);

        this.C = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C); // C key
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.C)) {
            this.sound.play("confirm", {volume: 0.5});
            this.scene.start("platformerScene");
        }
    }
}