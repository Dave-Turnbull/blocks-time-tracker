//goes through each day in dataToInput, adds it to newData, then replaces FullData with newData
export const updateData = (
    dataToInput,
    FullData,
    taskTitle,
    pickedColor,
    eraseTool
  ) => {
    const newData = [...FullData];

    for (const day in dataToInput) {
      const dayIndex = newData.findIndex(
        (dayData) => Object.keys(dayData)[0] === day
      );

      if (dayIndex !== -1) {
        let dayData = newData[dayIndex][day];

        dataToInput[day].forEach((newBlock) => {
          // Update color and title only if eraseTool is not active
          if (!eraseTool) {
            newBlock.Color = pickedColor;
            newBlock.Title = taskTitle;
          }

          dayData = dayData.reduce(
            (updatedDayData, existingBlock) => {
              if (
                newBlock.startTime > existingBlock.endTime ||
                newBlock.endTime < existingBlock.startTime
              ) {
                updatedDayData.push(existingBlock); // No overlap
              } else {
                // Overlap handling
                if (newBlock.startTime > existingBlock.startTime) {
                  updatedDayData.push({
                    ...existingBlock,
                    endTime: newBlock.startTime,
                  });
                }
                if (newBlock.endTime < existingBlock.endTime) {
                  updatedDayData.push({
                    ...existingBlock,
                    startTime: newBlock.endTime,
                  });
                }
              }
              return updatedDayData;
            },
            eraseTool ? [] : [newBlock]
          ); // Start with new block if not erasing

          // Sort the day data based on startTime
          dayData.sort((a, b) => a.startTime - b.startTime);
        });

        newData[dayIndex][day] = dayData;
      } else {
        if (!eraseTool) {
          const newDay = {
            [day]: dataToInput[day].map((timeBlock) => ({
              ...timeBlock,
              Color: pickedColor,
              Title: taskTitle,
            })),
          };
          newData.push(newDay);
        }
        // If eraseTool is active, do not add a new day
      }
    }

    return newData;
  };
