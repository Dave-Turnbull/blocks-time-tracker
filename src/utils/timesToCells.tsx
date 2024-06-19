
interface TaskTime {
  startTime: number;
  endTime: number;
  taskID: string;
}

class cellObject {
  tasks: Array<TaskTime>
  startTime:number
  numOfMinutes:number
  constructor(startTime, numOfMinutes) {
    this.tasks = []
    this.startTime = startTime
    this.numOfMinutes = numOfMinutes
  }
  newTaskTime = (task: TaskTime) => {
    this.tasks.push(task)
  }
  getCellProps = (task, backgroundColor) => {
    return {
      id: `${task.startTime}`,
      taskID: task.taskID,
      style: {
        left: `${(task.startTime / this.numOfMinutes) * 100}%`,
        right: `${(1 - (task.endTime / this.numOfMinutes)) * 100}%`,//this may need changing
        backgroundColor: backgroundColor
      }
    }
  }
}

const timesToCells = (timesArray, timePerCell, numOfMinutes = 1440) => {
  const numberOfCells = numOfMinutes / timePerCell;

  const cellsArray = Array.from({ length: numberOfCells }, (_, index) => new cellObject(index * timePerCell, timePerCell));
  if (timesArray) {
    timesArray.forEach((event) => {
      const startPositionInCell = event.startTime / timePerCell;
      const endPositionInCell = event.endTime / timePerCell;
      const startCell = Math.floor(startPositionInCell);
      const endCell = Math.ceil(endPositionInCell) - 1;
      for (let i = startCell; i <= endCell; i++) {
        cellsArray[i].newTaskTime({
          startTime: Math.max(0, (event.startTime - cellsArray[i].startTime)),
          endTime: Math.min(timePerCell, (event.endTime - cellsArray[i].startTime)),
          taskID: event.taskID
        })
      }
    });
  }
  return cellsArray;
};
export default timesToCells;
