import "./App.css";
import { ActiveCellsProvider } from "./contexts/SelectCellsContext";
import { Toolbar } from "./components/Toolbar";
import { ToolbarProvider } from "./contexts/ToolbarContext";
import { RenderDateRange } from "./components/RenderDateRange";
import TaskList from "./components/TaskList";

//Main app
const App = () => {
  return (
    <div draggable="false">
      <ToolbarProvider>
        <ActiveCellsProvider>
          <RenderDateRange />
          <TaskList/>
        </ActiveCellsProvider>
        <Toolbar />
      </ToolbarProvider>
    </div>
  );
};

export default App;
