import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';

function App() {
  const { exit } = useApp();
  const [count, setCount] = useState(0);

  useInput((input, key) => {
    if (input === 'q') exit();
    if (key.upArrow)   setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">🎛  My First TUI</Text>
      <Text> </Text>
      <Text>Counter: <Text color="green">{count}</Text></Text>
      <Text dimColor>↑/↓ to change • q to quit</Text>
    </Box>
  );
}

render(<App />);