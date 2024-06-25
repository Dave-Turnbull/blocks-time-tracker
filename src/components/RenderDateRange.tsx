import { useContext, useState } from "react";
import SingleDay from "./SingleDay";
import { ActiveCellsContext } from "../contexts/SelectCellsContext";
import styled from "styled-components";

export const RenderDateRange = () => {
  const { cellsData } = useContext(ActiveCellsContext);
  
  const renderedDays = [];

  for (let key in cellsData) {
    renderedDays.push(
      <SingleDay
        dayToRender={key}
        singleDayData={cellsData[key]}
      />
    );
  }

  return <CellsWrapper className="cell-render-container">{renderedDays}</CellsWrapper>;
};

const CellsWrapper = styled.div`
  height: 90vh;
  overflow: scroll;
`;