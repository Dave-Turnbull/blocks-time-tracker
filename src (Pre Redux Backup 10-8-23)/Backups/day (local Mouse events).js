import React, { useState, useEffect, useRef } from "react";

const Day = ({ dayToRender, FullData, dayData, setShownTime, pickedColor }) => {
  const isMouseDown = useRef(false);
  const [activeCells, setActiveCells] = useState({
    StartCell: null,
    EndCell: null,
  });
  const [cellsData, setCellsData] = useState([]);

  //When the mouse is lifted
  const handleMouseUp = () => {
    isMouseDown.current = false;
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (event) => {
    isMouseDown.current = true;
    if (event.target.id === "cell") {
      let startDivIndex = Number(event.currentTarget.dataset.index);
      setActiveCells({
        StartCell: startDivIndex,
        EndCell: startDivIndex,
      });
    }
  };

  const handleMouseEnter = (event) => {
    if (event.target.id === "cell") {
      if (isMouseDown.current) {
        let endDivIndex = Number(event.currentTarget.dataset.index);
        console.log(endDivIndex);
        setActiveCells((prevState) => ({
          ...prevState,
          EndCell: endDivIndex,
        }));
      }
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

  //ensure that startIndex is the lowest number and endIndex is highest
  const startIndex = Math.min(activeCells.StartCell, activeCells.EndCell);
  const endIndex = Math.max(activeCells.StartCell, activeCells.EndCell);

  return (
    <div className="innercontainer">
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
            onMouseOver={handleMouseEnter}
            onMouseDown={handleMouseDown}
          >
            {index >= startIndex && index <= endIndex && (
              <div
                className="overlay"
                style={{
                  zIndex: 100,
                  right: "0%",
                  left: "0%",
                  position: "absolute",
                  top: "0%",
                  bottom: "0%",
                  backgroundColor: pickedColor,
                }}
              />
            )}
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
