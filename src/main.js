import { kaplay } from "kaplay";

// --- Constants ---
const FLOOR_HEIGHT = 48;
const JUMP_FORCE = 750;
const INITIAL_SPEED = 300;

// --- Initialization ---
kaplay();

// --- Assets ---
loadSound("backgroundMusic", "music/backgroundMusic.mp3");
loadSprite("backgroundImage", "sprites/background-image.jpg");
loadSprite("pennywise", "sprites/pennywise/pennywise.png");
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
            speed: 50,
            loop: false,
        }
    }
});
loadSprite("child", "sprites/child1/child-running.png", {
    sliceX: 6,
    sliceY: 6,
    anims: {
        run: {
            from: 0,
            to: 35,
            speed: 70,
            loop: true,
        },
    },
});
loadSprite("boneco-de-neve", "sprites/obstáculos/boneco-de-neve.png",);
loadSprite("balloon", "sprites/coletáveis/balloon.png");

loadShader("selectiveRed", null, `
    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
        vec4 c = def_frag();
        float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        gray = (gray - 0.5) * 1.5 + 0.6;
        float redness = c.r - max(c.g, c.b);
        float mask = smoothstep(0.1, 0.25, redness);
        vec3 lowSat = mix(vec3(gray), c.rgb, 0.3);
        return vec4(mix(lowSat * 0.4, c.rgb * 0.4, mask), c.a);
    }
`);

// --- Game Logic ---
scene("game", () => {
    usePostEffect("selectiveRed");
    let speed = INITIAL_SPEED;
    let score = 0;

    setGravity(1600);

    // --- Background ---
    const bg1 = add([
        sprite("backgroundImage"),
        pos(0, 0),
        scale(width() / 1024, height() / 572),
        fixed(),
        z(-1),
        move(LEFT, speed / 10),
        "background",
    ]);

    const bg2 = add([
        sprite("backgroundImage"),
        pos(width(), 0),
        scale(width() / 1024, height() / 572),
        fixed(),
        z(-1),
        move(LEFT, speed / 10),
        "background",
    ]);

    onUpdate("background", (bg) => {
        if (bg.pos.x <= -width()) {
            bg.pos.x += width() * 2;
        }
    });

    onResize(() => {
        bg1.scale = vec2(width() / 1024, height() / 572);
        bg2.scale = vec2(width() / 1024, height() / 572);
    });

    // --- Snow ---
    loop(0.05, () => {
        add([
            circle(rand(1, 3)),
            pos(rand(0, width()), -10),
            color(255, 255, 255),
            move(DOWN, rand(20, 100)),
            opacity(rand(0.5, 0.8)),
            offscreen({ destroy: true }),
            z(100),
        ]);
    });

    // --- Player ---
    let player = add([
        sprite("pennywiseRunning"),
        pos(width() / 5, height() - 90),
        anchor("center"),
        area({ scale: vec2(0.5, 1) }),
        body(),
        scale(0.6),
    ]);

    player.play("run");

    // --- Balloon ---
    function spawnBalloon() {
        add([
            sprite("balloon"),
            pos(width(), height() - FLOOR_HEIGHT - 270),
            area({ scale: vec2(0.4, 0.5) }),
            anchor("top"),
            move(LEFT, speed),
            scale(0.15),
            offscreen({ destroy: true }),
            "balloon",
        ]);

        wait(rand(10, 20), spawnBalloon);
    }

    spawnBalloon();

    player.onCollide("balloon", (balloon) => {
        destroy(balloon);

        for (let i = 0; i < 15; i++) {
            add([
                rect(rand(3, 5), rand(3, 5)),
                pos(balloon.pos),
                color(rand(0, 255), rand(0, 255), rand(0, 255)),
                anchor("center"),
                move(vec2(rand(-1, 1), rand(-1, 1)).unit(), rand(100, 300)),
                rotate(rand(0, 360)),
            ]);
        };

        score += 50;
        add([
            text("+50"),
            pos(balloon.pos),
            color(255, 0, 0),
            anchor("center"),
            move(UP, 100),
            offscreen({ destroy: true }),
            "balloon-score"
        ]);
    });

    // --- Child ---
    let child = add([
        sprite("child"),
        pos(width() - 140, height() - 90),
        anchor("center"),
        area({ scale: vec2(0.5, 1) }),
        body(),
        scale(0.35),
    ]);

    child.play("run");

    // --- Level ---
    add([
        rect(width(), FLOOR_HEIGHT),
        pos(0, height()),
        anchor("botleft"),
        area(),
        body({ isStatic: true }),
        color(255, 255, 255),
        outline(2),
        "floor",
    ]);

    function jump() {
        if (player.isGrounded()) {
            player.use(sprite("pennywiseJumping"));
            player.play("jump");
            player.jump(JUMP_FORCE);
        };
    };

    player.onGround(() => {
        player.use(sprite("pennywiseRunning"));
        player.play("run");
    });

    onKeyPress("space", jump);
    onClick(jump);

    // --- Obstacles ---
    function spawnObstacle() {
        add([
            sprite("boneco-de-neve"),
            area({ scale: vec2(0.3, 0.5) }),
            pos(width(), height() - FLOOR_HEIGHT - 40),
            anchor("center"),
            move(LEFT, speed),
            scale(0.2),
            offscreen({ destroy: true }),
            "boneco-de-neve",
        ]);

        wait(rand(2, 2.5), spawnObstacle);
    }

    spawnObstacle();

    player.onCollide("boneco-de-neve", () => {
        go("lose", score);
    });

    // --- UI & Score ---
    const scoreLabel = add([text(score), pos(24, 24)]);

    onUpdate(() => {
        score += 0.05;
        scoreLabel.text = score.toFixed();
        speed += 0.01;
    });
});

scene("lose", (score) => {
    const bg1 = add([
        sprite("backgroundImage"),
        pos(0, 0),
        scale(width() / 1024, height() / 572),
        fixed(),
        z(-1),
        "background",
    ]);
    
    add([
        sprite("pennywise"),
        pos(width() / 2, height() / 2 - 80),
        scale(0.6),
        anchor("center"),
    ]);

    add([
        text(score.toFixed()),
        pos(width() / 2, height() / 2 + 80),
        scale(2),
        anchor("center"),
    ]);

    onKeyPress("space", () => go("game"));
    onClick(() => go("game"));
});

// --- Start ---
go("game");

const backgroundMusic = play("backgroundMusic", {
    volume: 0.3,
    speed: 1,
    loop: true,
});