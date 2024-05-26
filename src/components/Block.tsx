export const Block = ({ 
    index, 
    start, 
    cell, 
    dayToRender, 
    activeCells, 
    startIndex, 
    endIndex, 
    taskTitle, 
    eraseTool, 
    pickedColor 
}) => {

    return (
        <div
            id={`cell-${index + start}`}
            draggable="false"
            key={index + start}
            className={cell.className}
            style={cell.style}
            data-day={dayToRender}
            data-time={cell.time}
            data-cell-index={index + start}
        >
            {activeCells &&
                dayToRender === activeCells.day &&
                index + start >= startIndex &&
                index + start <= endIndex && (
                    <div
                        className="overlay"
                        draggable="false"
                        data-tasktitle={taskTitle}
                        style={{
                            zIndex: 100,
                            right: "0%",
                            left: "0%",
                            position: "absolute",
                            top: "0%",
                            bottom: "0%",
                            backgroundColor: eraseTool ? '#dedede' : pickedColor,
                        }}
                    />
                )}
            {cell.partialData && (
                <div className="partialDataContainer">
                    {cell.partialData.map((part) => (
                        <div
                            key={part.key}
                            className={part.className}
                            style={part.style}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const styles = {
    block: {

    }
}