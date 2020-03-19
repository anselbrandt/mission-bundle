import React from 'react';

export default function Debug(props) {
  const { clients } = props;
  return (
    <React.Fragment>
      <div>{clients ? `Connected clients: ${clients.length}` : null}</div>
      <div>
        {clients
          ? clients.map(client => (
              <div key={client.id}>
                <div>
                  {client.name}: {client.ip}
                </div>
                {client.location ? (
                  <div>
                    lat: {client.location.lat} long: {client.location.lng}
                  </div>
                ) : null}
              </div>
            ))
          : null}
      </div>
    </React.Fragment>
  );
}
