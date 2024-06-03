/*============================================
    Display a range of times in 1 div by creating
    an array of positioned DOM elements
    ===========================================*/
// Function to add partial data to the colorData array
const encodeCellFraction = (
  colorData,
  color,
  timeInterger,
  positionleft,
  positionright,
  key
) => {
  const partialData = {
    id: key,
    style: {
      right: `${positionright}%`,
      left: `${positionleft}%`,
      backgroundColor: color,
    },
  };

  // Check if colorData array exists for the timeInterger
  if (Array.isArray(colorData[timeInterger])) {
    // If the array exists, push the number to the array
    colorData[timeInterger].push(partialData);
  } else {
    // If the array doesn't exist, create a new array with the number
    colorData[timeInterger] = [partialData];
  }
};

/*===============
    CELL RENDERER
    ===============*/

const encodeCells = (timeData, minuteinput) => {
  let hour = 0;
  let minute = 0;
  let partialDataKey = 0;
  const cellsData = [];
  const timeinterval = 1440 / minuteinput;

  if (minuteinput > 0) {
    //calculating background from colorData
    const colorData = Array(timeinterval).fill(null);
    for (let i = 0; i < timeData.length; i++) {
      let starttime = timeData[i].StartTime / minuteinput;
      let endtime = timeData[i].EndTime / minuteinput;
      const color = timeData[i].Color;

      //IF THE TIME PERIOD DOESN'T PERFECTLY FIT INTO THE CELL
      if (!Number.isInteger(starttime) || !Number.isInteger(endtime)) {
        let starttimePosition = 0;
        let endtimePosition = 100;
        let starttimeInterger = 0;
        let endtimeInterger = 0;

        //PULL THE DECIMAL OUT OF THE STARTTIME IF IT EXISTS
        if (!Number.isInteger(starttime)) {
          starttimeInterger = Math.floor(starttime);
          starttimePosition = (starttime - starttimeInterger) * 100;
          starttime = starttimeInterger + 1;
          //console.log(`the start decimal is ${starttimePosition}`);
        }
        //PULL THE DECIMAL OUT OF THE ENDTIME IF IT EXISTS
        if (!Number.isInteger(endtime)) {
          endtimeInterger = Math.floor(endtime);
          endtimePosition = Math.abs((endtime - endtimeInterger) * 100 - 100);
          endtime = endtimeInterger;
          //console.log(`the end decimal is ${endtimePosition}`);
        }

        // Check if the starttime and endtime fit within the same cell
        if (starttimeInterger === endtimeInterger) {
          // If so, add partial data to the colorData array with starttime position and right direction
          encodeCellFraction(
            colorData,
            color,
            starttimeInterger,
            starttimePosition,
            endtimePosition,
            partialDataKey++
          );
        } else {
          //IF THE STARTTIME DOESNT FIT TO THE CELL
          if (starttimePosition !== 0) {
            // Add partial data to the colorData array with starttime position and right direction
            encodeCellFraction(
              colorData,
              color,
              starttimeInterger,
              starttimePosition,
              0,
              partialDataKey++
            );
          }
          //IF THE ENDTIME DOESNT FIT TO THE CELL
          if (endtimePosition !== 1) {
            // Add partial data to the colorData array with endtime position and left direction
            encodeCellFraction(
              colorData,
              color,
              endtimeInterger,
              0,
              endtimePosition,
              partialDataKey++
            );
          }
        }
      }

      for (let j = starttime; j < endtime; j++) {
        colorData[j] = color;
      }
    }

    for (let i = 0; i < timeinterval; i++) {
      const innercolor = colorData[i];
      const hours = hour.toString().padStart(2, "0");
      const minutes = minute.toString().padStart(2, "0");

      const cellData = {
        id: i,
        className: "cell",
        time: `${hours}:${minutes}`,
        style: {
          backgroundColor:
            !Array.isArray(innercolor) && innercolor != null
              ? innercolor
              : null,
        },
        innerColor: Array.isArray(innercolor) ? innercolor : null,
        index: i,
      };

      // include partialData array if it exists
      if (Array.isArray(innercolor)) {
        cellData.partialData = innercolor.map((data) => ({
          className: "innercell",
          key: data.id,
          style: {
            right: data.style.right,
            left: data.style.left,
            backgroundColor: data.style.backgroundColor,
          },
        }));
      }

      cellsData.push(cellData);

      minute += +minuteinput;
      while (minute >= 60) {
        hour++;
        minute -= 60;
      }
    }
  }
  return cellsData;
};

export default encodeCells;
