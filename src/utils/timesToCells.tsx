const timesToCells = (timesArray, timePerCell) => {
  const numberOfCells = 1440 / timePerCell;

  const cellsArray = Array.from({ length: numberOfCells }, (cell, index) => {
    return {
      id: index,
      className: "cell",
      time: `${1}:${1}`,
      style: {
        backgroundColor: null,
      },
      innerColor: null,
      index: index,
      partialData: [],
    };
  });
  timesArray.forEach((event) => {
    const startPositionInCell = event.StartTime / timePerCell;
    const endPositionInCell = event.EndTime / timePerCell;
    const startCell = Math.floor(startPositionInCell);
    const endCell = Math.floor(endPositionInCell);

    for (let i = startCell; i <= endCell; i++) {
      cellsArray[i].partialData.push({
        id: `startposition: ${startPositionInCell} endPosition: ${endPositionInCell} minutes${event.StartTime}, ${event.EndTime}`,
        style: {
          left: `${Math.max(0, startPositionInCell - i) * 100}%`,
          right: `${Math.max(0, i + 1 - endPositionInCell) * 100}%`,
          backgroundColor: event.Color,
        },
      });
    }
  });
  return cellsArray;
};

// // Function to add partial data to the colorData array
// const encodeCellFraction = (
//   colorData,
//   color,
//   timeInterger,
//   positionleft,
//   positionright,
//   key
// ) => {
//   const partialData = {
//     id: key,
//     style: {
//       right: `${positionright}%`,
//       left: `${positionleft}%`,
//       backgroundColor: color,
//     },
//   };

//   // Check if colorData array exists for the timeInterger
//   if (Array.isArray(colorData[timeInterger])) {
//     // If the array exists, push the number to the array
//     colorData[timeInterger].push(partialData);
//   } else {
//     // If the array doesn't exist, create a new array with the number
//     colorData[timeInterger] = [partialData];
//   }
// };

// function oldCellCalc(timesArray, timePerCell) {
//   let hour = 0;
//   let minute = 0;
//   let partialDataKey = 0;
//   const cellsData = [];
//   const numberOfCells = 1440 / timePerCell;

//   const cellsArray = Array(numberOfCells).fill(null);
//   if (timePerCell > 0) {
//     //calculating background from colorData
//     for (let i = 0; i < timesArray.length; i++) {
//       let starttime = timesArray[i].StartTime / timePerCell;
//       let endtime = timesArray[i].EndTime / timePerCell;
//       const color = timesArray[i].Color;

//       //IF THE TIME PERIOD DOESN'T PERFECTLY FIT INTO THE CELL
//       if (!Number.isInteger(starttime) || !Number.isInteger(endtime)) {
//         let starttimePosition = 0;
//         let endtimePosition = 100;
//         let starttimeInterger = 0;
//         let endtimeInterger = 0;

//         //PULL THE DECIMAL OUT OF THE STARTTIME IF IT EXISTS
//         if (!Number.isInteger(starttime)) {
//           starttimeInterger = Math.floor(starttime);
//           starttimePosition = (starttime - starttimeInterger) * 100;
//           starttime = starttimeInterger + 1;
//           //console.log(`the start decimal is ${starttimePosition}`);
//         }
//         //PULL THE DECIMAL OUT OF THE ENDTIME IF IT EXISTS
//         if (!Number.isInteger(endtime)) {
//           endtimeInterger = Math.floor(endtime);
//           endtimePosition = Math.abs((endtime - endtimeInterger) * 100 - 100);
//           endtime = endtimeInterger;
//           //console.log(`the end decimal is ${endtimePosition}`);
//         }

//         // Check if the starttime and endtime fit within the same cell
//         if (starttimeInterger === endtimeInterger) {
//           // If so, add partial data to the colorData array with starttime position and right direction
//           encodeCellFraction(
//             cellsArray,
//             color,
//             starttimeInterger,
//             starttimePosition,
//             endtimePosition,
//             partialDataKey++
//           );
//         } else {
//           //IF THE STARTTIME DOESNT FIT TO THE CELL
//           if (starttimePosition !== 0) {
//             // Add partial data to the colorData array with starttime position and right direction
//             encodeCellFraction(
//               cellsArray,
//               color,
//               starttimeInterger,
//               starttimePosition,
//               0,
//               partialDataKey++
//             );
//           }
//           //IF THE ENDTIME DOESNT FIT TO THE CELL
//           if (endtimePosition !== 1) {
//             // Add partial data to the colorData array with endtime position and left direction
//             encodeCellFraction(
//               cellsArray,
//               color,
//               endtimeInterger,
//               0,
//               endtimePosition,
//               partialDataKey++
//             );
//           }
//         }
//       }

//       for (let j = starttime; j < endtime; j++) {
//         cellsArray[j] = color;
//       }
//     }

//     for (let i = 0; i < numberOfCells; i++) {
//       const innercolor = cellsArray[i];
//       const hours = hour.toString().padStart(2, "0");
//       const minutes = minute.toString().padStart(2, "0");

//       const cellData = {
//         id: i,
//         className: "cell",
//         time: `${hours}:${minutes}`,
//         style: {
//           backgroundColor:
//             !Array.isArray(innercolor) && innercolor != null
//               ? innercolor
//               : null,
//         },
//         innerColor: Array.isArray(innercolor) ? innercolor : null,
//         index: i,
//       };

//       // include partialData array if it exists
//       if (Array.isArray(innercolor)) {
//         cellData.partialData = innercolor.map((data) => ({
//           className: "innercell",
//           key: data.id,
//           style: {
//             right: data.style.right,
//             left: data.style.left,
//             backgroundColor: data.style.backgroundColor,
//           },
//         }));
//       }

//       cellsData.push(cellData);

//       minute += +timePerCell;
//       while (minute >= 60) {
//         hour++;
//         minute -= 60;
//       }
//     }
//   }

//   return cellsData;
// }

export default timesToCells;
