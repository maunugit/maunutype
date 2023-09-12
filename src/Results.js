import React from 'react';
import WpmChart from './WpmChart';

const Results = () => {
  const typingData = [
    { seconds: 1, wpm: 50 },
    { seconds: 2, wpm: 58 },
    { seconds: 3, wpm: 60 },
    { seconds: 4, wpm: 82 },
    // ... continue for the rest of the 15 seconds.
  ];

  return (
    <div>
      <h2>User Typing Results</h2>
      <WpmChart data={typingData} />
    </div>
  );
};

export default Results;
