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
  const [activeCells, setActiveCells] = useState({ StartCell: 0, EndCell: 0 });
  const colorPicker = document.getElementById("color-picker");
  const cells = [];

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
    //console.log("Mouse is up!");
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
      //console.log(event.target.key);
      setShowntime(event.target.dataset.time);
      if (isMouseDown === true) {
        let endDivIndex = event.currentTarget.dataset.index;
        console.log("THE END KEY IS " + endDivIndex);
        setActiveCells((prevState) => ({
          ...prevState,
          EndCell: endDivIndex,
        }));
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
    //console.log("Mouse is down!");
    setisMouseDown(true);
    if (event.target.id === "cell") {
      let startDivIndex = event.currentTarget.dataset.index;
      console.log("THE START KEY IS " + startDivIndex);
      setActiveCells((prevState) => ({
        ...prevState,
        StartCell: startDivIndex,
        EndCell: startDivIndex,
      }));
    }
  };

  useEffect(() => {
    console.log(activeCells);
  }, [activeCells]);

  /*===========
    TEST ARRAY
    ===========*/

  //array to test
  const FullData = [
    {
      date: "2023-08-01",
      intervals: [
        { StartTime: "348", EndTime: "600", Color: "#ff0000" },
        { StartTime: "960", EndTime: "1200", Color: "#00ff00" },
        { StartTime: "1200", EndTime: "1399", Color: "#0000ff" },
      ],
    },
    {
      date: "2023-08-02",
      intervals: [
        { StartTime: "101", EndTime: "205", Color: "#ff63db" },
        { StartTime: "207", EndTime: "210", Color: "#ff98db" },
        { StartTime: "420", EndTime: "600", Color: "#ffff00" },
      ],
    },
    {
      date: "2023-08-03",
      intervals: [
        { StartTime: "600", EndTime: "900", Color: "#ff00ff" },
        { StartTime: "1200", EndTime: "1440", Color: "#0000ff" },
        { StartTime: "800", EndTime: "950", Color: "#000000" },
      ],
    },
  ];

  // Date you want to find data for
  let findDate = "2023-08-01";

  // Find the data for a specific date
  let foundData = FullData.find((day) => day.date === findDate);

  let timeData = foundData.intervals;

  /*============================================
    Display a range of times in 1 div by creating
    an array of positioned DOM elements
    ===========================================*/
  // Function to add partial data to the colorData array
  const addPartialData = (
    colorData,
    color,
    timeInterger,
    positionleft,
    positionright,
    key
  ) => {
    let partialData = {
      id: key,
      style: {
        right: `${positionright}%`,
        left: `${positionleft}%`,
        backgroundColor: color,
      },
    };

    // Check if colorData array exists for the timeInterger
    if (Array.isArray(colorData[timeInterger])) {
      // If the array exists, push the number to the array
      colorData[timeInterger].push(partialData);
    } else {
      // If the array doesn't exist, create a new array with the number
      colorData[timeInterger] = [partialData];
    }
  };

  /*===============
    CELL RENDERER
    ===============*/

  const renderDay = () => {
    let hour = 0;
    let minute = 0;
    let partialDataKey = 0;
    let cellsData = [];

    if (minuteinput !== 0) {
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
            //console.log(`the start decimal is ${starttimePosition}`);
          }
          //PULL THE DECIMAL OUT OF THE ENDTIME IF IT EXISTS
          if (!Number.isInteger(endtime)) {
            endtimeInterger = Math.floor(endtime);
            endtimePosition = Math.abs((endtime - endtimeInterger) * 100 - 100);
            endtime = endtimeInterger;
            //console.log(`the end decimal is ${endtimePosition}`);
          }

          // Check if the starttime and endtime fit within the same cell
          if (starttimeInterger === endtimeInterger) {
            // If so, add partial data to the colorData array with starttime position and right direction
            addPartialData(
              colorData,
              color,
              starttimeInterger,
              starttimePosition,
              endtimePosition,
              partialDataKey++
            );
          } else {
            //IF THE STARTTIME DOESNT FIT TO THE CELL
            if (starttimePosition !== 0) {
              // Add partial data to the colorData array with starttime position and right direction
              addPartialData(
                colorData,
                color,
                starttimeInterger,
                starttimePosition,
                0,
                partialDataKey++
              );
            }
            //IF THE ENDTIME DOESNT FIT TO THE CELL
            if (endtimePosition !== 1) {
              // Add partial data to the colorData array with endtime position and left direction
              addPartialData(
                colorData,
                color,
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
      }

      for (let i = 0; i < timeinterval; i++) {
        let minutes;
        let hours;
        let innercolor = colorData[i];
        hours = hour.toString().padStart(2, "0");
        minutes = minute.toString().padStart(2, "0");

        let cellData = {
          id: i,
          className: "cell",
          time: `${hours}:${minutes}`,
          style: {
            backgroundColor:
              !Array.isArray(innercolor) && innercolor != null
                ? innercolor
                : null,
          },
          innerColor: Array.isArray(innercolor) ? innercolor : null,
          index: i,
        };

        // include partialData array if it exists
        if (Array.isArray(innercolor)) {
          cellData.partialData = innercolor.map((data) => ({
            className: "innercell",
            key: data.id,
            style: {
              right: data.style.right,
              left: data.style.left,
              backgroundColor: data.style.backgroundColor,
            },
          }));
        }

        cellsData.push(cellData);

        minute += +minuteinput;
        while (minute >= 60) {
          hour++;
          minute -= 60;
        }
      }
    }
    return cellsData;
  };

  const cellsData = renderDay();

  return (
    <div className="container">
      <div className="innercontainer">
        <h1>Tuesday</h1>
        <div className="cell-container">
          {cellsData.map((cell, index) => (
            <div
              id="cell"
              key={index}
              className={cell.className}
              style={cell.style}
              data-index={cell.index}
              data-time={cell.time}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseDown={handleMouseDown}
            >
              {cell.partialData &&
                cell.partialData.map((part) => (
                  <div
                    key={part.key}
                    className={part.className}
                    style={part.style}
                  />
                ))}
            </div>
          ))}
        </div>

        <p>Time: {showntime}</p>
        <input type="color" id="color-picker" />
      </div>
      <div className="innercontainer">
        <h3>Block Interval</h3>
        <form onSubmit={handleSubmit}>
          <input type="number" value={inputValue} onChange={handleChange} />
          <button type="submit">Submit</button>
          <p>Result: {timeinterval}</p>
        </form>
      </div>
    </div>
  );
};

export default App;
