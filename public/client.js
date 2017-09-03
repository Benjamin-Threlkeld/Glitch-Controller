(function () {
//define globals
/* global PIXI */

// object to control
class Bunny {
    constructor () {
        this.graphic = new PIXI.Graphics()
        this.color = 0xFF700B
        this.control = {
            angle: 0,
            velocity: {x: 0, y: 0}
        }
        this.speed = 0.1
    }

    draw (stage) {
        this.graphic.lineStyle(2, 0x0000FF, 1);
        this.graphic.beginFill(this.color, 1);
        this.graphic.drawRect(0, 0, 50, 100);

        this.sprite = new PIXI.Sprite(this.graphic.generateTexture())
        // center the sprite's anchor point
        this.sprite.anchor.set(0.5);

        // move the sprite to the center of the screen
        this.sprite.x = app.renderer.width / 2;
        this.sprite.y = app.renderer.height / 2;

        stage.addChild(this.sprite);
    }
    update(delta) {
        console.log(this.control.velocity)
        this.sprite.rotation = this.control.angle + Math.PI / 2

        // TODO: use real velocity vector
        this.sprite.x += Math.sin(this.sprite.rotation) * (Math.abs(this.control.velocity.x) * this.speed)
        this.sprite.y -= Math.cos(this.sprite.rotation) * (Math.abs(this.control.velocity.y) * this.speed)
    }


    
}
Game = {}
Game.opt = {
    controller: true,
    dev: true
}

Game.cursor = {
    down: false,
    x: 0,
    y: 0
}

// Controller
class Controller {
    constructor (stage, controlee) {
        this.stage = stage
        this.stage.interactive = true
        this.x = 0 //where the controls should show
        this.y = 0
        this.hidden = true;
        this.s = {};
        this.defaults = {
            radius: 50,
            stickRadius: 20,
            alpha: 0.5,
            activeAlpha: 1
        }
        this.dev = {}

        this.angle = 0
        this.velocity = {x: 0, y: 0}

        this.controlee = controlee
    }

    draw () {
        //outline
        this.s.controls = new PIXI.Container()
        this.s.texture = PIXI.Texture.fromImage('./images/controllerCircle.svg')
        this.s.touchDown = new PIXI.Sprite(this.s.texture)
        this.s.touchDown.anchor.set(0.5,0.5)
        this.s.touchDown.height = this.defaults.radius * 2
        this.s.touchDown.width = this.defaults.radius * 2
        this.s.touchDown.alpha = this.defaults.alpha
        
        //stick
        this.s.stick = new PIXI.Sprite(this.s.texture)
        this.s.stick.anchor.set(0.5,0.5)
        this.s.stick.height = this.defaults.stickRadius * 2
        this.s.stick.width = this.defaults.stickRadius * 2

        //dev view
        this.dev.container = new PIXI.Container()


        //line
        this.dev.line = new PIXI.Graphics()

        //add elements
        //dev
        if (Game.opt.dev) {
            this.dev.container.addChild(this.dev.line)
            this.stage.addChild(this.dev.container)
        }

        //use
        this.s.controls.addChild(this.s.touchDown)
        this.s.controls.addChild(this.s.stick)
        this.stage.addChild(this.s.controls)

        app.renderer.plugins.interaction.on('pointerdown', this.onDown.bind(this));
        this.stage.on('pointermove', this.onMove.bind(this))
        app.renderer.plugins.interaction.on('pointerup', this.onUp.bind(this));
    }

    onDown (event) {
        Game.cursor.down = Date.now()
        Game.cursor.downX = Game.cursor.x = event.data.global.x
        Game.cursor.downY = Game.cursor.x = event.data.global.y

        this.s.touchDown.alpha = this.defaults.activeAlpha

        this.s.controls.x = event.data.global.x
        this.s.controls.y = event.data.global.y

    }
    onMove (event) {
        Game.cursor.x = event.data.global.x
        Game.cursor.y = event.data.global.y
    }
    onUp () {

        Game.cursor.down = false;
        this.s.touchDown.alpha = this.defaults.alpha
        this.s.stick.position.set(0,0)
        this.velocity = {x:0,y:0}
    }
    controleeUpdate () {
        this.controlee.control.angle = this.angle
        this.controlee.control.velocity = this.velocity
    }

    update (delta) {
        if (Game.cursor.down) {

            // distance of two points
            this.deltaX = Game.cursor.downX - Game.cursor.x
            this.deltaY = Game.cursor.downY - Game.cursor.y
            this.absXY = {x: Math.abs(this.deltaX), y: Math.abs(this.deltaY)}
            this.distance = Math.sqrt((this.absXY.x * this.absXY.x) + this.absXY.y * this.absXY.y)
            
            var vec = {
                x: Game.cursor.x-Game.cursor.downX,
                y: Game.cursor.y-Game.cursor.downY
            }

            var dx = Game.cursor.x-Game.cursor.downX;
            var dy = Game.cursor.y-Game.cursor.downY;
            this.angle = Math.atan2(dy, dx);
            
            //limit
            if (this.distance > this.defaults.radius) {
                var dx = Math.cos(this.angle) * (this.defaults.radius);
                var dy = Math.sin(this.angle) * (this.defaults.radius);
            }

            // TODO: normalize and limit vector 
            this.s.stick.x = dx
            this.s.stick.y = dy
            this.velocity = vec


            // dev things
            if (Game.opt.dev) {
                this.dev.line.clear();
                this.dev.line.lineStyle(2, 0xffd900, 1);

                //evaluated line
                this.dev.line.position.set(Game.cursor.downX, Game.cursor.downY)
                this.dev.line.moveTo(0,0);
                this.dev.line.lineTo(this.distance, 0);

                this.dev.line.rotation = this.angle;
            }
        }
        this.controleeUpdate(delta)
    }

}

var app

function initPixi() {
    app = new PIXI.Application(800, 600, {backgroundColor: 0x1099bb});
    document.body.appendChild(app.view);

    setup()
}

var bun
function setup() {
    app.hud = new PIXI.Container();
    app.hud.width = app.renderer.width
    app.hud.height = app.renderer.height
    console.log(app.hud.height)

    app.level = new PIXI.Container();
    app.stage.addChild(app.level)
    app.stage.addChild(app.hud)
    
    bun = new Bunny
    bun.draw(app.level)

    cont = new Controller(app.hud, bun);
    cont.draw();
    
    app.ticker.add(update);
}

function update(delta) {
    cont.update(delta)
    bun.update(delta)
}

initPixi()
  
}).call(this)

