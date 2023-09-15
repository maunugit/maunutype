import React, { useState, useEffect, useRef, useCallback } from 'react';

import './App.css';

import { shuffleArray, calculateWPM, calculateAccuracy } from './CalculateWPM';
import wordsByLanguage from './Words'; 
import Results from './Results';
import Timer from './Timer.js';

function App() {
  const [typingMetrics, setTypingMetrics] = useState({
    wpm: 0,
    accuracy: 0,
    correctCharCount: 0,
    typedCharCount: 0
  });
  

  const [currentLanguage, setCurrentLanguage] = useState("english"); // default to English

  const [typingData, setTypingData] = useState([]);
  const [currentWord, setCurrentWord] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsWithLetterStates, setWordsWithLetterStates] = useState([]);
  
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [testDuration, setTestDuration] = useState(15); // Default to 15 seconds

  const [started, setStarted] = useState(false);
  
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  
  const timerRef = useRef(null);
  const inputRef = useRef(null)
  const [currentLine, setCurrentLine] = useState(0); // this will track the current line.
  
  const [shuffledWords, setShuffledWords] = useState(shuffleArray(wordsByLanguage[currentLanguage]));



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
          wordsWithLetterStates[adjustedIndex]?.map((letterObj, charIndex) => (
            <span key={charIndex} className={letterObj.correct ? '' : 'incorrect'}>
              {letterObj.char}
            </span>
          )) || word
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
    setTypingMetrics(prevMetrics => ({
      ...prevMetrics,
      correctCharCount: 0,
    typedCharCount: 0
    }));
  };
  const restartTest = () => {
    timerRef.current.restart(); // New timer reset
    setTimeout(() => {
      inputRef.current.focus();
    }, 100);
    
    setTypingData([]); // Reset the typing data
    setStarted(false); // Test will be marked as not started
    setCurrentWordIndex(0); // Start from the first word
    setUserInput(''); // Clear user input
    setTimeLeft(testDuration); // Reset the timer
    setTypingMetrics(prevMetrics => ({
      ...prevMetrics,
      wpm: 0,
      accuracy: 0,
      correctCharCount: 0,
      typedCharCount: 0
    }));
    
    
    setFinished(false); // Mark test as not finished
     // Reset accuracy
    setCurrentLine(0); // Reset the current line
    setWordsWithLetterStates([]);


    // Optionally shuffle the words again if you want a new sequence on each restart
    const newShuffledWords = shuffleArray(wordsByLanguage[currentLanguage]);
    setShuffledWords(newShuffledWords);
    setCurrentWord(newShuffledWords[0].split("").map(char => ({ char, correct: true })));
  };

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      event.preventDefault();  // Prevent the default behavior
      restartTest();          // Restart the test
    }
  }, [restartTest]); // Include all state or props that are used inside handleKeyDown

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  

  

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
              return { char: letterObj.char, correct: true };
          }
          return { char: letterObj.char, correct: false };
      }
      return letterObj;
  });
 

    setCurrentWord(updatedCurrentWord);
    setWordsWithLetterStates(prevWords => {
      const updatedWords = [...prevWords];
      updatedWords[currentWordIndex] = updatedCurrentWord;
      return updatedWords;
    });
    

    if (inputText.endsWith(' ') || currentWordIndex === shuffledWords.length - 1) {
      for (let i = inputText.length; i < currentWord.length; i++) {
        updatedCurrentWord[i] = {
            char: currentWord[i].char,
            correct: false
        };
    }
    setTypingMetrics(prevMetrics => ({
      ...prevMetrics,
      correctCharCount: prevMetrics.correctCharCount + correctCharsInCurrentInput,
      typedCharCount: prevMetrics.typedCharCount + inputText.trim().length
    }));
        
    

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

useEffect(() => {
  const newShuffledWords = shuffleArray(wordsByLanguage[currentLanguage]);
  setShuffledWords(newShuffledWords);
  setCurrentWord(newShuffledWords[0].split("").map(char => ({ char, correct: true })));
}, [currentLanguage]);  // shuffle when the language changes



useEffect(() => {
  if (timeLeft === 0) {
    const newWPM = calculateWPM(startTime, typingMetrics.correctCharCount);
    const accuracyValue = calculateAccuracy(typingMetrics.correctCharCount, typingMetrics.typedCharCount);
    setTypingMetrics(prevMetrics => ({
      ...prevMetrics,
      wpm: newWPM,
      accuracy: accuracyValue

    }));
    

    setFinished(true);
  }
}, [timeLeft]);


  return (
    <div className="App">
      <div className="Title">
      <h1>MaunuType</h1>
      </div>
      
  <div className="test-duration-container">
      <label htmlFor="testDuration">choose test duration: </label>
      <select
        id="testDuration"
        value={testDuration}
        onChange={(e) => setTestDuration(Number(e.target.value))}
        disabled={started}
      >
        <option value={10}>10 seconds</option>
        <option value={15}>15 seconds</option>
        <option value={30}>30 seconds</option>
        <option value={45}>45 seconds</option>
        <option value={60}>60 seconds</option>
      </select>

  </div>

<div className="language-container">
  <label htmlFor="languageSelector">choose a language: </label>
<select value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)}>

    <option value="english">english</option>
    <option value="finnish">finnish</option>
    <option value="swedish">swedish</option>
    <option value="latin">latin</option>
  </select>
  
</div>

      
      <div className="instructions-container">press tab to restart</div>
      <div className="TimerDisplay">
      <Timer 
      
        duration={testDuration}
        ref={timerRef}
        onTimeUpdate={(elapsedTime) => {
          const currentWpm = calculateWPM(startTime, typingMetrics.correctCharCount);
          //console.log("Elapsed Time:", elapsedTime, "WPM:", currentWpm);
          setTypingData(prevData => [...prevData, { seconds: elapsedTime, wpm: currentWpm }]);
        }}
        onTimeEnd={() => {
          setTimeLeft(0);
          setFinished(true);
  }}
/>
</div>
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
    disabled={finished}
    />
    { <button onClick={restartTest}>↻</button> }

    
  </div>
  

  {finished && timeLeft === 0 && (   
  <div className="Result">
    <br />
    {/* <Results metrics={typingMetrics} /> */}

    <Results 
      typingData={typingData}
      wpm={typingMetrics.wpm}
      correctCharCount={typingMetrics.correctCharCount}
      incorrectCharCount={typingMetrics.typedCharCount - typingMetrics.correctCharCount}
      accuracy={typingMetrics.accuracy}   
    />

  </div>
   )}
</div>
  );
}
export default App; 