class Game {
  constructor({ bgFrame, uiFrame, gameFrame }) {
    this.INTERVAL = 10;
    this.WIDTH = 960;
    this.HEIGHT = 600;

    this.FUEL_MAX = 30 * 1000; // 30 seconds
    this.FUEL_WIDTH = 240;
    this.FUEL_HEIGHT = 24;
    this.FUEL_BG = "rgba(255, 255, 255, 0.1)";
    this.FUEL_FG = "#2B6CB0";

    this.TEXT_FG = "#ffffff";
    this.MAIN_BG = "#121212";

    this.PLAYER_SIZE = 42;
    this.PLAYER_COLOUR = "#E53E3E";
    this.PLAYER_SPEED = 5;

    this.BULLET_SIZE = 8;
    this.BULLET_COLOUR = "#ECC94B";
    this.BULLET_SPEED = 5;

    this.CONTROLS = {
      up: "w",
      left: "a",
      down: "s",
      right: "d",
      shoot: " " // space
    };

    /** @type {HTMLCanvasElement} */
    this._bgFrame = bgFrame;
    /** @type {HTMLCanvasElement} */
    this._gameFrame = gameFrame;
    /** @type {HTMLCanvasElement} */
    this._uiFrame = uiFrame;

    /** @type {CanvasRenderingContext2D} */
    this._bgCtx = bgFrame.getContext("2d");
    /** @type {CanvasRenderingContext2D} */
    this._gameCtx = gameFrame.getContext("2d");
    /** @type {CanvasRenderingContext2D} */
    this._uiCtx = uiFrame.getContext("2d");

    /** @type {DOMRect} */
    this._bgRect = bgFrame.getBoundingClientRect();
    /** @type {DOMRect} */
    this._gameRect = gameFrame.getBoundingClientRect();
    /** @type {DOMRect} */
    this._uiRect = uiFrame.getBoundingClientRect();

    // TODO: change this
    this._currentFuel = 30 * 1000; // 15 seconds
    this._currentScore = 0;

    this._playerPos = {
      x: 60,
      y: this.HEIGHT / 2 - this.PLAYER_SIZE / 2
    };

    this._isPressing = false;
    this._pressed = {};

    this._bullets = {};
  }

  _cleanFrame(ctx) {
    ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
  }

  _runFrames(ctx, intervalTime, callback) {
    const interval = setInterval(() => {
      this._cleanFrame(ctx);

      callback();

      if (this._currentFuel <= 0) {
        this._gameCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        this._uiCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        clearInterval(interval);
        console.error("game over");
      }
    }, intervalTime);
  }

  _drawScore() {
    const ctx = this._uiCtx;

    ctx.beginPath();
    ctx.textBaseline = "top";
    ctx.textAlign = "end";
    ctx.font = "Bold 30px Arial";
    ctx.fillStyle = this.TEXT_FG;
    ctx.fillText(this._currentScore, this.WIDTH - 20, 20);
  }

  _drawFuelBar() {
    const ctx = this._uiCtx;

    ctx.beginPath();
    ctx.rect(20, 20, this.FUEL_WIDTH, this.FUEL_HEIGHT);
    ctx.fillStyle = this.FUEL_BG;
    ctx.fill();

    ctx.beginPath();
    ctx.rect(
      20,
      20,
      (this._currentFuel / this.FUEL_MAX) * this.FUEL_WIDTH,
      this.FUEL_HEIGHT
    );
    ctx.fillStyle = this.FUEL_FG;
    ctx.fill();
  }

  _drawBg() {
    const ctx = this._bgCtx;
    ctx.beginPath();
    ctx.rect(0, 0, this.WIDTH, this.HEIGHT);
    ctx.fillStyle = this.MAIN_BG;
    ctx.fill();
  }

