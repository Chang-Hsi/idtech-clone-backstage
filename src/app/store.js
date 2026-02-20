import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {
    app: (state = { ready: true }) => state,
  },
})
