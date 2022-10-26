const gameState = {
	score: 0
}

const settings = {
	h: window.innerHeight * (800 / window.innerHeight),
	w: window.innerWidth * (800 / window.innerHeight),
	bottom: 200,
	bounce: 40
}

function preload() {
	this.load.image('bowl', 'assets/bowl.png');
	this.load.image('ballP', 'assets/ball_p.png');
	this.load.image('ballN', 'assets/ball_n.png');
	this.load.image('background', 'assets/bg.png');
	this.load.image('particle', 'assets/particle.png');
	this.load.image('shadow', 'assets/shadow.png');
}

function create() {
	let bowl = new Bowl(this)
	this.add.image(settings.w / 2, settings.h / 2, 'background')

	// create collectables
	this.ballGroup = this.add.group()
	this.time.addEvent({
		delay: 1500,
		callbackScope: this,
		callback: function () {
			let ball = this.physics.add.sprite(Math.random() * settings.w, 0, 'ballP')
			this.ballGroup.add(ball)
		},
		repeat: 500
	});

	// define collision
	this.physics.add.overlap(
		bowl,
		this.ballGroup,
		function (bowl, collectable) {
			collectable.disableBody(true, true)
			bowl.collision()
		},
		null,
		this
	);
}

function update() {

}

function preUpdate(time, delta) {
}

class Bowl extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, settings.w / 2, settings.h - settings.bottom, 'bowl');
		scene.physics.world.enable(this)
		this.body.setAllowGravity(false)
		this.body.moves = false
		this.setDepth(5)

		//
		this.shadow = scene.add.sprite(this.x, this.y + 80, 'shadow')
		this.shadow.setDepth(5)
		scene.add.existing(this);
	}

	update() {

	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta)

		this.scene.tweens.add({
			targets: this,
			x: this.scene.input.x,
			duration: 600,
			ease: 'Power2'
		});


		if (this.y > settings.h - settings.bottom + settings.bounce - 5) {
			this.scene.tweens.add({
				targets: this,
				y: settings.h - settings.bottom,
				duration: 150
			});
		}

		// hacky but tweens dont affect velocity
		let rotation = parseInt(this.body.position.x - this.prevPosition) / 2
		console.log(rotation)
		this.prevPosition = this.body.position.x
		this.angle = rotation

		// update attached sprites
		this.shadow.x = this.x
	}

	collision() {
		let particle = this.scene.add.particles('particle');
		particle.setDepth(1);
		this.scene.add.existing(particle);

		let text = this.scene.add.text(this.x, this.y, '+1', { font: '30px Courier', color: '#ffffff', align: 'center' });
		this.scene.physics.world.enable(text)
		text.body.velocity.y = -350
		this.scene.time.delayedCall(600, text.destroy, [], text);

		particle.createEmitter({
			lifespan: 250,
			maxParticles: 30,
			angle: { min: -25, max: -165 },
			quantity: 15,
			speed: { min: 150, max: 500 },
			scale: { start: 1, end: 0.8 },
			follow: this
		});

		this.scene.tweens.add({
			targets: this,
			y: this.y + settings.bounce,
			duration: 150
		});
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
		preUpdate,
		update,
	}
}

const game = new Phaser.Game(config)