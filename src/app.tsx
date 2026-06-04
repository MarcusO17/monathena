import React, { useState } from 'react';
import { render } from 'ink';
import HomeScreen from './screens/HomeScreen.js';
import ExcelInputScreen from './screens/ExcelInputScreen.js';

function App() {
  const [screen, setScreen] = useState('home');

  if (screen === 'home') return <HomeScreen onNavigate={setScreen} />;
  if (screen === 'excel') return <ExcelInputScreen onNavigate={setScreen} />;

  // placeholder — replace with real screens later
  return <HomeScreen onNavigate={setScreen} />;
}

render(<App />);