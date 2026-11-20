import { SelectedCellsProvider } from "./contexts/SelectCellsContext";
import { Toolbar } from "./components/Toolbar";
import { ToolbarProvider } from "./contexts/ToolbarContext";
import { RenderDateRange } from "./components/RenderDateRange";
import { TaskPickerModal } from "./components/TaskPickerModal";

const App = () => {
  return (
    <div draggable={false} className="relative h-screen overflow-hidden flex flex-col bg-canvas text-fg">
      <ToolbarProvider>
        <SelectedCellsProvider>
          <main className="flex-1 min-h-0 p-2">
            <div className="h-full max-w-[1440px] mx-auto">
              <RenderDateRange />
            </div>
          </main>
          <TaskPickerModal />
        </SelectedCellsProvider>
        <Toolbar />
      </ToolbarProvider>
    </div>
  );
};

export default App;
