//import logo from "./logo.svg";
import "./App.css";

import React, { useState, useEffect } from "react";

//Main app
const App = () => {
  const [inputValue, setInputValue] = useState("");
  const [timeinterval, setTimeinterval] = useState("");
  const [minuteinput, setMinuteInput] = useState("");
  const [showntime, setShowntime] = useState("");
  const [isMouseDown, setisMouseDown] = useState(false);
  const colorPicker = document.getElementById("color-picker");

  const activeCells = { StartCell: 0, Endcell: 0 };

  /*===============
    EVENT HANDLERS
    ===============*/

  //When the input box changes
  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  //when clicking submit
  const handleSubmit = (event) => {
    //stop the default form submission function
    event.preventDefault();
    const minutesInADay = 1440;
    setTimeinterval(minutesInADay / inputValue);
    setMinuteInput(inputValue);
  };

  //When the mouse is lifted
  const handleMouseUp = () => {
    console.log("Mouse is up!");
    setisMouseDown(false);
  };

  //when mouse is lifted, add the event listener then remove it again
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  //when the mouse enters the cell
  const handleMouseEnter = (event) => {
    if (event.target.id === "cell") {
      console.log(event.target.key);
      setShowntime(event.target.dataset.time);
      if (isMouseDown == true) {
        event.target.style.backgroundColor = colorPicker.value;
      }
    }
  };

  //when the mouse leaves the cell
  const handleMouseLeave = (event) => {
    if (event.target.id === "cell") {
      setShowntime("");
    }
  };

  //when the mouse is clicked down
  const handleMouseDown = (event) => {
    console.log("Mouse is down!");
    setisMouseDown(true);
    if (event.target.id === "cell") {
      event.target.style.backgroundColor = colorPicker.value;
    }
  };

  /*===========
    TEST ARRAY
    ===========*/

  //array to test
  const timeData = [
    { StartTime: "348", EndTime: "600", Color: "#ff0000" },
    { StartTime: "960", EndTime: "1200", Color: "#00ff00" },
    { StartTime: "1200", EndTime: "1399", Color: "#0000ff" },
    { StartTime: "201", EndTime: "205", Color: "#ff63db" },
    { StartTime: "207", EndTime: "210", Color: "#ff98db" },
  ];

  /*===============
    CELL RENDERER
    ===============*/

  const renderCells = () => {
    let hour = 0;
    let minute = 0;
    let partialDataKey = 0;
    const cells = [];
    if (minuteinput != 0) {
      //calculating background from colorData
      let colorData = Array(timeinterval).fill(null);
      for (let i = 0; i < timeData.length; i++) {
        let starttime = timeData[i].StartTime / minuteinput;
        let endtime = timeData[i].EndTime / minuteinput;
        let color = timeData[i].Color;

        //IF THE TIME PERIOD DOESN'T PERFECTLY FIT INTO THE CELL
        if (!Number.isInteger(starttime) || !Number.isInteger(endtime)) {
          let starttimePosition = 0;
          let endtimePosition = 100;
          let starttimeInterger = 0;
          let endtimeInterger = 0;

          //PULL THE DECIMAL OUT OF THE STARTTIME IF IT EXISTS
          if (!Number.isInteger(starttime)) {
            starttimeInterger = Math.floor(starttime);
            starttimePosition = (starttime - starttimeInterger) * 100;
            starttime = starttimeInterger + 1;
            console.log(`the start decimal is ${starttimePosition}`);
          }
          //PULL THE DECIMAL OUT OF THE ENDTIME IF IT EXISTS
          if (!Number.isInteger(endtime)) {
            endtimeInterger = Math.floor(endtime);
            endtimePosition = Math.abs((endtime - endtimeInterger) * 100 - 100);
            endtime = endtimeInterger;
            console.log(`the end decimal is ${endtimePosition}`);
          }

          //ADD THE DATA TO THE ARRAY
          // Function to add partial data to the colorData array
          const addPartialData = (
            timeInterger,
            positionleft,
            positionright,
            key
          ) => {
            let partialData = (
              <div
                className="innercell"
                key={key}
                style={{
                  // direction can either be left or right, passed as an argument to the function
                  right: `${positionright}%`,
                  left: `${positionleft}%`,
                  backgroundColor: `${color}`,
                }}
              />
            );
            // Check if colorData array exists for the timeInterger
            if (Array.isArray(colorData[timeInterger])) {
              // If the array exists, push the number to the array
              colorData[timeInterger].push(partialData);
            } else {
              // If the array doesn't exist, create a new array with the number
              colorData[timeInterger] = [partialData];
            }
          };

          // Check if the starttime and endtime fit within the same cell
          if (starttimeInterger == endtimeInterger) {
            // If so, add partial data to the colorData array with starttime position and right direction
            addPartialData(
              starttimeInterger,
              starttimePosition,
              endtimePosition,
              partialDataKey++
            );
          } else {
            //IF THE STARTTIME DOESNT FIT TO THE CELL
            if (starttimePosition != 0) {
              // Add partial data to the colorData array with starttime position and right direction
              addPartialData(
                starttimeInterger,
                starttimePosition,
                0,
                partialDataKey++
              );
            }
            //IF THE ENDTIME DOESNT FIT TO THE CELL
            if (endtimePosition != 1) {
              // Add partial data to the colorData array with endtime position and left direction
              addPartialData(
                endtimeInterger,
                0,
                endtimePosition,
                partialDataKey++
              );
            }
          }
        }

        for (let j = starttime; j < endtime; j++) {
          colorData[j] = color;
        }
        console.log(colorData);
      }

      for (let i = 0; i < timeinterval; i++) {
        let minutes;
        let hours;
        let innercolor = colorData[i];
        hours = hour.toString().padStart(2, "0");
        minutes = minute.toString().padStart(2, "0");
        cells.push(
          <div
            id="cell"
            className="cell"
            data-time={`${hours}:${minutes}`}
            style={{
              backgroundColor:
                !Array.isArray(innercolor) && innercolor != null
                  ? innercolor
                  : null,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            key={i}
          >
            {(() => {
              if (Array.isArray(innercolor)) {
                return innercolor;
              }
            })()}
          </div>
        );
        minute += +minuteinput;
        if (minute >= 60) {
          hour++;
          minute -= 60;
        }
      }
    }
    return cells;
  };

  return (
    <div className="container">
      <div>
        <h1>Generate Cells</h1>
        <div className="cell-container">{renderCells()}</div>
      </div>
      <div>
        <h1>Minutes Calculator</h1>
        <form onSubmit={handleSubmit}>
          <input type="number" value={inputValue} onChange={handleChange} />
          <button type="submit">Submit</button>
          <p>Result: {timeinterval}</p>
        </form>
      </div>
      <p>Time: {showntime}</p>
      <input type="color" id="color-picker" />
    </div>
  );
};

export default App;
