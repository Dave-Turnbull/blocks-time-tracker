import { createContext, useState } from "react";

interface toolbarContextType {
  inputValue: number;
  setInputValue: React.Dispatch<React.SetStateAction<number>>;
  minuteinput: number;
  setMinuteInput: React.Dispatch<React.SetStateAction<number>>;
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  pickedColor: string;
  setPickedColor: React.Dispatch<React.SetStateAction<string>>;
  taskTitle: string;
  settaskTitle: React.Dispatch<React.SetStateAction<string>>;
  eraseTool: boolean;
  setEraseTool: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ToolbarContext = createContext<toolbarContextType | null>(null);

export const ToolbarProvider = ({ children }) => {
  const [inputValue, setInputValue] = useState(15);
  const [minuteinput, setMinuteInput] = useState(15);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [pickedColor, setPickedColor] = useState("#000000");
  const [taskTitle, settaskTitle] = useState("");
  const [eraseTool, setEraseTool] = useState(false);

  return (
    <ToolbarContext.Provider
      value={{
        inputValue,
        setInputValue,
        minuteinput,
        setMinuteInput,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        pickedColor,
        setPickedColor,
        taskTitle,
        settaskTitle,
        eraseTool,
        setEraseTool,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
};
