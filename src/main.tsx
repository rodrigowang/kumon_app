import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import App from './App'
import { theme } from './theme/mantine'
import './theme/tokens.css'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-center" />
      <App />
    </MantineProvider>
  </React.StrictMode>
)
