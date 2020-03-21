import React, { useState, useRef, useEffect } from 'react';
import styles from './App.module.css';
import io from 'socket.io-client';
import Map from './Map';
import { FlyToInterpolator } from 'react-map-gl';
import Time from './Time';
import Debug from './Debug';
import Console from './Console';
import ThreeD from './ThreeD';
import Tree from './Tree';
import useFetchLocation from './useFetchLocation';

const Montreal = {
  longitude: -73.648657,
  latitude: 45.540269,
  zoom: 9,
  pitch: 0,
  bearing: 0,
};

const SOCKETSERVER =
  process.env.REACT_APP_SOCKETSERVER || 'wss://missioncontrol.herokuapp.com';
const socket = io(SOCKETSERVER);

function App() {
  const [input, setInput] = useState();
  const [history, setHistory] = useState([]);
  const [piData, setPiData] = useState([]);
  const [newData, setNewData] = useState();
  const [time, setTime] = useState();
  const [clients, setClients] = useState();
  const [viewState, setViewState] = useState(Montreal);
  const handleChangeViewState = ({ viewState }) => setViewState(viewState);
  const handleFlyTo = destination => {
    setViewState({
      ...viewState,
      ...destination,
      transitionDuration: 500,
      transitionInterpolator: new FlyToInterpolator(),
    });
  };
  const inputRef = useRef();
  const logRef = useRef();

  const { location } = useFetchLocation();

  useEffect(() => {
    if (socket.connected && location) {
      const identity = {
        client: 'webclient',
        id: socket.id,
        location: location,
      };
      socket.emit('identity', JSON.stringify(identity));
    }
  }, [location]);

  useEffect(() => {
    socket.on('pi message', data => {
      setHistory(currentHistory => [...currentHistory, `pi> ${data}`]);
    });
    socket.on('pi data', data => {
      setPiData(currentData => [...currentData, JSON.parse(data)]);
      setNewData(JSON.parse(data));
    });
    socket.on('time', timeString => {
      setTime(timeString);
    });
    socket.on('connected', data => {
      const message = JSON.parse(data);
      setClients(message);
    });
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, logRef]);

  const handleInput = event => setInput(event.currentTarget.value);
  const handleSubmit = event => {
    if (input) {
      socket.emit('web', input);
      event.preventDefault();
      setHistory([...history, input]);
      inputRef.current.value = '';
      setInput();
    }
    event.preventDefault();
  };

  return (
    <div className={styles.app}>
      <div>
        <Time time={time} />
      </div>
      <div>
        <Map
          width="60vw"
          height="40vh"
          viewState={viewState}
          onViewStateChange={handleChangeViewState}
          clients={clients}
        />
      </div>
      <div>
        <button onClick={() => handleFlyTo(Montreal)}>Montreal</button>
      </div>
      <div>
        <Debug clients={clients} />
      </div>
      <div>
        <Console
          history={history}
          logRef={logRef}
          inputRef={inputRef}
          handleSubmit={handleSubmit}
          handleInput={handleInput}
        />
      </div>
      <div>
        <ThreeD data={newData ? newData : null} />
      </div>
      <div className={styles.tree}>
        <div>Pi Data</div>
        <Tree data={newData ? newData : null} />
      </div>
    </div>
  );
}

export default App;
