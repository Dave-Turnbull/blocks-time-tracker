import React, { useState, useEffect } from "react";

const Day = ({ dayToRender, FullData, dayData, setShownTime, pickedColor }) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [activeCells, setActiveCells] = useState({ StartCell: 0, EndCell: 0 });
  const [cellsData, setCellsData] = useState([]);

  //When the mouse is lifted
  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseEnter = (event) => {
    if (event.target.id === "cell") {
      setShownTime(event.target.dataset.time);
      if (isMouseDown) {
        let endDivIndex = event.currentTarget.dataset.index;
        setActiveCells((prevState) => ({
          ...prevState,
          EndCell: endDivIndex,
        }));
      }
    }
  };

  const handleMouseLeave = (event) => {
    if (event.target.id === "cell") {
      setShownTime("");
    }
  };

  const handleMouseDown = (event) => {
    setIsMouseDown(true);
    if (event.target.id === "cell") {
      let startDivIndex = event.currentTarget.dataset.index;
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

  useEffect(() => {
    let foundData = FullData.find((day) => day.date === dayToRender);
    let timeData = foundData ? foundData.intervals : [];
    setCellsData(dayData(timeData));
  }, [dayToRender, FullData]);

  return (
    <div className="innercontainer" key={dayToRender}>
      <h1>{dayToRender}</h1>
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
    </div>
  );
};

export default Day;
