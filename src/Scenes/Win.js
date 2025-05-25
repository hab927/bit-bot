class Win extends Phaser.Scene {
    constructor() {
        super("win");
    }

    init (data) {
        this.coins = data.coins;
        this.deaths = data.deaths;
        this.time = data.time;

        this.minutes = Math.round(this.time/60000);
        this.seconds = Math.round(this.time/1000 % 60);
    }

    preload() {
        this.load.setPath("./assets/Audio_Interface/");
        this.load.audio('confirm', 'maximize_003.ogg');
    }

    create() {
        this.title = this.add.text(game.config.width/2, game.config.height/2 - 200,
            "You Win!!",
            {
                fontFamily: 'Times, Serif',
                fontSize: 60
            }
        )
        this.title.setOrigin(0.5);

        this.scoreText = this.add.text(game.config.width/2, game.config.height/2 - 70,
            "Total Coins   -   " + this.coins +
            "\nTotal Deaths  -   " + this.deaths + 
            "\nTime Spent    -   " + String(this.minutes).padStart(2, '0') + " minutes " + String(this.seconds).padStart(2, '0') + " seconds",
            {
                fontSize: 30
            }
        )
        this.scoreText.setOrigin(0.5);

        this.infoText = this.add.text(game.config.width/2, game.config.height/2 + 120,
            "You made it to the end! Congratulations!\n\n\nPress 'C' to return to the menu.",
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
            this.scene.start("menu");
        }
    }
}