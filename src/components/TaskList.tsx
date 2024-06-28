import { useContext } from "react"
import { ActiveCellsContext } from "../contexts/SelectCellsContext"
import { ToolbarContext } from "../contexts/ToolbarContext"
import { readableTime } from "../utils/utils"

const TaskList = ({singleDayDataOnScroll}) => {
    const {mouseOverTasks, currentTimeData} = useContext(ActiveCellsContext)
    const {tasks} = useContext(ToolbarContext)
    console.log(currentTimeData)

    return (
        <div>
            <h2>Tasks - {singleDayDataOnScroll}</h2>
            <ul className="tasks">
            {mouseOverTasks.tasks && mouseOverTasks.tasks.map((mouseOverTask) => {
                return <li>{`${mouseOverTask.startTime} ${tasks[mouseOverTask.taskID].title}`}</li>
            })}
            </ul>
            <ul>
                {singleDayDataOnScroll && currentTimeData[singleDayDataOnScroll] && currentTimeData[singleDayDataOnScroll].map((time) => {
                    return (
                        <li>
                            <p>{tasks[time.taskID].title}</p>
                            <p>{`${readableTime(time.startTime)} - ${readableTime(time.endTime)}`}</p>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default TaskList