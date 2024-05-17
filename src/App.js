//import logo from "./logo.svg";
import "./App.css";

import React, { useState, useEffect } from "react";
import Day from "./components/dayrenderer";
import { ActiveCellsProvider } from "./components/mouseeventhandler";

//Main app
const App = () => {
  const [inputValue, setInputValue] = useState("15");
  const [minuteinput, setMinuteInput] = useState("15");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [pickedColor, setPickedColor] = useState("#000000");
  const [targetTime, setTargetTime] = useState(0);
  const [taskTitle, settaskTitle] = useState("");
  const [eraseTool, setEraseTool] = useState(false);

  /*===============
    EVENT HANDLERS
    ===============*/

  //When the input box changes
  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    let roundedValue = inputValue;

    // round to the nearest number that divides 1440 evenly
    if (inputValue > 1440) {
      roundedValue = 1440;
    } else if (1440 % inputValue !== 0) {
      // find the closest divisors
      let lowerDivisor = inputValue;
      let upperDivisor = inputValue;

      // find lower divisor
      while (1440 % --lowerDivisor !== 0) {}

      // find upper divisor
      while (1440 % ++upperDivisor !== 0) {}

      // choose the closest divisor
      roundedValue =
        inputValue - lowerDivisor < upperDivisor - inputValue
          ? lowerDivisor
          : upperDivisor;
    }
    setMinuteInput(roundedValue);
    setInputValue(roundedValue);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handletaskTitleChange = (event) => {
    settaskTitle(event.target.value);
  };

  const handleToggleEraseTool = () => {
    setEraseTool(!eraseTool);
  };

  const renderDateRange = (startDate, endDate) => {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let renderedDays = [];

    for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
      let dayToRender = day.toISOString().substring(0, 10);
      renderedDays.push(
        <Day
          key={dayToRender}
          dayToRender={dayToRender}
          pickedColor={pickedColor}
          taskTitle={taskTitle}
          minuteinput={minuteinput}
          eraseTool={eraseTool}
        />
      );
    }

    return <div>{renderedDays}</div>;
  };

  return (
    <div className="container" draggable="false">
      <ActiveCellsProvider
        minuteinput={minuteinput}
        setTargetTime={setTargetTime}
        targetTime={targetTime}
      >
        {renderDateRange(startDate, endDate)}
      </ActiveCellsProvider>
      <div className="innercontainer toolbar">
        <p>Time: {targetTime}</p>
        <input
          type="color"
          value={pickedColor}
          onChange={(e) => setPickedColor(e.target.value)}
        />
        <form>
          {/* ... other input fields ... */}
          <label>
            Task Title:
            <input
              type="text"
              value={taskTitle}
              onChange={handletaskTitleChange}
            />
          </label>
        </form>
        <p>Time per cell: </p>
        <form onSubmit={handleSubmit}>
          <input type="number" value={inputValue} onChange={handleChange} />
          <button type="submit">Submit</button>
        </form>
        <form>
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </label>
          <br></br>
          <label>
            End Date:
            <input type="date" value={endDate} onChange={handleEndDateChange} />
          </label>
        </form>
        <div>
          <button onClick={handleToggleEraseTool}>
                {eraseTool ? 'Disable Erase Tool' : 'Enable Erase Tool'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;
