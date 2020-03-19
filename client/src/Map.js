import React, { useState } from 'react';
import MapGL from 'react-map-gl';
import { DeckGL, ScatterplotLayer } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './Map.module.css';

export default function Map({
  width,
  height,
  viewState,
  onViewStateChange,
  clients,
}) {
  let layers = [];
  const [hoveredObject, setHoveredObject] = useState();

  const Tooltip = props => {
    const { object } = props;
    return object ? (
      <div
        className={styles.tooltip}
        style={{
          left: object.x,
          top: object.y,
        }}
      >
        <div>{object.name}</div>
        <div>{object.ip}</div>
      </div>
    ) : null;
  };

  if (clients) {
    const data = clients
      .filter(client => client.location)
      .map(client => {
        return {
          name: client.name,
          ip: client.ip,
          position: [client.location.lng, client.location.lat],
        };
      });
    layers = [
      new ScatterplotLayer({
        id: 'scatterplot-layer',
        data,
        pickable: true,
        opacity: 0.8,
        stroked: false,
        filled: true,
        radiusScale: 100,
        radiusMinPixels: 10,
        radiusMaxPixels: 10,
        lineWidthMinPixels: 0,
        getPosition: d => d.position,
        getRadius: 10,
        getFillColor: d => [255, 99, 71],
        getLineColor: d => [0, 0, 0],
        autoHighlight: true,
        onHover: ({ object, x, y }) => {
          if (object) {
            setHoveredObject({
              name: object.name,
              ip: object.ip,
              x: x,
              y: y,
            });
          } else {
            setHoveredObject();
          }
        },
      }),
    ];
  }
  return (
    <MapGL
      width={width}
      height={height}
      viewState={viewState}
      onViewStateChange={onViewStateChange}
    >
      <DeckGL viewState={viewState} layers={layers}>
        <Tooltip object={hoveredObject} />
      </DeckGL>
    </MapGL>
  );
}
