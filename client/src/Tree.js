import React from 'react';
import styles from './Tree.module.css';

export default function Tree(props) {
  const { data, parent = [] } = props;

  return (
    <React.Fragment>
      {data ? (
        <ul>
          {Object.keys(data).map((key, index) => (
            <li key={index}>
              {key}:{' '}
              {typeof Object.values(data)[index] === 'object' ? (
                <Tree
                  data={Object.values(data)[index]}
                  parent={parent.length > 0 ? [...parent, key] : [key]}
                />
              ) : parent.length > 0 ? (
                <span className={styles.value}>
                  {Object.values(data)[index]}
                </span>
              ) : (
                <span className={styles.value}>
                  {Object.values(data)[index]}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </React.Fragment>
  );
}
