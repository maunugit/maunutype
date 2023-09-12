import React from 'react';
import WpmChart from './WpmChart';

const Results = ( {typingData}) => {

  return (
    <div>
      <h2>WPM visualized</h2>
      <WpmChart data={typingData} />
    </div>
  );
};

export default Results;
