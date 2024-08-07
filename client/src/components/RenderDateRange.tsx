import { useContext, useRef, useEffect, useState } from "react";
import SingleDay from "./SingleDay";
import { SelectedCellsContext } from "../contexts/SelectCellsContext";
import styled from "styled-components";
import TaskList from "./TaskList";
import { ToolbarContext } from "../contexts/ToolbarContext";

export const RenderDateRange = () => {
  const { cellsData, selectedCells } = useContext(SelectedCellsContext);
  const { minuteinput } = useContext(ToolbarContext);
  const [currentFocusedDay, setCurrentFocusedDay] = useState('')
  const cellsWrapperRef = useRef()
  const dayComponentRefArray = useRef([])

  useEffect(() => {
    if (!currentFocusedDay && cellsData) {
      setCurrentFocusedDay(Object.keys(cellsData)[0])
    }
    function updateScrollPosition(e) {
        console.log(e.target.scrollTop)
        const numbersArray = dayComponentRefArray.current.map((dayComponent) => dayComponent.getBoundingClientRect())
        const scrollPosition = e.target.scrollTop
        const focusedDay = dayComponentRefArray.current
          .map((dayComponent) => dayComponent)
          .find((dayElement) => dayElement.getBoundingClientRect().top < 20 && dayElement.getBoundingClientRect().top + dayElement.getBoundingClientRect().height > 20)
        if (focusedDay && focusedDay.dataset.date !== currentFocusedDay) {
          const focusedDate = focusedDay.dataset.date
          setCurrentFocusedDay(focusedDate)
        }
    }

    if (cellsWrapperRef && cellsWrapperRef.current) {
      cellsWrapperRef.current.addEventListener("scroll", updateScrollPosition, false);//this needs debouncing
    }
    return () => {
      if (cellsWrapperRef && cellsWrapperRef.current) {
        cellsWrapperRef.current.removeEventListener("scroll", updateScrollPosition, false);
      }
    };
  }, []);

  return (
    <CellAndTaskWrapper>
      <CellsWrapper className="cell-render-container" ref={cellsWrapperRef}>
        {Object.keys(cellsData).map((key, index) => {
          return (
            <div key={key} data-date={key} ref={(ref) => {dayComponentRefArray.current[index] = ref}}>
              <SingleDay
                dayToRender={key}
                singleDayData={cellsData[key]}
                selectedCells={selectedCells.day === key ? selectedCells : undefined}
                minuteinput={minuteinput}
              />
            </div>
          )
        })}
      </CellsWrapper>
      <TaskListWrapper>
        <TaskList singleDayDataOnScroll={currentFocusedDay}/>
      </TaskListWrapper>
    </CellAndTaskWrapper>
  );
};

const CellAndTaskWrapper = styled.div`
  position: relative;
  display: flex;
  margin: 0px;
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