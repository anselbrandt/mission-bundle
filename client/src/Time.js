import React from 'react';

export default function Time(props) {
  const { time } = props;
  return (
    <React.Fragment>
      <div>{time ? `Server time: ${time}` : null}</div>
    </React.Fragment>
  );
}
