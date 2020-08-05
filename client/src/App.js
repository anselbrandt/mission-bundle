import React, { useState, useRef, useEffect } from 'react';
import styles from './App.module.css';
import io from 'socket.io-client';
import Map from './Map';
import { FlyToInterpolator, WebMercatorViewport } from 'react-map-gl';
import Time from './Time';
import Debug from './Debug';
import Console from './Console';
import ThreeD from './ThreeD';
import Tree from './Tree';
import useFetchLocation from './useFetchLocation';
import { multiPoint } from '@turf/helpers';
import bbox from '@turf/bbox';
import useGetViewport from './useGetViewport';

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
  const { width, height } = useGetViewport();
  const [input, setInput] = useState();
  const [history, setHistory] = useState([]);
  const [piData, setPiData] = useState([]);
  const [newData, setNewData] = useState();
  const [time, setTime] = useState();
  const [clients, setClients] = useState();
  const [viewState, setViewState] = useState(Montreal);
  const [zoomedViewport, setZoomedViewport] = useState();

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
      const locations = message
        .map(client => {
          return client.location;
        })
        .map(location => {
          return [location.lng, location.lat];
        });
      const points = multiPoint(locations);
      const bounding = bbox(points);
      const corners = [bounding.slice(0, 2), bounding.slice(2, 4)];
      const viewport = new WebMercatorViewport({
        width: width * 0.6,
        height: height * 0.4,
      }).fitBounds(corners, {
        padding: Math.min(width * 0.6, height * 0.4) * 0.25,
      });
      setViewState(viewport);
      setZoomedViewport(viewport);
    });
  }, [width, height]);

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
          width={width * 0.6}
          height={height * 0.4}
          viewState={viewState}
          onViewStateChange={handleChangeViewState}
          clients={clients}
        />
      </div>
      <div>
        <button onClick={() => handleFlyTo(Montreal)}>Montreal</button>
      </div>
      {zoomedViewport ? (
        <div>
          <button onClick={() => handleFlyTo(zoomedViewport)}>Zoom Out</button>
        </div>
      ) : null}
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
