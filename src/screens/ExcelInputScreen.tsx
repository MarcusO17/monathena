import React from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function ExcelInputScreen({ onNavigate }: Props) {
  useInput((input, key) => {
    if (key.escape) onNavigate('home');
  });


  return (
    <Box flexDirection="column" padding={2}>
      <Text bold color="cyan">Excel Form</Text>
      <Text dimColor>Press ESC to go back</Text>
    </Box>
  )
}