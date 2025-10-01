import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";

const MainLayout = () => {
  const isMobile = false;
  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex flex-1 h-full overflow-hidden p-2"
      >
        {/*Left Sidebar */}
        <ResizablePanel
          defaultSize={isMobile ? 0 : 14}
          minSize={isMobile ? 0 : 14}
          maxSize={18}
        >
          <LeftSidebar />
        </ResizablePanel>
        <ResizableHandle className="transition-colors w-2 rounded-lg bg-black" />
        {/*Main Content */}
        <ResizablePanel defaultSize={isMobile ? 80 : 60}>
          <Outlet />
        </ResizablePanel>
        <ResizableHandle className="transition-colors w-2 rounded-lg bg-black" />
      </ResizablePanelGroup>
    </div>
  );
};

export default MainLayout;
