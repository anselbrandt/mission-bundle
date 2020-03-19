import React from 'react';
import styles from './App.module.css';

export default function Console(props) {
  return (
    <React.Fragment>
      <div className={styles.container}>
        <div className={styles.historyContainer}>
          <div className={styles.history}>
            {props.history
              ? props.history.map((value, index) => {
                  if (index === props.history.length - 1) {
                    return (
                      <div key={index} ref={props.logRef}>
                        {value}
                      </div>
                    );
                  } else return <div key={index}>{value}</div>;
                })
              : null}
          </div>
        </div>
        <div className={styles.row}>
          <form onSubmit={props.handleSubmit}>
            <input
              ref={props.inputRef}
              type="text"
              className={styles.textarea}
              placeholder={props.history.length > 0 ? '' : 'type message...'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={props.handleInput}
            ></input>
          </form>
          <button className={styles.button} onClick={props.handleSubmit}>
            →
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
