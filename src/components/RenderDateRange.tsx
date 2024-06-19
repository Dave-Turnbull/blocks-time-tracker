import { useContext, useState } from "react";
import SingleDay from "./SingleDay";
import { ToolbarContext } from "../contexts/ToolbarContext";
import { ActiveCellsContext } from "../contexts/SelectCellsContext";

export const RenderDateRange = () => {
  const { startDate, endDate } = useContext(ToolbarContext);
  const { cellsData } = useContext(ActiveCellsContext);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const renderedDays = [];
  console.log(cellsData)

  for (let key in cellsData) {
    renderedDays.push(
      <SingleDay
        dayToRender={key}
        singleDayData={cellsData[key]}
      />
    );
  }

  return <div className="cell-render-container">{renderedDays}</div>;
};
