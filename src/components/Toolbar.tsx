import { useContext } from "react";
import { ToolbarContext } from "../contexts/ToolbarContext";

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
    taskTitle,
    settaskTitle,
    eraseTool,
    setEraseTool,
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

  const handletaskTitleChange = (event) => {
    settaskTitle(event.target.value);
  };

  const handleToggleEraseTool = () => {
    setEraseTool(!eraseTool);
  };

  return (
    <div className="innercontainer toolbar">
      {/* <p>Time: {targetTime}</p> */}
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
    </div>
  );
};
