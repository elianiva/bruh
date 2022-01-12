export class Othello {
  constructor({ canvas, dimension }) {
    /** @type {number} */
    this.BOARD_GRID = 8;
    /** @type {string} */
    this.BOARD_COLOUR = "#22c55e";
    /** @type {string} */
    this.BOARD_LINE_COLOUR = "#0f172a";
    /** @type {number} */
    this.BOARD_LINE_THICKNESS = 4;
    /** @type {number} */
    this.GRID_DIMENSION = dimension / this.BOARD_GRID;
    /** @type {number} */
    this.DISK_GAP = 16;
    /** @type {string} */
    this.DISK_BLACK = "#0f172a";
    /** @type {string} */
    this.DISK_WHITE = "#ffffff";

    /** @typedef {{EMPTY: 0; WHITE: 1; BLACK: 2;}} GridState */
    /** @type GridState */
    this._gridState = {
      // since Javascript don't have enum, we'll use this object
      EMPTY: 0,
      WHITE: 1,
      BLACK: 2
    };
    const { EMPTY, WHITE, BLACK } = this._gridState; // easier access
    /** @type {GridState[][]} */
    this._board = [
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, BLACK, WHITE, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, WHITE, BLACK, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
    ];
    this._legalMoves = null;

    /** @type {HTMLCanvasElement} */
    this._canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this._ctx = canvas.getContext("2d");
    /** @type {number} */
    this._dimension = dimension;
    /** @type {GridState} */
    this._currentTurn = BLACK; // black starts first
    /** @type {GridState} */
    this._oppositeTurn = WHITE;
  }

  /**
   * A helper function to help filling a path with colour
   * @param {string} colour - A valid CSS3 colour
   */
  #fill(colour) {
    this._ctx.fillStyle = colour;
    this._ctx.fill();
  }

  /** Draw initial empty board */
  #drawBoard() {
    // set the board dimension
    this._canvas.width = this._dimension;
    this._canvas.height = this._dimension;

    // make the board green
    this._ctx.fillStyle = this.BOARD_COLOUR;
    this._ctx.fillRect(0, 0, this._dimension, this._dimension);

    for (let i = 1; i < this.BOARD_GRID; i++) {
      this._ctx.fillStyle = this.BOARD_LINE_COLOUR;
      // row lines
      this._ctx.fillRect(
        0,
        this.GRID_DIMENSION * i,
        this._dimension,
        this.BOARD_LINE_THICKNESS
      );
      // column lines
      this._ctx.fillRect(
        this.GRID_DIMENSION * i,
        0,
        this.BOARD_LINE_THICKNESS,
        this._dimension
      );
    }
  }

  /** draw board disk state */
  #drawBoardState() {
    // easier enum access
    const { EMPTY, WHITE, BLACK } = this._gridState;
    this._board.forEach((row, rowIdx) => {
      row.forEach((col, colIdx) => {
        const isLegalGrid =
          this._legalMoves[rowIdx][colIdx] === this._currentTurn;
        let diskColour = "";
        if (col === WHITE) diskColour = this.DISK_WHITE;
        if (col === BLACK) diskColour = this.DISK_BLACK;
        if (col === EMPTY) diskColour = this.BOARD_COLOUR;
        if (isLegalGrid) {
          diskColour = "#ff0000";
            // this._currentTurn === WHITE
            //   ? this.DISK_WHITE + "80"
            //   : this.DISK_BLACK + "40";
        }

        const positionOffset = this.GRID_DIMENSION / 2;
        const gridLineOffset = this.BOARD_LINE_THICKNESS / 2;
        // index starts with 0 so we need to add it by 1 to prevent off by one
        const x =
          this.GRID_DIMENSION * (colIdx + 1) - positionOffset + gridLineOffset;
        const y =
          this.GRID_DIMENSION * (rowIdx + 1) - positionOffset + gridLineOffset;
        const radius = (this.GRID_DIMENSION - this.DISK_GAP) / 2;

        // don't draw anything if a legal grid is NOT empty
        if (isLegalGrid && col !== EMPTY) {
          return;
        }

        this._ctx.beginPath();
        this._ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        this.#fill(diskColour);
      });
    });
  }

  /**
   * Finds a disk match in a line (horizontal, vertical, diagonal)
   *
   * @param {DiskType} disk - Which disk do you want to find
   * @param {number} deltaRow - Where to move the row position
   * @param {number} deltaCol - Where to move the column position
   * @param {number} row - The row you want to check, used for anchor
   * @param {number} col - The col you you want to check, used for anchor
   */
  #findLineMatch(disk, deltaRow, deltaCol, row, col) {
    // make sure we don't go off the board
    // make sure we're not off the board
    const isRowOffTheBoard = row + deltaRow < 0 || row + deltaRow > 7;
    const isColOffTheBoard = col + deltaCol < 0 || col + deltaCol > 7;
    if (isRowOffTheBoard || isColOffTheBoard) {
      return false;
    }

    if (this._board[row][col] === disk) {
      return true;
    }

    // when we don't find it, recurse until we found it
    return this.#findLineMatch(
      disk,
      deltaRow,
      deltaCol,
      row + deltaRow,
      col + deltaCol
    );
  }

  /**
   * Check if an adjacent disk is supported, meaning that the adjacent disk is
   * the opposite colour of the current turn
   *
   * @param {GridState} disk - Should be the opposite of current disk turn
   * @param {number} deltaRow - Where to move the row position
   * @param {number} deltaCol - Where to move the column position
   * @param {number} row - Current disk row
   * @param {number} col - Current disk column
   */
  #checkAdjacentSupport(disk, deltaRow, deltaCol, row, col) {
    // make sure we're not off the board
    const isRowOffTheBoard = row + deltaRow < 0 || row + deltaRow > 7;
    const isColOffTheBoard = col + deltaCol < 0 || col + deltaCol > 7;
    if (isRowOffTheBoard || isColOffTheBoard) {
      return false;
    }

    if (this._board[row + deltaRow][col + deltaCol] !== this._oppositeTurn) {
      return false;
    }

    return this.#findLineMatch(
      disk,
      deltaRow,
      deltaCol,
      row + deltaRow + deltaRow,
      col + deltaCol + deltaCol
    );
  }

  /**
   * Find all possible legal move position(s)
   *
   * @param {DiskType} disk - The disk you want to check all of its legal moves
   */
  #findLegalMoves(disk) {
    const { EMPTY } = this._gridState; // easier access

    // always reset
    let legalMoves = [
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
    ];

    this._board.forEach((row, rowIdx) => {
      // prettier-ignore
      row.forEach((_, colIdx) => {
        const nn = this.#checkAdjacentSupport(disk, -1, 0, rowIdx, colIdx);
        const ne = this.#checkAdjacentSupport(disk, -1, 1, rowIdx, colIdx);
        const ee = this.#checkAdjacentSupport(disk, 0, 1, rowIdx, colIdx);
        const se = this.#checkAdjacentSupport(disk, 1, 1, rowIdx, colIdx);
        const ss = this.#checkAdjacentSupport(disk, 1, 0, rowIdx, colIdx);
        const sw = this.#checkAdjacentSupport(disk, 1, -1, rowIdx, colIdx);
        const ww = this.#checkAdjacentSupport(disk, 0, -1, rowIdx, colIdx);
        const nw = this.#checkAdjacentSupport(disk, -1, -1, rowIdx, colIdx);

        if (nn || ne || ee || se || ss || sw || ww || nw) {
          legalMoves[rowIdx][colIdx] = this._currentTurn;
        }
      });
    });

    this._legalMoves = legalMoves;
  }

  /**
   * Flip every valid disk on a line
   *
   * @param {DiskType} disk - The current disk
   * @param {number} row - Current disk row
   * @param {number} col - Current disk column
   */
  #flipLine(disk, deltaRow, deltaCol, row, col) {
    // make sure we're not off the board
    const isRowOffTheBoard = row + deltaRow < 0 || row + deltaRow > 7;
    const isColOffTheBoard = col + deltaCol < 0 || col + deltaCol > 7;
    if (isRowOffTheBoard || isColOffTheBoard) {
      return false;
    }

    // we don't want to flip an empty disk
    if (this._board[row + deltaRow][col + deltaCol] === this._gridState.EMPTY) {
      return false;
    }

    // we finally found the current turn colour
    if (this._board[row + deltaRow][col + deltaCol] === disk) {
      return true;
    }

    if (
      this.#flipLine(disk, deltaRow, deltaCol, row + deltaRow, col + deltaCol)
    ) {
      // change all elements between our starting point and matching disk
      this._board[row + deltaRow][col + deltaCol] = disk;
      return true;
    }

    return false;
  }

  /**
   * Flip every valid disk on the board
   *
   * @param {DiskType} disk - The current turn disk colour
   * @param {number} row - The clicked row
   * @param {number} col - The clicked column
   */
  #flipDisks(disk, row, col) {
    // north
    this.#flipLine(disk, -1, 0, row, col);
    // north east
    this.#flipLine(disk, -1, 1, row, col);
    // east
    this.#flipLine(disk, 0, 1, row, col);
    // south east
    this.#flipLine(disk, 1, 1, row, col);
    // south
    this.#flipLine(disk, 1, 0, row, col);
    // south west
    this.#flipLine(disk, 1, -1, row, col);
    // west
    this.#flipLine(disk, 0, -1, row, col);
    // north west
    this.#flipLine(disk, -1, -1, row, col);
  }

  /** Listen for click events on the board */
  #addClickListener() {
    const { EMPTY } = this._gridState;
    this._canvas.addEventListener("click", (e) => {
      const { top, left } = this._canvas.getBoundingClientRect();
      const clickPos = {
        x: e.x - left,
        y: e.y - top
      };
      const clickedRow = Math.floor(clickPos.y / this.GRID_DIMENSION);
      const clickedCol = Math.floor(clickPos.x / this.GRID_DIMENSION);

      // don't allow clicking on grid with disk
      // also don't allow clicking on illegal move position
      if (
        this._board[clickedRow][clickedCol] !== EMPTY ||
        this._legalMoves[clickedRow][clickedCol] !== this._currentTurn
      ) {
        return;
      }

      this._board[clickedRow][clickedCol] = this._currentTurn;
      // flip every disk between clicked grid and its matching disk
      // then re-render
      this.#flipDisks(this._currentTurn, clickedRow, clickedCol);
      this.#drawBoardState();

      // flip the turn
      const tmp = this._currentTurn;
      this._currentTurn = this._oppositeTurn;
      this._oppositeTurn = tmp;

      // we need to find next legal moves before we re-render the board
      this.#findLegalMoves(this._currentTurn);
      this.#drawBoardState();
    });
  }

  /**
   * Render everything to the board
   */
  render() {
    this.#addClickListener();
    this.#drawBoard();
    this.#findLegalMoves(this._currentTurn);
    this.#drawBoardState();
  }
}
