import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WpmChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        width={600}
        height={300}
        data={data}
        margin={{
          top: 5, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="seconds" label={{ value: 'Seconds', position: 'bottom' }} />
        <YAxis label={{ value: 'WPM', angle: -90, position: 'insideLeft' }} domain={[0, 120]} ticks={[0, 40, 80, 120]} />
        <Tooltip />
        <Line type="monotone" dataKey="wpm" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default WpmChart;
