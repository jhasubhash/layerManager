import React from 'react';
import './App.css';
import {Overlay} from './Overlay';

function App() {
  return (
    <div className="App">
      <canvas id="canvas"></canvas>
      <Overlay/>
    </div>
  );
}

export default App;
