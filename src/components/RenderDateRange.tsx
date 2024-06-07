import { useContext, useState } from "react";
import SingleDay from "./SingleDay";
import { ToolbarContext } from "../contexts/ToolbarContext";
import timesheetData from "../test/timesheet.json";

export const RenderDateRange = () => {
  const { startDate, endDate } = useContext(ToolbarContext);
  const [FullData, setFullData] = useState(() => {
    const savedData = localStorage.getItem("timesheetData");
    return savedData ? JSON.parse(savedData) : timesheetData;
  });
  const start = new Date(startDate);
  const end = new Date(endDate);
  const renderedDays = [];

  for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
    const dayToRender = day.toISOString().substring(0, 10);
    renderedDays.push(
      <SingleDay
        dayToRender={dayToRender}
        singleDayData={FullData[dayToRender]}
      />
    );
  }

  return <div className="cell-render-container">{renderedDays}</div>;
};
