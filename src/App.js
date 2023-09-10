import React, { useState, useEffect, useRef } from 'react';

import './App.css';

function shuffleArray(array) {
  const shuffledArray = array.slice(); // to avoid mutating the original array
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // swap elements
  }
  return shuffledArray;
}

const words = [
  'hello', 'world', 'react', 'javascript', 'typing', 'challenge',
  'developer', 'programming', 'database', 'computer', 'keyboard', 'speed',
  'green', 'operator', 'complete', 'structure', 'brains', 'tree', 'bright', 'brainstorm', 'insight',
  'probability', 'falsehood', 'cover', 'yellow', 'biomedical', 'before', 'constant'
];



function App() {
  const [currentWord, setCurrentWord] = useState([]);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [started, setStarted] = useState(false);
  const [wpm, setWPM] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [correctCharCount, setCorrectCharCount] = useState(0);
  const [typedCharCount, setTypedCharCount] = useState(0); // New state variable to count total characters typed
  const [accuracy, setAccuracy] = useState(0);


  //const [currentWord, setCurrentWord] = useState(shuffledWords[currentWordIndex].split("").map(char => ({ char, correct: true })));
  const textAreaRef = useRef(null);
  const [shuffledWords, setShuffledWords] = useState(shuffleArray(words));


  


  useEffect(() => {
    const newShuffledWords = shuffleArray(words);
    setShuffledWords(newShuffledWords);
    setCurrentWord(newShuffledWords[0].split("").map(char => ({ char, correct: true })));
}, []);




  useEffect(() => {
    if (started) {
    textAreaRef.current.focus();
  }
    if (started && timeLeft > 0) {
      
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
  
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      calculateWPM();
    }
  }, [started, timeLeft]);
  
  
  

  const startTest = () => {
    setStarted(true);
    setStartTime(Date.now());
    setCurrentWordIndex(0);
  
    setCurrentWord(shuffledWords[0].split("").map(char => ({ char, correct: true })));

    setCorrectCharCount(0);
    setTypedCharCount(0);
  
    textAreaRef.current.focus();

  };
  
  
  

  const handleInputChange = (event) => {
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
            setUserInput('');
        } else {
            setFinished(true);
        }
    }
};

  
  
  
  const calculateWPM = () => {
    const currentTime = Date.now();
    const timeInSeconds = (currentTime - startTime) / 1000;
    const timeInMinutes = timeInSeconds / 60;

    const wordsEquivalent = correctCharCount / 5;
    const calculatedWPM = Math.floor(wordsEquivalent / timeInMinutes);

    const calculatedAccuracy = (correctCharCount / typedCharCount) * 100;
    setAccuracy(Math.round(calculatedAccuracy));  // Round to whole number for cleaner display

    setWPM(calculatedWPM);
    setFinished(true);
};

  
  
  
  

  return (
    <div className="App">
      <h1>MaunuType</h1>
      <div className="Timer">Time: {timeLeft}s</div>
      <div className="Words">
      {shuffledWords.map((word, index) => (
  <React.Fragment key={index}>
    <span className={index === currentWordIndex ? 'CurrentWord' : ''}>
      {index === currentWordIndex ? (
        currentWord.map((letterObj, charIndex) => (
          <span
            key={charIndex}
            style={{ color: letterObj.correct ? 'inherit' : 'red' }}
          >
            {letterObj.char}
          </span>
        ))
      ) : (
        word
      )}
    </span>
    {index < shuffledWords.length - 1 && ' '}
  </React.Fragment>
))}

</div>

<textarea
    ref={textAreaRef}
    className="UserInput"
    placeholder="Start typing..."
    value={userInput}
    onChange={handleInputChange}
    disabled={!started || timeLeft === 0}
/>

      {!started && (
        <button onClick={startTest}>Start Test</button>
      )}
      {finished && (
  <div className="Result">
    Your WPM: {wpm}
    <br />
    Correctly typed characters: {correctCharCount}
    <br />
    Incorrectly typed characters: {typedCharCount - correctCharCount}
    <br />
    Accuracy: {accuracy}% 
  </div>
)}




    </div>
  );
}

export default App;
