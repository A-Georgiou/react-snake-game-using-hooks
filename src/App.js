import React, { useState, useEffect, useRef } from 'react';
import Snake from './snake';
import Food from './food';
import Highscore from './highscores'
import Firebase from "firebase"


Firebase.initializeApp({
  apiKey: 'AIzaSyD7dW7uuHcjshc12wmfrz5IC-eKzXVXhU0',
  authDomain: 'https://react-snake-4f75f.firebaseio.com/',
  projectId: 'react-snake-4f75f'
});

let db = Firebase.firestore();

var scoreTable = db.collection("scores");

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App() {
  const getRandCoords = () => {
    let min = 1;
    let max = 98;
    let x = Math.floor((Math.random()*(max-min+1)+min)/2)*2;
    let y = Math.floor((Math.random()*(max-min+1)+min)/2)*2;
    return [x,y]
  }
  const [snakeDots, setSnakeDots] = useState([[0,0],[2,0]]);
  const [food, setFood] = useState(getRandCoords);
  const [direction, setDirection] = useState('RIGHT');
  const [speed, setSpeed] = useState(200);
  const [gameOver, setGameOver] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [textField, setTextField] = useState("");
  const [scoreSheet, setScoreSheet] = useState([]);

  useEffect(() => {
    getScores();
  }, [clicked]);

  useEffect(() => {
    let head = snakeDots[snakeDots.length-1]
    checkIfEaten(head);
    checkOutOfBounds(head);
    checkIfCollapsed(head);
  })

  const checkOutOfBounds = (head) => {
    if (head[0] >= 100 || head[1] >= 100 || head[0] < 0 || head[1] < 0){
      setGameOver(true);
    }
  }

  const checkIfCollapsed = (head) => {
    let snake = [...snakeDots];
    snake.pop();
    snake.forEach(dot => {
      if(head[0] === dot[0] && head[1] === dot[1]){
        setGameOver(true);
      }
    })
  }

  const checkIfEaten = (head) => {
   if(head[0] === food[0] && head[1] === food[1]){
    generateFood();
    enlargeSnake();
    if(speed > 50){
      setSpeed(speed-10);
    }
   }
  }

  useInterval(() => {
    document.onkeydown = onKeyDown;
    moveSnake();
  }, speed)
  

  const onKeyDown = (e) =>{
    e = e || window.event;
    switch (e.keyCode){
      case 38:
        if(direction !== 'DOWN') setDirection('UP');
        break; 
      case 40:
        if(direction !== 'UP') setDirection('DOWN');
        break;
      case 37:
        if(direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 39:
        if(direction !== 'LEFT') setDirection('RIGHT');
        break;
      default:
        break;
    }
  }

  const moveSnake = () => {
    let dots = [...snakeDots];
    let head = dots[dots.length -1];
    switch(direction){
      case 'RIGHT':
        head = [head[0] + 2, head[1]];
        break;
      case 'LEFT':
        head = [head[0] - 2,head[1]];
        break;
      case 'DOWN':
        head = [head[0], head[1] + 2];
        break;
      case 'UP':
        head = [head[0], head[1] - 2];
        break;
      default:
        break;
    }
    dots.push(head);
    dots.shift();
    setSnakeDots(dots);
  }

  const generateFood = () => {
    let foodCoords = getRandCoords;
    let snake = [...snakeDots];
    snake.forEach(dot => {
      if(foodCoords[0] === dot[0] && foodCoords[1] === dot[1]){
        generateFood();
      }
    })

    setFood(foodCoords)
  }

  const enlargeSnake = () => {
      let newSnake = [...snakeDots];
      newSnake.unshift([]);
      setSnakeDots(newSnake);
  }

  const restartGame = () => {
    setClicked(false);
    setGameOver(false);
    setSpeed(200);
    setDirection('RIGHT');
    setSnakeDots([[0,0], [2,0]]);
    setFood(getRandCoords);
    setTextField("");
  }


  const addScore = () => {
    setClicked(true)
    scoreTable.add({
      name: textField,
      scores: ((snakeDots.length-2)*10)
    }).then(function(docRef) {
      console.log("Document written with ID: ", docRef.id);
    }).catch(function(error) {
      console.error("Error adding document: ", error);
    });
  }

  const updateScore = (scoreSheet)=>{
    scoreSheet.sort((a,b)=>{return b.scores-a.scores})
    scoreSheet = scoreSheet.slice(0,10)
    setScoreSheet(scoreSheet);
  }

  const getScores = () => {
    let tempScores = []
    db.collection("scores").get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        tempScores.push(doc.data());
      });
      updateScore(tempScores);
    }).catch(function(error){
      console.log("Error getting doc: ", error)
    });
  }

  const handleChange = (e) => {
    if(e.target.value.length <= 15){
      setTextField(e.target.value);
    }
  }
  
  let content = (
    <div>
      <div className="game-area">
        <Snake snakeDots={snakeDots}></Snake>
        <Food dot={food}></Food>
      </div>
      <h3 className="score">Score: {(snakeDots.length-2)*10}</h3>
    </div>
    );
    
    if(gameOver){
      content = (
        <div className="game-over">
          <h1>Game Over.</h1>
          <h3>Score: {(snakeDots.length-2)*10}</h3>
          <table className="highscore-table">
            <tbody>
              <Highscore highscores={scoreSheet}></Highscore>
            </tbody>
          </table>
          <input type="text" className="inputName" onChange={handleChange} placeholder="Enter Name:"></input>
          <br/>
          <button onClick={restartGame}>Try Again.</button>
          <button disabled={clicked} onClick={addScore}>Add Score.</button>
        </div>
      );
    }

    return content;
}

export default App;
