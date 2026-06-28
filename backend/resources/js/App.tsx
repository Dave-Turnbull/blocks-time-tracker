import { SelectedCellsProvider } from "./contexts/SelectCellsContext";
import { Toolbar } from "./components/Toolbar";
import { ToolbarProvider } from "./contexts/ToolbarContext";
import { RenderDateRange } from "./components/RenderDateRange";
import { TaskPickerModal } from "./components/TaskPickerModal";

const App = () => {
  return (
    <div draggable={false} className="relative h-screen overflow-hidden flex flex-col justify-between bg-page">
      <ToolbarProvider>
        <SelectedCellsProvider>
          <RenderDateRange />
          <TaskPickerModal />
        </SelectedCellsProvider>
        <Toolbar />
      </ToolbarProvider>
    </div>
  );
};

export default App;
