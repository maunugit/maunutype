import React from 'react';
import WpmChart from './WpmChart';

const Results = ({ typingData, wpm, correctCharCount, incorrectCharCount, accuracy }) => {
  return (
    <div className="results-container">
      <div className="user-typing-results">
        <h2>results</h2>
    
        <p>WPM: {wpm} </p>
        <p>correct: {correctCharCount}</p>
        <p>incorrect: {incorrectCharCount}</p>
        <p>accuracy: {accuracy}</p>
        
      </div>
      <div className="wpm-chart-container">
        <WpmChart data={typingData} />
      </div>
    </div>
  );
};


export default Results;
