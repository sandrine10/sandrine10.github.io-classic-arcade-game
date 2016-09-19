//Variables
var menu;
var gameState;
var hud; // player hud- https://en.wikipedia.org/wiki/HUD_(video_gaming)
var player;
var allEnemies;
var enemyResetX;
var playerReset; // player spawn position
var level;
var score = 0;
var colWidth = 101;
var rowheight = 83;
var gem = [GemBlue, GemOrange, Star, Key];
var collectedBlue;
var collectedOrange;
var collectedKey;

// Menu allows you to select a player character in the main menu
var Menu = function() {
    this.x = 0;
    this.y = 100;
    this.selected = 0;
    this.sprite = 'images/Selector.png';
    this.bg = 'images/stone-block-highlight.png';

    this.characters = ['images/char-boy.png', 'images/char-cat-girl.png', 'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'
    ];
    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
};

Menu.prototype.render = function() {
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "bold 20pt verdana";

    if (gameState === "menu") {
        for (var bkg in this.characters) {
            if (this.characters[bkg] !== undefined){
                ctx.drawImage(Resources.get(this.bg), this.width * bkg, this.y + 40);
            }
        }
        ctx.drawImage(Resources.get(this.sprite), this.width * this.selected, this.y);
        for (var character in this.characters) {
            if (this.characters[character] !== undefined){
                ctx.drawImage(Resources.get(this.characters[character]), this.width * character, (this.selected == character ? this.y - 20 : this.y));
            }
        }

        ctx.fillText("SELECT AN AVATAR!", ctx.canvas.width / 2, ctx.canvas.height / 5);
        ctx.font = "italic 14pt Verdana";
        ctx.fillText("Use the arrow keys to select an avatar.", ctx.canvas.width / 2, ctx.canvas.height / 6 * 5);
    }

    if (gameState === "lose") {
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = "black";
        ctx.fillRect(78, 200, 350, 200);
        ctx.fillStyle = "red";
        ctx.textAlign = "left";
        ctx.fillText("GAME OVER!", 155, 285);
        ctx.font = "12pt verdana";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText("Refresh your browser to Play Again", 117, 350);
    } else if (gameState === "win") {
        ctx.fillStyle = "red";
        ctx.fillText('LEVEL ' + level + ' WON', ctx.canvas.width / 2, ctx.canvas.height / 5);
        ctx.fillText('SCORE: ' + score, ctx.canvas.width / 2, ctx.canvas.height * 0.75);
    }

};

Menu.prototype.handleInput = function(key) {
    switch (key) {
        case "left":
            if (menu.selected - 1 >= 0) {
                menu.selected--;
            }
            break;
        case "right":
            if (menu.selected + 1 < menu.characters.length) {
                menu.selected++;
                console.log(menu.selected);
            }
            break;
        case "up":
            console.log("up");
            if (gameState === "menu") {
                gameState = "waiting";
            } else if (gameState === "lose") {
                gameState = "restart";
            } else if (gameState === "win") {
                gameState = "continue";
            }
            break;
    }
};

// Collectibles
var Star = function(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = 'images/Star.png';

    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
    this.bounds = getBounds(this);

};

Star.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};


var GemBlue = function(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = 'images/gem-blue.png';

    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
    this.bounds = getBounds(this);
};

GemBlue.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

var GemOrange = function(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = 'images/gem-orange.png';

    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
    this.bounds = getBounds(this);
};

GemOrange.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

var Key = function(x, y) {
    this.x = x;
    this.y = y;
    this.sprite = 'images/Key.png';

    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
    this.bounds = getBounds(this);
};

Key.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// This function adds a hud that displays remaining lives and current level the player is on
var Hud = function(lives) {
    this.x = 5;
    this.y = -10;
    this.MAX_LIVES = lives;
    this.lives = lives;
    this.sprite = 'images/Heart.png';
    this.width = Resources.get(this.sprite).width * 0.4;
    this.height = Resources.get(this.sprite).height * 0.4;
};

Hud.prototype.render = function() {
    for (i = 0; i < this.lives; i++) {
        ctx.drawImage(Resources.get(this.sprite), this.x + i * this.width, this.y, this.width, this.height);
    }
    ctx.font = "bold 20pt verdana";
    ctx.fillStyle = "red";
    ctx.fillText('LEVEL ' + level, ctx.canvas.width - 75, 35);
};

