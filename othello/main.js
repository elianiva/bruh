import { Othello } from "./othello";
import "./style.css";

const $canvas = document.getElementById("board");

const othello = new Othello({ canvas: $canvas, dimension: 560 });
othello.render();
