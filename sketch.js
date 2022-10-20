
let player, score, collectableGroup
let xoff = 0.0

function setup() {

  createCanvas(600, 900);
  fullscreen()
  resizeCanvas(windowWidth, windowHeight);
  frameRate(60);

  collectableGroup = new Group();

  collectableImageP = loadImage('assets/ball_p.png');
  collectableImageN = loadImage('assets/ball_n.png');
  backgroundImage = loadImage('assets/bg.png');

  player = new Player(0, 0)
  score = new Score()
}

function draw() {
  clear()
  background(129,198,214,255)
  image(backgroundImage, -backgroundImage.width / 2 + windowWidth/2, 0);
  intro()

  player.update()
  player.overlap(collectableGroup)
  score.update()

  //drop stuff
  if (frameCount > 7 * 60) {
    if (frameCount % 40 == 0) {
      new Collectable(collectableGroup, 1)
    }

    if (frameCount % 150 == 0) {
      new Collectable(collectableGroup, -1)
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* prevents the mobile browser from processing some default
 * touch events, like swiping left for "back" or scrolling
 * the page.
 */
document.ontouchmove = function(event) {
  event.preventDefault();
};

function intro() {
  textSize(50);
  textAlign(CENTER);
  fill(255, 255, 255);
  if (frameCount < 2 * 60) {
    text("3", width/2, height/2);
  } else if (frameCount < 3 * 60) {
    text('2', width/2, height/2);
  } else if (frameCount < 4 * 60) {
    text('1', width/2, height/2);
  } else if (frameCount < 6 * 60) {
    text('Emplate it!', width/2, height/2);
  }
}

class Player {
  constructor(x, y) {
    this.group = new Group()
    this.bowl = loadImage('assets/bowl.png')
    this.shadow = loadImage('assets/shadow.png')

    // sensor
    this.sensor = new Sprite(x, y - 30, 50, 30)
    this.group.add(this.sensor)

    // colliders
    this.rightCollider = new Sprite(x + 40, y - 30, 15, 50)
    this.leftCollider = new Sprite(x - 40, y - 30, 15, 50)
    this.group.add(this.rightCollider)
    this.group.add(this.leftCollider)

    //
    this.collected = 0
    this.collectedArray = []

    this.targetY = 0

    // for debug
    this.group.color = color(0, 0, 0, 0)
    this.group.visible = false

  }

  overlap(target) {
    this.sensor.overlaps(target, (a, b) => {
      score.add(b.collectableValue)
      if (b.collectableValue > 0) {
        this.collectedArray[this.collected] = createVector(30 + random(-20, 20), -15 + random(-10, 5))
        this.collected++
      }
      b.remove()
      this.shake()
    })
  }

  shake() {
    this.targetY = -80
  }

  update() {
    this.group.rotation = 0

    let dy = 0
    if (this.targetY < 0) {
      dy = this.targetY
      this.targetY += 5
    }

    if (mouse.isOnCanvas) {
      this.group.moveTowards(mouse.x, 700 - dy);
    }

    // player sprite
    push()
    image(this.shadow, this.sensor.x - this.bowl.width / 2, 780)
    translate(this.sensor.x - this.bowl.width / 2, this.sensor.y - this.bowl.height / 2)
    rotate(this.sensor.vel.x / 1.5)
    for (let i = 0; i < this.collected; i++) {
      let c = this.collectedArray[i]
      image(collectableImageP, c.x, c.y)
    }
    image(this.bowl, 0, 0)
    pop()
  }
}

class Score {
  constructor() {
    this.points = 0
  }

  add(value) {
    this.points += value
  }

  decrement() {
    this.points--
  }

  update() {
    image(collectableImageP, 20, 50);
    textSize(40);
    textAlign(LEFT);
    fill(255, 255, 255);
    text(this.points, 60, 80);
  }
}

class Collectable {
  constructor(group, value) {
    let imageSource = (value == 1) ? collectableImageP : collectableImageN
    xoff = xoff + 0.4;
    let perlin = noise(xoff) * width;
    this.sprite = new Sprite(imageSource, perlin, -20)
    this.sprite.vel.y = 10
    this.sprite.collectableValue = value
    group.add(this.sprite)
  }
}