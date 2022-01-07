import "./style.css";

const $red = document.getElementById("red");
const $green = document.getElementById("green");
const $blue = document.getElementById("blue");
const $result = document.getElementById("result");
const $resultText = document.getElementById("result-text");

$red.addEventListener("input", redHandler);
$green.addEventListener("input", greenHandler);
$blue.addEventListener("input", blueHandler);

const colour = {
  red: 0,
  green: 0,
  blue: 0
};

function redHandler(e) {
  colour.red = e.currentTarget.value;
  update(colour);
}

function greenHandler(e) {
  colour.green = e.currentTarget.value;
  update(colour);
}

function blueHandler(e) {
  colour.blue = e.currentTarget.value;
  update(colour);
}

function update({ red, green, blue }) {
  const colour = `rgba(${red}, ${green}, ${blue})`;
  $result.style.backgroundColor = colour;

  if (red * 0.299 + green * 0.587 + blue * 0.114 > 186) {
    $resultText.style.color = "#000000";
  } else {
    $resultText.style.color = "#ffffff";
  }

  $resultText.innerText = colour;
}
