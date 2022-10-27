class settings {
	static scale = 1000 / window.innerHeight
	static h = window.innerHeight * this.scale
	static w = window.innerWidth * this.scale
	static bottom = this.h / 4
	static bounce = 40
	static gameArea = 400
}

function preload() {
	this.load.image('bowl', 'assets/bowl.png');
	this.load.image('ballP', 'assets/ball_p.png');
	this.load.image('ballN', 'assets/ball_n.png');
	this.load.image('background', 'assets/bg.png');
	this.load.image('particle', 'assets/particle.png');
	this.load.image('shadow', 'assets/shadow.png');
	this.load.audio('impact_0', 'assets/impactGlass_medium_000.ogg')
	this.load.audio('impact_1', 'assets/impactGlass_medium_001.ogg')
	this.load.audio('impact_2', 'assets/impactGlass_medium_002.ogg')
	this.load.audio('impact_3', 'assets/impactGlass_medium_003.ogg')
}

let score

function create() {
	let bowl = new Bowl(this)
	//this.add.image(settings.w / 2, settings.h / 2, 'background')
	dynamicBackground(this)

	// create collectables
	this.ballGroup = this.add.group()
	this.time.addEvent({
		delay: 480,
		callbackScope: this,
		callback: function () {
			let value = Math.random() * 7 > 1 ? 1 : -1
			let ball = new Ball(this, settings.w / 2 - settings.gameArea / 2 + Math.random() * settings.gameArea, 0, value)
			this.ballGroup.add(ball)
		},
		repeat: 100
	});

	// define collision
	this.physics.add.collider(
		bowl,
		this.ballGroup,
		function (bowl, collectable) {
			bowl.collision(collectable)
		}
	);

	// score
	score = new Score(this, 50, 50)

	// reset
	this.add.text(settings.w - 50, 50, 'Reset', { fontSize: '40px', color: '#ffffff' })
		.setOrigin(1, 0.5)
		.setInteractive()
		.on('pointerdown', () => {
			this.scene.restart();
		});
}

function update() {
}

class Score extends Phaser.GameObjects.Text {
	constructor(scene, x, y) {
		super(scene, x + 25, y, 0, { fontSize: '40px', color: '#ffffff', align: 'left' })
		scene.add.existing(this)
		this.setOrigin(0, 0.5)
		this.shadow = scene.add.sprite(x, y, 'ballP')
		this.score = 0
	}

	add(addScore) {
		this.score += addScore
		this.text = this.score
	}
}


class Ball extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y, value) {
		let image = value > 0 ? 'ballP' : 'ballN'
		super(scene, x, y, image);
		scene.add.existing(this);
		scene.physics.world.enable(this)

		this.color = value > 0 ? '#ffffff' : '#FF0000'
		this.value = value
		this.body.setAllowGravity(false)
		this.body.moves = true
		this.body.velocity.y = 550
		this.setDepth(5)
	}
}

class Bowl extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y) {
		super(scene, settings.w / 2, settings.h - settings.bottom, 'bowl');
		scene.add.existing(this);
		scene.physics.world.enable(this)

		this.body.setAllowGravity(false)
		//this.body.moves = false
		this.setDepth(5)

		//
		this.shadow = scene.add.sprite(this.x, this.y + 80, 'shadow')
		this.shadow.setDepth(5)

		//
		this.collectables = this.scene.add.group()
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta)

		this.scene.physics.moveTo(this, this.scene.input.x, this.y, 500, 70);

		if (this.y > settings.h - settings.bottom + settings.bounce - 5) {
			this.scene.tweens.add({
				targets: this,
				y: settings.h - settings.bottom,
				duration: 150
			});
		}

		// hacky but tweens dont affect velocity
		let rotation = parseInt(this.body.position.x - this.prevPosition)
		this.prevPosition = this.body.position.x
		this.angle = Math.max(Math.min(rotation, 10), -10)

		// update attached sprites
		this.shadow.x = this.x
		this.collectables.children.each(function (collectable) {
			collectable.x = this.x - collectable.deviation / 4
			collectable.y = this.y - collectable.deviationY
		}, this);
	}

	collision(collectable) {
		if (collectable.y > this.y - 35) {
			return
		}

		score.add(collectable.value)
		this.scene.sound.play('impact_' + Math.floor(Math.random() * 4));

		if (collectable.value > 0) {
			let c = this.scene.add.sprite(collectable.x, collectable.y, 'ballP')
			c.deviation = this.x - collectable.x
			c.deviationY = Math.random() * 20 + 10
			c.setDepth(4)
			this.collectables.add(c)

			let particle = this.scene.add.particles('particle');
			particle.setDepth(1);
			this.scene.add.existing(particle);

			particle.createEmitter({
				lifespan: 250,
				maxParticles: 30,
				angle: { min: -25, max: -165 },
				quantity: 15,
				speed: { min: 150, max: 500 },
				scale: { start: 1, end: 0.8 },
				follow: this
			});
		} else {
			let text = this.scene.add.text(this.x, this.y, collectable.value, { fontSize: '24px', color: collectable.color, align: 'center' });
			this.scene.physics.world.enable(text)
			text.setOrigin(0.5)
			text.body.velocity.y = -350
			this.scene.time.delayedCall(600, text.destroy, [], text);
		}

		collectable.disableBody(true, true)



		this.scene.tweens.add({
			targets: this,
			y: this.y + settings.bounce,
			duration: 150
		});
	}
}

function dynamicBackground(scene) {
	// terrible mess (prototypeeee)
	const colors = ['0x41ADC6', '0x70C1D4']
	let size = 70
	let numX = Math.floor(settings.gameArea/size)
	let numY = 7
	let margin = 10
	let x = settings.w / 2 - (size * numX) / 2 - margin * (numX - 1) / 2
	let y = 150
	for (let i = 0; i <= numX; i++) {
		for (let j = 0; j <= numY; j++) {
			let color = colors[Math.floor(Math.random() * 3)]
			if (color != null) {
				var rE = scene.add.rectangle(x + i * (size + margin), y + j * (size + margin), size, size);
				rE.setStrokeStyle(2, color)
			} else {
				scene.add.rectangle(x + i * (size + margin), y + j * (size + margin), size, size, '0x70C1D4');
			}
		}
	}
}

const config = {
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: settings.w,
		height: settings.h,
	},
	backgroundColor: "81C6D6",
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 80 },
			enableBody: true,
			debug: false,
		}
	},
	scene: {
		preload,
		create,
		update,
	}
}

const game = new Phaser.Game(config)