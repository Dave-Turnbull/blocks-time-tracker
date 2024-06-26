import "./App.css";
import { ActiveCellsProvider } from "./contexts/SelectCellsContext";
import { Toolbar } from "./components/Toolbar";
import { ToolbarProvider } from "./contexts/ToolbarContext";
import { RenderDateRange } from "./components/RenderDateRange";
import styled from "styled-components";

//Main app
const App = () => {
  return (
    <Main draggable="false">
      <ToolbarProvider>
        <ActiveCellsProvider>
          <RenderDateRange />
        </ActiveCellsProvider>
        <Toolbar />
      </ToolbarProvider>
    </Main>
  );
};

const Main = styled.div`
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

export default App;
