const timesToCells = (timesArray, timePerCell, numOfMinutes = 1440) => {
  const numberOfCells = numOfMinutes / timePerCell;

  const cellsArray = Array.from({ length: numberOfCells }, () => []);
  if (timesArray) {
    timesArray.forEach((event) => {
      const startPositionInCell = event.startTime / timePerCell;
      const endPositionInCell = event.endTime / timePerCell;
      const startCell = Math.floor(startPositionInCell);
      const endCell = Math.ceil(endPositionInCell) - 1;

      for (let i = startCell; i <= endCell; i++) {
        cellsArray[i].push({
          id: `${startPositionInCell - startCell} ${
            endPositionInCell - endCell
          }`,
          taskID: event.taskID,
          style: {
            left: `${Math.max(0, startPositionInCell - i) * 100}%`,
            right: `${Math.max(0, i + 1 - endPositionInCell) * 100}%`,
          },
        });
      }
    });
  }
  return cellsArray;
};

export default timesToCells;
