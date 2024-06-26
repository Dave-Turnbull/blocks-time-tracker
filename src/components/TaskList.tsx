import { useContext } from "react"
import { ActiveCellsContext } from "../contexts/SelectCellsContext"
import { ToolbarContext } from "../contexts/ToolbarContext"

const TaskList = () => {
    const {mouseOverTasks} = useContext(ActiveCellsContext)
    const {tasks} = useContext(ToolbarContext)

    return (
        <div>
            <h2>Tasks</h2>
            <ul className="tasks">
            {mouseOverTasks.tasks && mouseOverTasks.tasks.map((mouseOverTask) => {
                return <li>{`${mouseOverTask.startTime} ${tasks[mouseOverTask.taskID].title}`}</li>
            })}
            </ul>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo saepe sunt tempore, iure sequi tempora. Maxime sint harum delectus, officiis doloremque rerum ut totam vero enim voluptas explicabo. Explicabo, quo!</p>
        </div>
    )
}

export default TaskList