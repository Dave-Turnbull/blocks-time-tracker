import styled, {keyframes} from "styled-components";

export const SelectedCellOverlay = ({pickedColor, groupPosition}) => {
  return (
    <Overlay
      className="overlay"
      draggable="false"
      groupPosition={groupPosition}
      pickedColor={pickedColor}
    />
  );
};

const overlayAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.09);
  }
  100% {
    transform: scale(1);
  }
`

const Overlay = styled.div<{groupPosition: string, pickedColor}>`
  pointer-events: none;
  z-index: 100;
  right: 0%;
  left: 0%;
  position: absolute;
  top: 0%;
  bottom: 0%;
  background-color: ${props => props.pickedColor};
  animation: ${overlayAnimation} 0.2s ease-in-out;
  border-radius: ${props => {
    switch (props.groupPosition) {
      case 'start':
        return '10px 0 0 10px';
      case 'end':
        return '0 10px 10px 0';
      default:
        return '0';
    }
  }};
`