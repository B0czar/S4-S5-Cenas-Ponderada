// Game configuration
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: false,
        },
    },
};

// Initialize the game
var game = new Phaser.Game(config);

/*
window.addEventListener("resize", function () {
    game.resize(window.innerWidth, window.innerHeight);
});
*/

var platforms;
var cursors;
var hue = 0;
var score = 0;
var scoreText;
var bombs;
var gameOver = false;

// jQuery for background color change
$(document).ready(function () {
    setInterval(function () {
        // Reset the hue if we reach the end
        if (hue >= 360) {
            hue = 0;
        }

        // Skip some dull colors (hue 210 to 270)
        if (hue >= 210 && hue <= 270) {
            hue = 271;
        }

        // Set the background
        $("body").css("background-color", "hsl(" + hue + ", 100%, 60%)");

        // Increase the hue
        hue++;
    }, 50);
}); // fonte: https://stackoverflow.com/questions/71743460/how-to-smooth-spectrum-cycling-in-css-when-skipping-dull-colors

// Preload assets
function preload() {
    this.load.image("sky", "../assets/sky.png");
    this.load.image("ground", "../assets/platform.png");
    this.load.image("star", "../assets/beer.png");
    this.load.image("bomb", "../assets/bomb.png");
    this.load.spritesheet("dude", "../assets/dude.png", {
        frameWidth: 32,
        frameHeight: 48,
    });
    this.load.audio("gameOverMusic", "../assets/Macetando.mp3.mp3");
    this.load.audio("musicaTema", "../assets/crowd.mp3");
}

// Create game objects
function create() {
    // Add background
    this.add.image(400, 300, "sky");
    this.add.image(400, 300, "star").visible = false;

    // Play background music
    var musicBaby = this.sound.add("musicaTema");
    musicBaby.play({ loop: true });
    musicBaby.setVolume(0.3);

    // Create platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, "ground").setScale(2).refreshBody();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");

    // Add player sprite
    player = this.physics.add.sprite(100, 450, "dude");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    // Create player animations
    this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
        key: "turn",
        frames: [{ key: "dude", frame: 4 }],
        frameRate: 20,
    });

    this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1,
    });

    // Enable cursor keys for player movement
    cursors = this.input.keyboard.createCursorKeys();

    // Add stars group
    stars = this.physics.add.group({
        key: "star",
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 },
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Add collision detection between stars and platforms
    this.physics.add.collider(stars, platforms);

    // Add overlap detection between player and stars
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // Add bombs group
    bombs = this.physics.add.group();

    // Add collision detection between bombs and platforms
    this.physics.add.collider(bombs, platforms);

    // Add collision detection between player and bombs
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    // Add score text
    scoreText = this.add.text(16, 16, "Score: 0", {
        fontSize: "32px",
        fill: "#000",
    });
}
// Update game state
function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play("left", true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play("right", true);
    } else {
        player.setVelocityX(0);
        player.anims.play("turn");
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

// Define the collectStar function
function collectStar(player, star) {
    let pi = 3.14159265358979323846; // 20 digits numeros de Pi
    star.disableBody(true, true);

    // Update score
    score += pi;
    scoreText.setText(
        "Score: " + score.toFixed(20) + " (" + (score / pi).toFixed(0) + "π)"
    );

    // Check if all stars are collected
    if (stars.countActive(true) === 0) {
        // Re-enable all stars
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        // Create a bomb
        var x =
            player.x < 400
                ? Phaser.Math.Between(400, 800)
                : Phaser.Math.Between(0, 400);
        var bomb = bombs.create(x, 16, "bomb");
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

// Define the hitBomb function
function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    gameOver = true;

    // Stop the background music
    this.sound.stopAll();

    // Efeito de carnaval: explosão de partículas
    var particles = this.add.particles("star");
    particles.createEmitter({
        x: player.x,
        y: player.y,
        speed: { min: -300, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        blendMode: "ADD",
        lifespan: 1500,
        quantity: 100,
    });

    // Cria o botão para voltar ao index
    var btn = this.add.text(400, 400, "Voltar para o Início", {
        fontSize: "32px",
        fill: "#fff",
        backgroundColor: "#000",
    });
    btn.setOrigin(0.5);
    btn.setInteractive();
    btn.on("pointerdown", () => {
        window.location.href = "index.html";
    });

    // Animação pulsante no botão (efeito adicional)
    this.tweens.add({
        targets: btn,
        scale: { from: 0.8, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1,
    });

    // Play game over music starting at 36th second
    var music = this.sound.add("gameOverMusic");
    music.play({ seek: 36 });
}
