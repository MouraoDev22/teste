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
            speed: 30,
            loop: false,
        }
    }
});

loadShader("gloomy", null, `
    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
        vec4 c = def_frag();
        float dist = distance(uv, vec2(0.5, 0.5));
        float vignette = 1.0 - smoothstep(0.4, 1.0, dist);
        return vec4(c.rgb * vignette * vec3(0.7, 0.5, 0.5), c.a);
    }
`);

// --- Game Logic ---
scene("game", () => {
    usePostEffect("gloomy");
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
        pos(300, 640),
        anchor("center"),
        area({ scale: vec2(0.5, 1) }),
        body(),
        scale(0.6),
    ]);

    player.play("run");

    // --- Level ---
    add([
        rect(width(), FLOOR_HEIGHT),
        pos(0, height()),
        anchor("botleft"),
        area(),
        body({ isStatic: true }),
        color(255, 180, 255),
        outline(4),
        "floor",
    ]);

    function jump() {
        if (player.isGrounded()) {
            player.use(sprite("pennywiseJumping"));
            player.play("jump");
            player.jump(JUMP_FORCE);
        }
    }

    player.onGround(() => {
        player.use(sprite("pennywiseRunning"));
        player.play("run");
    });

    onKeyPress("space", jump);
    onClick(jump);

    // --- Obstacles ---
    function spawnTree() {
        add([
            rect(48, rand(32, 96)),
            area(),
            outline(4),
            pos(width(), height() - FLOOR_HEIGHT),
            anchor("botleft"),
            color(255, 180, 255),
            move(LEFT, speed),
            "tree",
        ]);

        wait(rand(1, 1.5), spawnTree);
    }

    spawnTree();

    player.onCollide("tree", () => {
        go("lose", score);
        burp();
        addKaboom(player.pos);
    });

    // --- UI & Score ---
    const scoreLabel = add([text(score), pos(24, 24)]);

    onUpdate(() => {
        score++;
        scoreLabel.text = score;
        speed += 0.01;
    });
});

scene("lose", (score) => {
    add([
        sprite("pennywise"),
        pos(width() / 2, height() / 2 - 80),
        scale(0.6),
        anchor("center"),
    ]);

    add([
        text(score),
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
    volume: 0.5,
    speed: 1,
    loop: true,
});