import React, { createContext, useState, useEffect } from "react";

export const ActiveCellsContext = createContext();

export const ActiveCellsProvider = ({
  children,
  minuteinput,
  setTargetTime,
  targetTime,
}) => {
  const [activeCells, setActiveCells] = useState({
    day: null,
    StartCell: null,
    EndCell: null,
  });
  const [activeTime, setActiveTime] = useState(null);

  const handleMouseDown = (e) => {
    const targetDay = e.target.getAttribute("data-day");
    const targetCellIndex = e.target.getAttribute("data-cell-index");
    if (targetDay && targetCellIndex) {
      e.preventDefault();
      setActiveCells({
        day: targetDay,
        StartCell: targetCellIndex,
        EndCell: targetCellIndex,
      });
    } else {
      setActiveCells({
        day: null,
        StartCell: null,
        EndCell: null,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1 && e) {
      // Get the element currently under the mouse pointer
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const targetDay = target.getAttribute("data-day");
      const targetCellIndex = target.getAttribute("data-cell-index");
      const mouseRolloutCheck = [
        "timeLabel",
        "cell-container",
        "groupContainer",
        "cellsGroup",
        "innercontainer",
      ];
      if (targetDay && targetCellIndex && targetDay === activeCells.day) {
        setActiveCells((prevState) => ({
          ...prevState,
          EndCell: targetCellIndex,
        }));
      } else if (
        !mouseRolloutCheck.some((className) =>
          target.classList.contains(className)
        )
      ) {
        console.log("TARGET: ", target);
        setActiveCells({
          day: null,
          StartCell: null,
          EndCell: null,
        });
      }
    }
    if (/^cell-\d+$/.test(e.target.id)) {
      if (e.target.dataset.time !== targetTime) {
        // Log the data-time attribute
        setTargetTime(e.target.dataset.time);
      }
    } else {
      setTargetTime(null);
    }
  };

  const handleMouseUp = () => {
    if (activeCells.day && activeCells.StartCell && activeCells.EndCell) {
      const startIndex = activeCells
        ? Math.min(activeCells.StartCell, activeCells.EndCell)
        : null;
      const endIndex =
        (activeCells
          ? Math.max(activeCells.StartCell, activeCells.EndCell)
          : null) + 1;
      const newActiveTime = {
        [activeCells.day]: [
          {
            StartTime: String(startIndex * minuteinput),
            EndTime: String(endIndex * minuteinput),
            Color: null,
          },
        ],
      };
      setActiveTime(newActiveTime);
      console.log("start: ", startIndex, ". End: ", endIndex);
    }
  };

  useEffect(() => {
    console.log("activetime: ", activeTime);
  }, [activeTime]);

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeCells]);

  return (
    <ActiveCellsContext.Provider value={{ activeCells, activeTime }}>
      {children}
    </ActiveCellsContext.Provider>
  );
};
