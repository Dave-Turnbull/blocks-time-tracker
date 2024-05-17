// src/uiSlice.js
//THIS ISNT IMPLEMENTED
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pickedColor: "#000000",
  targetTime: 0,
  // ... other states can be added as needed
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setPickedColor: (state, action) => {
      state.pickedColor = action.payload;
    },
    setTargetTime: (state, action) => {
      state.targetTime = action.payload;
    },
    // ... other reducers can be added as needed
  },
});

export const { setPickedColor, setTargetTime } = uiSlice.actions;

export default uiSlice.reducer;
