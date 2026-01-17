import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

kaplay();

// load a sprite "bean" from an image
loadSprite("bean", "sprites/bean.png");

// putting together our player character
const bean = add([sprite("bean"), pos(80, 40), area(), body()]);

// .jump() when "space" key is pressed
onKeyPress("space", () => {
    if (bean.isGrounded()) {
        bean.jump();
    }
});

bean.onCollide("tree", () => {
    addKaboom(bean.pos);
    shake();
});

// add platform
add([
    rect(width(), 58),
    pos(0, height() - 48),
    outline(4),
    area(),
    body({ isStatic: true }),
    color(127, 200, 255),
]);

function spawnTree() {
    add([
        rect(48, rand(24, 64)),
        area(),
        outline(4),
        pos(width(), height() - 48),
        anchor("botleft"),
        color(255, 180, 255),
        move(LEFT, 240),
        "tree",
    ]);
    wait(rand(0.5, 1.5), () => {
        spawnTree();
    });
}

spawnTree();

setGravity(1600);