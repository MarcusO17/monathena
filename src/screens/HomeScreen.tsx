import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

const BANNER = `
                                                           
  ▄▄▄     ▄▄▄                                              
   ███▄ ▄███                     █▄ █▄                     
   ██ ▀█▀ ██         ▄          ▄██▄██          ▄          
   ██     ██   ▄███▄ ████▄ ▄▀▀█▄ ██ ████▄ ▄█▀█▄ ████▄ ▄▀▀█▄
   ██     ██   ██ ██ ██ ██ ▄█▀██ ██ ██ ██ ██▄█▀ ██ ██ ▄█▀██
 ▀██▀     ▀██▄▄▀███▀▄██ ▀█▄▀█▄██▄██▄██ ██▄▀█▄▄▄▄██ ▀█▄▀█▄██
                                                           
                                                           
`;

const MENU_ITEMS = [
    { label: 'Load Finances', screen: 'excel', description: 'Load them into my Excel Table', key: '1' },
    { label: 'Load Excel', screen: '', description: 'Import a .xlsx file', key: '2' },
    { label: 'Reports', screen: '', description: 'Generate & export reports', key: '3' },
    { label: 'Settings', screen: '', description: 'Configure preferences', key: '4' },
    { label: 'Quit', screen: '', description: 'Exit Monathena', key: 'q' },
];

interface Props {
    onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
    const { exit } = useApp();
    const [selected, setSelected] = useState(0);

    useInput((input, key) => {
        if (key.upArrow) setSelected(i => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
        if (key.downArrow) setSelected(i => (i + 1) % MENU_ITEMS.length);

        if (key.return) {
            const item = MENU_ITEMS[selected];
            if (item.key === 'q') exit();
            else onNavigate(item.screen);
        }

        // number shortcuts
        MENU_ITEMS.forEach((item, i) => {
            if (input === item.key && item.key !== 'q') onNavigate(item.label.toLowerCase().replace(' ', '-'));
            if (input === 'q') exit();
        });
    });

    return (
        <Box flexDirection="column" alignItems="center" paddingTop={1}>

            {/* Banner */}
            <Text color="cyan" bold>{BANNER}</Text>
            <Text color="gray">Finance Excel Accessor & Dashboarder</Text>
            <Text> </Text>

            {/* Menu */}
            <Box
                flexDirection="column"
                borderStyle="round"
                borderColor="cyan"
                paddingX={4}
                paddingY={1}
                width={52}
            >
                {MENU_ITEMS.map((item, i) => {
                    const isSelected = i === selected;
                    return (
                        <Box key={item.key} gap={2} paddingY={0}>
                            <Text color={isSelected ? 'cyan' : 'gray'}>
                                {isSelected ? '▶' : ' '}
                            </Text>
                            <Text bold={isSelected} color={isSelected ? 'white' : 'gray'}>
                                {item.label}
                            </Text>
                            <Text dimColor>{item.description}</Text>
                        </Box>
                    );
                })}
            </Box>

            {/* Footer */}
            <Text> </Text>
            <Text dimColor>↑↓ navigate   enter select   1-4 shortcut   q quit</Text>
        </Box>
    );
}