import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

const Timer = forwardRef(({ duration, onTimeUpdate, onTimeEnd }, ref) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [running, setRunning] = useState(false);

  // This method starts the timer
  const start = () => {
    setRunning(true);
  };
  // This method restarts the timer
  const restart = () => {
    setElapsedTime(0);
    setRunning(false);
  };

  // Use useImperativeHandle to expose the start method to parent
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
          onTimeEnd && onTimeEnd();
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [elapsedTime, running]);

  return <div>{duration - elapsedTime} seconds remaining</div>;
});

export default Timer;
