import "./App.css";
import { ActiveCellsProvider } from "./contexts/SelectCellsContext";
import { Toolbar } from "./components/Toolbar";
import { ToolbarProvider } from "./contexts/ToolbarContext";
import { RenderDateRange } from "./components/RenderDateRange";

//Main app
const App = () => {
  return (
    <div className="container" draggable="false">
      <ToolbarProvider>
        <ActiveCellsProvider>
          <RenderDateRange />
        </ActiveCellsProvider>
        <Toolbar />
      </ToolbarProvider>
    </div>
  );
};

export default App;
