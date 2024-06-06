export const SelectedCellOverlay = (pickedColor) => {
  return (
    <div
      className="overlay"
      draggable="false"
      style={{
        zIndex: 100,
        right: "0%",
        left: "0%",
        position: "absolute",
        top: "0%",
        bottom: "0%",
        backgroundColor: pickedColor.pickedColor,
      }}
    />
  );
};
