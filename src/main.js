import { kaplay } from "kaplay";

const FLOOR_HEIGHT = 48;
const JUMP_FORCE = 750;
let SPEED = 300;

// initialize context
kaplay();

// load assets
loadSound("backgroundMusic", "music/backgroundMusic.mp3");
loadSprite("backgroundImage", "sprites/background-image.jpg");
loadSprite("pennywise", "sprites/pennywise/pennywise.png")
loadSprite("pennywiseRunning", "sprites/pennywise/pennywise-running.png", {
    sliceX: 6,
    sliceY: 6,
    anims: {
        run: {
            from: 0,
            to: 35,
            speed: 30,
            loop: true,
        },
    },
});
loadSprite("pennywiseJumping", "sprites/pennywise/pennywise-jumping.png", {
    sliceX: 6,
    sliceY: 6,
    anims: {
        jump: {
            from: 0,
            to: 35,
            speed: 20,
            loop: false,
        }
    }
})

scene("game", () => {
    // define gravity
    setGravity(1600);

    // Adiciona dois fundos para criar o efeito de loop infinito
    const bg1 = add([
        sprite("backgroundImage"),
        pos(0, 0),
        scale(width() / 1024, height() / 572),
        fixed(),
        z(-1),
        move(LEFT, SPEED / 10),
        "background",
    ]);

    const bg2 = add([
        sprite("backgroundImage"),
        pos(width(), 0),
        scale(width() / 1024, height() / 572),
        fixed(),
        z(-1),
        move(LEFT, SPEED / 10),
        "background",
    ]);

    // Quando um fundo sai da tela, move ele para o final da fila
    onUpdate("background", (bg) => {
        if (bg.pos.x <= -width()) {
            bg.pos.x += width() * 2;
        }
    });

    // Atualiza a escala do fundo caso a janela seja redimensionada
    onResize(() => {
        bg1.scale = vec2(width() / 1024, height() / 572);
        bg2.scale = vec2(width() / 1024, height() / 572);
    });

    // add a game object to screen
    let player = add([
        // list of components
        sprite("pennywiseRunning"),
        pos(80, 40),
        area(),
        body(),
        scale(0.6),
    ]);

    player.play("run");

    // floor
    add([
        rect(width(), FLOOR_HEIGHT),
        pos(0, height()),
        anchor("botleft"),
        area(),
        body({ isStatic: true }),
    ]);

    function jump() {
        player.sprite("pennywiseJumping");
        if (player.isGrounded()) {
            player.jump(JUMP_FORCE);
            player.play("run")
        }
    }

    // jump when user press space
    onKeyPress("space", jump);
    onClick(jump);

    function spawnTree() {
        // add tree obj
        add([
            rect(48, rand(32, 96)),
            area(),
            outline(4),
            pos(width(), height() - FLOOR_HEIGHT),
            anchor("botleft"),
            color(255, 180, 255),
            move(LEFT, SPEED),
            "tree",
        ]);

        // wait a random amount of time to spawn next tree
        wait(rand(1, 1.5), spawnTree);
    }

    // start spawning trees
    spawnTree();

    // lose if player collides with any game obj with tag "tree"
    player.onCollide("tree", () => {
        // go to "lose" scene and pass the score
        go("lose", score);
        burp();
        addKaboom(player.pos);
    });

    // keep track of score
    let score = 0;

    const scoreLabel = add([text(score), pos(24, 24)]);

    // increment score every frame
    onUpdate(() => {
        score++;
        scoreLabel.text = score;
        SPEED += 0.01;
    });
});

scene("lose", (score) => {
    add([
        sprite("pennywise"),
        pos(width() / 2, height() / 2 - 80),
        scale(0.6),
        anchor("center"),
    ]);

    // display score
    add([
        text(score),
        pos(width() / 2, height() / 2 + 80),
        scale(2),
        anchor("center"),
    ]);

    // go back to game with space is pressed
    onKeyPress("space", () => go("game"));
    onClick(() => go("game"));
});

go("game");
const backgroundMusic = play("backgroundMusic", {
    volume: 0.5, // set the volume to 50%
    speed: 1, // speed up the sound
    loop: true, // loop the sound
});