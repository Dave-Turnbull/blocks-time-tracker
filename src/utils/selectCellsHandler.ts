export const getStartCell = (targetDay, targetCellIndex) => {
    if (targetDay && targetCellIndex) {
        return {
            day: targetDay,
            StartCell: targetCellIndex,
            EndCell: targetCellIndex,
        };
    }
};

export const getEndCell = (e) => {
    if (e.buttons === 1 && e) {
        // Get the element currently under the mouse pointer
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const targetDay = target.getAttribute("data-day");
        const targetCellIndex = target.getAttribute("data-cell-index");
        const mouseRolloutCheck = [
            "timeLabel",
            "cell-container",
            "groupContainer",
            "cellsGroup",
            "innercontainer",
        ];
        if (targetDay && targetCellIndex && targetDay === activeCells.day) {
            setActiveCells((prevState) => ({
                ...prevState,
                EndCell: targetCellIndex,
            }));
        } else if (
            !mouseRolloutCheck.some((className) =>
                target.classList.contains(className)
            )
        ) {
            console.log("TARGET: ", target);
            setActiveCells({
                day: null,
                StartCell: null,
                EndCell: null,
            });
        }
    }
    if (/^cell-\d+$/.test(e.target.id)) {
        if (e.target.dataset.time !== targetTime) {
            // Log the data-time attribute
            setTargetTime(e.target.dataset.time);
        }
    } else {
        setTargetTime(null);
    }
};

export const saveActiveCells = () => {
    if (activeCells.day && activeCells.StartCell && activeCells.EndCell) {
        //reset the active cells
        const startIndex = activeCells
            ? Math.min(activeCells.StartCell, activeCells.EndCell)
            : null;
        const endIndex =
            (activeCells
                ? Math.max(activeCells.StartCell, activeCells.EndCell)
                : null) + 1;
        //add the inputed time to the active time array
        const newActiveTime = {
            [activeCells.day]: [
                {
                    StartTime: (startIndex * minuteinput),
                    EndTime: (endIndex * minuteinput),
                    Color: null,
                },
            ],
        };
        setActiveTime(newActiveTime);
        console.log("start: ", startIndex, ". End: ", endIndex);
    }
};