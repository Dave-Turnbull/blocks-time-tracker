import { useContext } from "react";
import { ToolbarContext } from "../contexts/ToolbarContext";
import styled from "styled-components";

export const Toolbar = () => {
  const {
    inputValue,
    setInputValue,
    minuteinput,
    setMinuteInput,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickedColor,
    setPickedColor,
    eraseTool,
    setEraseTool,
    selectedTasks,
    tasks,
  } = useContext(ToolbarContext);

  /*===============
    EVENT HANDLERS
    ===============*/

  //When the input box changes
  const handleIntervalChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleIntervalSubmit = (event) => {
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

  const handleToggleEraseTool = () => {
    setEraseTool(!eraseTool);
  };

  return (
    <>
    <div className="tasks">
      {selectedTasks.tasks && selectedTasks.tasks.map((selectedTask) => {
        return `${selectedTasks.startTime} ${tasks[selectedTask.taskID].title}`
      })}
    </div>
    <ToolbarWrapper>
      {/* <p>Time: {targetTime}</p> */}
      <input
        type="color"
        value={pickedColor}
        onChange={(e) => setPickedColor(e.target.value)}
      />
      <p>Time per cell: </p>
      <form onSubmit={handleIntervalSubmit}>
        <input
          type="number"
          value={inputValue}
          onChange={handleIntervalChange}
        />
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
          {eraseTool ? "Disable Erase Tool" : "Enable Erase Tool"}
        </button>
      </div>
    </ToolbarWrapper>
    </>
  );
};

const ToolbarWrapper = styled.menu`
  position: relative;
  bottom: 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 0 1em;
  z-index: 100;
  height: 10vh;
`