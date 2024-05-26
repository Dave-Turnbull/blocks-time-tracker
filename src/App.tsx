import "./App.css";
import { useState, useEffect } from "react";
import SingleDay from "./components/SingleDay";
import { ActiveCellsProvider } from "./contexts/selectCellsContext";
import { Toolbar } from "./components/Toolbar";

//Main app
const App = () => {

  const [inputValue, setInputValue] = useState(15);
  const [minuteinput, setMinuteInput] = useState(15);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [pickedColor, setPickedColor] = useState("#000000");
  const [taskTitle, settaskTitle] = useState("");
  const [eraseTool, setEraseTool] = useState(false);

  const renderDateRange = (startDate, endDate) => {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let renderedDays = [];

    for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
      let dayToRender = day.toISOString().substring(0, 10);
      renderedDays.push(
        <SingleDay
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
      >
        {renderDateRange(startDate, endDate)}
      </ActiveCellsProvider>
      <Toolbar inputValue={inputValue} setInputValue={setInputValue} setMinuteInput={setMinuteInput} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} pickedColor={pickedColor} setPickedColor={setPickedColor} taskTitle={taskTitle} settaskTitle={settaskTitle} eraseTool={eraseTool} setEraseTool={setEraseTool}/>
    </div>
  );
};

export default App;
