import { useContext } from "react"
import { SelectedCellsContext } from "../contexts/SelectCellsContext"
import { ToolbarContext } from "../contexts/ToolbarContext"
import { readableTime } from "../utils/utils"
import styled from "styled-components"

const TaskList = ({singleDayDataOnScroll}) => {
    const {mouseOverTasks, currentTimeData} = useContext(SelectedCellsContext)
    const {tasks} = useContext(ToolbarContext)

    return (
        <div>
            <h2>Tasks - {singleDayDataOnScroll}</h2>
            <StyledUl className="tasks">
            {mouseOverTasks.tasks && mouseOverTasks.tasks.map((mouseOverTask) => {
                const startTime = mouseOverTasks.startTime + mouseOverTask.startTime
                const endTime = mouseOverTasks.startTime + mouseOverTask.endTime
                return (
                    <li>
                        <p>{tasks[mouseOverTask.taskID].title}</p>
                        <p>{`${readableTime(startTime)} - ${readableTime(endTime)}`}</p>
                    </li>
                )
            })}
            </StyledUl>
            <StyledUl>
                {singleDayDataOnScroll && currentTimeData[singleDayDataOnScroll] && currentTimeData[singleDayDataOnScroll].map((time) => {
                    return (
                        <li>
                            <p>{tasks[time.taskID].title}</p>
                            <p>{`${readableTime(time.startTime)} - ${readableTime(time.endTime)}`}</p>
                        </li>
                    )
                })}
            </StyledUl>
        </div>
    )
}

const StyledUl = styled.ul`
    list-style: none;
    padding: 0;
`

export default TaskList