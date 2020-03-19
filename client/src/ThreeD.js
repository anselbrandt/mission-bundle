import React from 'react';

export default function ThreeD(props) {
  const { data } = props;
  return (
    <React.Fragment>
      {data ? (
        <React.Fragment>
          <div>Pitch: {data.fusionPose.x.toFixed(3)}</div>
          <div>Roll: {data.fusionPose.y.toFixed(3)}</div>
          <div>Yaw: {data.fusionPose.z.toFixed(3)}</div>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
}
