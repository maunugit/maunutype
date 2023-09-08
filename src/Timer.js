import React, { useState, useEffect } from 'react';

const Timer = ({ initialTime, onTimeUp }) => {
  const [remainingTime, setRemainingTime] = useState(initialTime);
  

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    } else if (remainingTime === 0) {
      onTimeUp();
    }
  }, [remainingTime, onTimeUp]);


  return (
    <div className="timer">
      
        {remainingTime > 0 ? `Time remaining: ${remainingTime} seconds` : ''}
      
    </div>
  );
};

export default Timer;

