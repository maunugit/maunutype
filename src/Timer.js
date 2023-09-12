import React, { useState, useEffect } from 'react';

function Timer({ duration, onTimeUpdate, onTimeEnd }) {
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (startTime !== null) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = Math.floor((now - startTime) / 1000); // Time difference in seconds
        setElapsedTime(timeDiff);

        if (onTimeUpdate) {
          onTimeUpdate(timeDiff);
        }

        if (timeDiff >= duration) {
          clearInterval(interval);
          if (onTimeEnd) {
            onTimeEnd();
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime]);

  const startTimer = () => {
    setStartTime(new Date());
  };

  return (
    <div>
      Time left: {duration - elapsedTime}s
      <button onClick={startTimer}>Start</button>
    </div>
  );
}

export default Timer;