// Enemy player must avoid
var Enemy = function(x, y, speed) {
    this.y = y;
    this.x = x;
    this.speed = speed;
    this.reset = false;
    this.sprite = 'images/enemy-bug-purple.png';

    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
    this.bounds = getBounds(this);
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;
    this.bounds = getBounds(this);
    // Set reset when unit is no longer on screen
    if (!this.reset && isColliding(this.bounds[0], this.bounds[1], 0, ctx.canvas.clientWidth)) {
        this.reset = true;
    }
    // Reset when unit is off screen
    else if (this.reset && !isColliding(this.bounds[0], this.bounds[1], 0, ctx.canvas.clientWidth)) {
        this.x = enemyResetX - getRandomInt(0, ctx.canvas.clientWidth);
        this.reset = false;
    }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// The player class creates character based on one chosen at menu.
var Player = function(x, y) {
    this.x = x;
    this.y = y;

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = menu.characters[menu.selected];
    this.width = Resources.get(this.sprite).width;
    this.height = Resources.get(this.sprite).height;
    this.bounds = getBounds(this);
};

Player.prototype.update = function(dt) {
    this.bounds = getBounds(player);
};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(keyCode) {
    //switch input
    if (gameState === "playing") {
        switch (keyCode) {
            case "left":
                if (player.x - 101 >= 0) {
                    this.x -= 101;
                }
                break;
            case "right":
                if (player.x + 101 < ctx.canvas.clientWidth) {
                    this.x += 101;
                }
                break;
            case "up":
                if (player.y - 83 >= -40) {
                    this.y -= 83;
                }
                break;
            case "down":
                if (player.y + player.height + 83 < ctx.canvas.clientHeight) {
                    this.y += 83;
                }
                break;
        }
    }
};

//This function creates the games menu object
var initGraphics = function() {
    gameState = "menu";
    menu = new Menu();
};

//This function initializes the level with required components
var game = function(enemiesPerRow, speedSeed, lives, level) {
    score = 0;
    gameState = "playing";
    this.level = level;
    hud = new Hud(lives);
    tileSize = [ctx.canvas.clientWidth / colWidth, enemiesPerRow.length];
    star = new Star(colWidth * getRandomInt(1, tileSize[0]), -10);

    var ry = rowheight * getRandomInt(1, tileSize[1] - 1);
    gemblue = new GemBlue(colWidth * getRandomInt(1, tileSize[0]), ry);

    ry = rowheight * getRandomInt(1, tileSize[1] - 1);
    gemorange = new GemOrange(colWidth * getRandomInt(1, tileSize[0]), ry);

    ry = rowheight * getRandomInt(1, tileSize[1] - 1);
    key = new Key(colWidth * getRandomInt(1, tileSize[0]), ry);

    enemyResetX = -colWidth;
    playerReset = [colWidth * Math.floor(tileSize[0] / 2), 83 * (enemiesPerRow.length - 1) - 40]; // calculate bottom center
    player = new Player(playerReset[0], playerReset[1]); // each y level offset by 83 with initial -40
    collectedBlue = false;
    collectedOrange = false;
    collectedKey = false;

    // initialize allEnemy array
    allEnemies = [];

    for (var row in enemiesPerRow) { // iterate through object passed in
         if (enemiesPerRow[row] !== undefined){
            var ypos = -20 + 83 * row;
            var speed = (speedSeed - speedSeed * row / enemiesPerRow.length) + (level - 1) * 50; //speed is clamped based on how high the row is
            for (i = 0; i < enemiesPerRow[row]; i++) { // create enemies based on value in array
                var startpos = 101 * (i + 1) - 404 + getRandomInt(0, ctx.canvas.clientWidth); // initial spawn point
                allEnemies.push(new Enemy(startpos, ypos, speed));
            }
        }
    }
};

/*
 Function to check collision bounds for screen and unit collision, checks whether
 a unit violates an upper or lower bound.
 Is only able to detect collision on one axis. To check collision between two units, there
 must be a separate function call to check x axis and y axis violations.
*/
var isColliding = function(unitLower, unitUpper, boundLower, boundUpper) {
    return ((unitLower >= boundLower) && (unitLower <= boundUpper)) ||
        ((unitUpper >= boundLower) && (unitUpper <= boundUpper));
};

/*
 Collision Detection (https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection)
 This function checks unit collision. It first detects if a player is colliding with the objective which leads
 complete level and score points.
 It then checks to see if the player is colliding with any enemy
 */
var checkCollisions = function() {

    if (isColliding(player.bounds[0], player.bounds[1], gemblue.bounds[0], gemblue.bounds[1]) && isColliding(player.bounds[2], player.bounds[3], gemblue.bounds[2], gemblue.bounds[3])) {
        if (!collectedBlue) {
            score += 50;
            collectedBlue = true;
        }
    }

    if (isColliding(player.bounds[0], player.bounds[1], gemorange.bounds[0], gemorange.bounds[1]) && isColliding(player.bounds[2], player.bounds[3], gemorange.bounds[2], gemorange.bounds[3])) {
        if (!collectedOrange) {
            score += 100;
            collectedOrange = true;
        }
    }

    if (isColliding(player.bounds[0], player.bounds[1], key.bounds[0], key.bounds[1]) && isColliding(player.bounds[2], player.bounds[3], key.bounds[2], key.bounds[3])) {
        if (collectedOrange && collectedBlue && !collectedKey) {
            score += 200;
            collectedKey = true;
        }
    }

    if (isColliding(player.bounds[0], player.bounds[1], star.bounds[0], star.bounds[1]) && isColliding(player.bounds[2], player.bounds[3], star.bounds[2], star.bounds[3])) {
        if (collectedOrange && collectedBlue && collectedKey) {
            score += 300;
            gameState = "win";
        }
    }

    for (var enemy in allEnemies) {
        if (isColliding(player.bounds[0], player.bounds[1], allEnemies[enemy].bounds[0], allEnemies[enemy].bounds[1]) && isColliding(player.bounds[2], player.bounds[3], allEnemies[enemy].bounds[2], allEnemies[enemy].bounds[3])) {
            player.x = playerReset[0];
            player.y = playerReset[1];
            hud.lives--;
            if (hud.lives === 0) {
                gameState = "lose";
            }
        }
    }
};

// This function is used to calculate the bounds of a unit to check collisions.
// Returns an array of calculated lower and upper bounds for both x and y axis.
var getBounds = function(unit) {
    return [unit.x + 15, unit.x + unit.width - 15, unit.y + 100, unit.y + unit.height - 25]; //shrink bounds
};

// Returns a random integer between min and max
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener("keyup", function(e) {
    var allowedKeys = {
        37: "left",
        38: "up",
        39: "right",
        40: "down"
    };
    if (gameState === "playing") {
        player.handleInput(allowedKeys[e.keyCode]);
    } else {
        menu.handleInput(allowedKeys[e.keyCode]);
    }
});
