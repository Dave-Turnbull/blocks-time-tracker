import { useContext, useState } from "react";
import SingleDay from "./SingleDay";
import { ActiveCellsContext } from "../contexts/SelectCellsContext";
import styled from "styled-components";
import TaskList from "./TaskList";

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

  return (
    <CellAndTaskWrapper>
      <CellsWrapper className="cell-render-container">
        {renderedDays}
      </CellsWrapper>
      <TaskListWrapper>
        <TaskList/>
      </TaskListWrapper>
    </CellAndTaskWrapper>
  );
};

const CellAndTaskWrapper = styled.div`
  position: relative;
  display: flex;
  margin: 10px;
  height: 100%;
  overflow: hidden;
  flex: 1;
`

const CellsWrapper = styled.div`
  height: 100%;
  overflow: auto;
  flex: 3;
`;

const TaskListWrapper = styled.div`
  flex: 1;
`