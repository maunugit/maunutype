import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

const Timer = forwardRef(({ duration, onTimeUpdate, onTimeEnd }, ref) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [running, setRunning] = useState(false);

  const start = () => {
    setRunning(true);
  };

  const restart = () => {
    setElapsedTime(0);
    setRunning(false);
  };

  useImperativeHandle(ref, () => ({
    start,
    restart
  }));

  useEffect(() => {
    if (running && elapsedTime < duration) {
      const interval = setInterval(() => {
        const newElapsedTime = elapsedTime + 1;
        setElapsedTime(newElapsedTime);
        onTimeUpdate && onTimeUpdate(newElapsedTime);
        if (newElapsedTime === duration) {
          setRunning(false);
          onTimeEnd && onTimeEnd();
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    // If elapsed time exceeds the duration due to duration change
    if (elapsedTime >= duration) {
      setRunning(false);
      onTimeEnd && onTimeEnd();
    }
  }, [elapsedTime, running, duration]);

  // Restart the timer if the duration changes
  useEffect(() => {
    restart();
  }, [duration]);

  return <div>{duration - elapsedTime} seconds remaining</div>;
});


export default Timer;
