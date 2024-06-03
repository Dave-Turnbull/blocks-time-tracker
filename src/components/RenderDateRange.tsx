import { useContext } from "react";
import SingleDay from "./SingleDay";
import { ToolbarContext } from "../contexts/ToolbarContext";

export const RenderDateRange = () => {
  const { startDate, endDate } = useContext(ToolbarContext);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const renderedDays = [];

  for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
    const dayToRender = day.toISOString().substring(0, 10);
    renderedDays.push(<SingleDay dayToRender={dayToRender} />);
  }

  return <div>{renderedDays}</div>;
};
