import React, { useState, useEffect, useRef } from 'react';

import './App.css';
// import { Line } from 'react-chartjs-2';
import { shuffleArray, calculateWPM, calculateAccuracy } from './CalculateWPM'; // Import WPm calculation from CalculateWPM.js
import words from './Words'; // Import words from Words.js
import Results from './Results';
import Timer from './Timer.js';


function App() {
  const [currentWord, setCurrentWord] = useState([]);
  // const [wpmData, setWpmData] = useState([]);
  const [typingData, setTypingData] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [started, setStarted] = useState(false);
  const [wpm, setWPM] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [correctCharCount, setCorrectCharCount] = useState(0);
  const [typedCharCount, setTypedCharCount] = useState(0); // New state variable to count total characters typed
  const [accuracy, setAccuracy] = useState(0);

  const timerRef = useRef(null);
  const inputRef = useRef(null);


  const [currentLine, setCurrentLine] = useState(0); // this will track the current line.

  //const [currentWord, setCurrentWord] = useState(shuffledWords[currentWordIndex].split("").map(char => ({ char, correct: true })));
  
  const [shuffledWords, setShuffledWords] = useState(shuffleArray(words));
  const renderWord = (word, adjustedIndex) => (
    <React.Fragment key={adjustedIndex}>
      <span className={adjustedIndex === currentWordIndex ? 'CurrentWord' : ''}>
        {adjustedIndex === currentWordIndex ? (
          currentWord.map((letterObj, charIndex) => (
            <span key={charIndex} className={letterObj.correct ? '' : 'incorrect'}>

              {letterObj.char}
            </span>
          ))
        ) : (
          word
        )}
      </span>
      {adjustedIndex < (currentLine + 2) * 10 - 1 && ' '}
    </React.Fragment>
  );

  const startTest = () => {
    setStarted(true);
    timerRef.current && timerRef.current.start(); // Start the timer
    setStartTime(Date.now());
    setCurrentWordIndex(0);
    setCurrentWord(shuffledWords[0].split("").map(char => ({ char, correct: true })));
    setCorrectCharCount(0);
    setTypedCharCount(0);
    
  };

 

  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();  // Prevent the default behavior
      restartTest();          // Restart the test
    }
  };

  const restartTest = () => {
    timerRef.current.restart(); // New timer reset
    inputRef.current.focus(); // Make sure the input field is ready for typing automatically
    setTypingData([]); // Reset the typing data
    setStarted(false); // Test will be marked as not started
    setCurrentWordIndex(0); // Start from the first word
    setUserInput(''); // Clear user input
    setTimeLeft(15); // Reset the timer
    setWPM(0); // Reset Words Per Minute
    setFinished(false); // Mark test as not finished
    setCorrectCharCount(0); // Reset the count of correctly typed characters
    setTypedCharCount(0); // Reset the count of total typed characters
    setAccuracy(0); // Reset accuracy
    setCurrentLine(0); // Reset the current line
    // Optionally shuffle the words again if you want a new sequence on each restart
    const newShuffledWords = shuffleArray(words);
    setShuffledWords(newShuffledWords);
    setCurrentWord(newShuffledWords[0].split("").map(char => ({ char, correct: true })));
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
  
    // Cleanup: remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  

  const handleInputChange = (event) => {
    if (!started) {
      startTest();
      timerRef.current.start();
      
    }
    const inputText = event.target.value;
    setUserInput(inputText);
    

    let correctCharsInCurrentInput = 0;
    
    const updatedCurrentWord = currentWord.map((letterObj, index) => {
        if (index < inputText.length) {
            if (letterObj.char === inputText[index]) {
                correctCharsInCurrentInput++;
            }
            return {
                char: letterObj.char,
                correct: letterObj.char === inputText[index]
            };
        }
        return letterObj;
    });

    setCurrentWord(updatedCurrentWord);

    if (inputText.endsWith(' ') || currentWordIndex === shuffledWords.length - 1) {
        // Update total typed chars (excluding space)
        setTypedCharCount(prevCount => prevCount + inputText.trim().length);

        // If the current word is typed correctly, then update correctCharCount
        setCorrectCharCount(prevCount => prevCount + correctCharsInCurrentInput);

        if (currentWordIndex < shuffledWords.length - 1) {
            setCurrentWordIndex(currentWordIndex + 1);
            setCurrentWord(
              
                shuffledWords[currentWordIndex + 1].split("").map(char => ({
                    char,
                    correct: true
                }))
            ); // Set the next word
            if ((currentWordIndex + 1) % 10 === 0) {
              setCurrentLine(currentLine + 1);
            }
            
            setUserInput('');
        } else {
            setFinished(true);
        }
    }
};

const renderLine = (lineNum) => (
  <div className="WordsLine">
    {
      shuffledWords.slice(lineNum * 10, lineNum * 10 + 10).map((word, index) => {
        const adjustedIndex = lineNum * 10 + index;
        return renderWord(word, adjustedIndex);
      })
    }
  </div>
);
useEffect(() => {
  // This will set the focus to the input field when the component mounts
  inputRef.current.focus();
}, []);
// console.log("Time Left:", timeLeft, "Seconds:", elapsedSeconds, "WPM:", currentWpm);
useEffect(() => {
  const newShuffledWords = shuffleArray(words);
  setShuffledWords(newShuffledWords);
  setCurrentWord(newShuffledWords[0].split("").map(char => ({ char, correct: true })));
}, []);


useEffect(() => {
  if (timeLeft === 0) {
    const newWPM = calculateWPM(startTime, correctCharCount);
    const accuracyValue = calculateAccuracy(correctCharCount, typedCharCount);
    
    setWPM(newWPM);
    setAccuracy(accuracyValue);
    setFinished(true);
  }
}, [timeLeft]);

  return (
    <div className="App">
      <div className="Title">
      <h1>MaunuType</h1>
      </div>
      <Timer 
        duration={15}
        ref={timerRef}
        onTimeUpdate={(elapsedTime) => {
          const currentWpm = calculateWPM(startTime, correctCharCount);
          console.log("Elapsed Time:", elapsedTime, "WPM:", currentWpm);
          setTypingData(prevData => [...prevData, { seconds: elapsedTime, wpm: currentWpm }]);
        }}
        onTimeEnd={() => {
          setTimeLeft(0);
          setFinished(true);
  }}
/>
      
      <div className="Instructions">press tab to restart</div>
      <div className="Words">
        {renderLine(currentLine)}
        {renderLine(currentLine + 1)}
    </div>

<div className="UserInputContainer">
<input
    type="text"
    className="UserInput"
    ref={inputRef}
    // placeholder="Start typing..."
    value={userInput}
    onChange={handleInputChange}
    disabled={timeLeft === 0}
/>

{ <button onClick={restartTest}>↻</button> }
</div>

   {finished && timeLeft === 0 && (   
  <div className="Result">
    <br />
    <Results 
        typingData={typingData} 
        wpm={wpm}
        correctCharCount={correctCharCount}
        incorrectCharCount={typedCharCount - correctCharCount}
        accuracy={accuracy}   
        />
  </div>
   )}
   </div>
  );
}
export default App; 