  _drawPlayer() {
    const ctx = this._gameCtx;
    const posX = this._playerPos.x;
    const posY = this._playerPos.y;

    ctx.moveTo(posX, posY);
    ctx.beginPath();
    ctx.lineTo(posX + this.PLAYER_SIZE, posY + this.PLAYER_SIZE / 2);
    ctx.lineTo(posX, posY + this.PLAYER_SIZE);
    ctx.lineTo(posX + this.PLAYER_SIZE / 3, posY + this.PLAYER_SIZE / 2);
    ctx.lineTo(posX, posY);
    ctx.fillStyle = this.PLAYER_COLOUR;
    ctx.fill();
  }

  _shoot() {
    const id = Date.now();
    const position = {
      id: id,
      x: this._playerPos.x + this.PLAYER_SIZE,
      y: this._playerPos.y + this.PLAYER_SIZE / 2
    };

    this._bullets[id] = position;

    const interval = setInterval(() => {
      this._bullets[id].x += this.BULLET_SPEED;

      if (this._bullets[id].x - this.BULLET_SIZE > this.WIDTH) {
        clearInterval(interval);
        delete this._bullets[id];
      }
    }, 10);
  }

  _drawBullets() {
    if (this._bullets.length <= 0) return;

    const ctx = this._gameCtx;
    for (const { x, y } of Object.values(this._bullets)) {
      ctx.beginPath();
      ctx.arc(x, y, this.BULLET_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.BULLET_COLOUR;
      ctx.fill();
    }
  }

  _movePlayer(direction) {
    if (this._isPressing) return;
    const interval = setInterval(() => {
      if (direction === "up") {
        if (this._playerPos.y < 0) return;
        this._playerPos.y -= this.PLAYER_SPEED;
      }
      if (direction === "down") {
        if (this._playerPos.y + this.PLAYER_SIZE > this.HEIGHT) return;
        this._playerPos.y += this.PLAYER_SPEED;
      }
      if (!this._isPressing) {
        clearInterval(interval);
      }
    }, 20);
  }

  _attachController() {
    window.addEventListener("keydown", (e) => {
      // only accepts valid controls
      if (!Object.values(this.CONTROLS).includes(e.key)) return;

      if (e.key === this.CONTROLS.shoot) {
        this._shoot();
        return;
      }

      this._pressed[e.key] = true;

      if (this._pressed[this.CONTROLS.up]) this._movePlayer("up");
      if (this._pressed[this.CONTROLS.down]) this._movePlayer("down");

      this._isPressing = true;
    });

    window.addEventListener("keyup", (e) => {
      // only accepts valid controls
      if (!Object.values(this.CONTROLS).includes(e.key)) return;

      if (e.key === this.CONTROLS.shoot) return;

      this._pressed[e.key] = false;
      this._isPressing = false;
    });
  }

  _startBgFrame() {
    // we need this here to make it instantly draw on initial render without
    // waiting the interval
    this._drawBg();

    this._runFrames(this._bgCtx, this.INTERVAL, () => {
      this._drawBg();
    });
  }

  _startGameFrame() {
    // we need this here to make it instantly draw on initial render without
    // waiting the interval
    this._drawPlayer();

    this._attachController();

    this._runFrames(this._gameCtx, this.INTERVAL, () => {
      this._drawPlayer();
      this._drawBullets();
    });
  }

  _startUiFrame() {
    // we need this here to make it instantly draw on initial render without
    // waiting the interval
    this._drawFuelBar();

    this._runFrames(this._uiCtx, this.INTERVAL, () => {
      this._drawFuelBar();
      this._currentFuel -= this.INTERVAL;

      this._drawScore();
    });
  }

  start() {
    this._startBgFrame();
    this._startUiFrame();
    this._startGameFrame();
  }
}

function main() {
  const bgFrame = document.getElementById("bg-frame");
  const gameFrame = document.getElementById("game-frame");
  const uiFrame = document.getElementById("ui-frame");

  const game = new Game({ bgFrame, gameFrame, uiFrame });
  game.start();
}

window.onload = main;
