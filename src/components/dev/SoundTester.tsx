import { useState } from 'react';
import { Button, Stack, Text, Slider, Switch, Group, Paper } from '@mantine/core';
import { useSound } from '../../hooks';

/**
 * Componente de teste para o hook useSound
 *
 * Permite testar todos os sons e controles do hook.
 * Este componente é apenas para desenvolvimento/debug.
 */
export function SoundTester() {
  const [volume, setVolume] = useState(0.5);
  const [enabled, setEnabled] = useState(true);

  const {
    playCorrect,
    playWrong,
    playCelebration,
    playClick,
    setVolume: setSoundVolume,
    setEnabled: setSoundEnabled,
  } = useSound({ volume, enabled });

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setSoundVolume(newVolume);
  };

  const handleEnabledToggle = (checked: boolean) => {
    setEnabled(checked);
    setSoundEnabled(checked);
  };

  return (
    <Paper p="xl" withBorder data-testid="sound-tester">
      <Stack gap="md">
        <Text size="xl" fw={700}>
          🔊 Sound Tester
        </Text>

        <Group grow>
          <Button
            onClick={playCorrect}
            color="green"
            size="lg"
            data-testid="test-correct-button"
          >
            ✅ Correct
          </Button>
          <Button
            onClick={playWrong}
            color="red"
            size="lg"
            data-testid="test-wrong-button"
          >
            ❌ Wrong
          </Button>
        </Group>

        <Group grow>
          <Button
            onClick={playCelebration}
            color="yellow"
            size="lg"
            data-testid="test-celebration-button"
          >
            🎉 Celebration
          </Button>
          <Button
            onClick={playClick}
            color="blue"
            size="lg"
            data-testid="test-click-button"
          >
            👆 Click
          </Button>
        </Group>

        <Stack gap="xs">
          <Group justify="space-between">
            <Text>Volume:</Text>
            <Text fw={700}>{Math.round(volume * 100)}%</Text>
          </Group>
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.1}
            marks={[
              { value: 0, label: '0%' },
              { value: 0.5, label: '50%' },
              { value: 1, label: '100%' },
            ]}
            data-testid="volume-slider"
          />
        </Stack>

        <Group justify="space-between">
          <Text>Enabled:</Text>
          <Switch
            checked={enabled}
            onChange={(event) => handleEnabledToggle(event.currentTarget.checked)}
            size="lg"
            data-testid="enabled-switch"
          />
        </Group>

        <Text size="xs" c="dimmed">
          ℹ️ Sons gerados sinteticamente via Web Audio API. Substitua por MP3 reais em src/assets/sounds/ para produção.
        </Text>
      </Stack>
    </Paper>
  );
}
