import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import LeftSidebar from "./components/LeftSidebar";
import Chat  from "./components/Chat";

const MainLayout = () => {
  const isMobile = false;

  return (

    <div className="h-screen bg-black text-white flex flex-col">
 
      <ResizablePanelGroup
        direction="horizontal"
        className="flex flex-1 h-full overflow-hidden p-2"
      >
        {/* Left Sidebar */}
        <ResizablePanel
          defaultSize={isMobile ? 0 : 14}
          minSize={isMobile ? 0 : 14}
          maxSize={18}
        >
          <LeftSidebar />
        </ResizablePanel>

        <ResizableHandle className="transition-colors w-2 rounded-lg bg-black" />

        {/* Chat Panel */}
        <ResizablePanel
          defaultSize={isMobile ? 0 : 20} // adjust width
          minSize={isMobile ? 0 : 15}
      
        >
          <Chat />
        </ResizablePanel>

        <ResizableHandle className="transition-colors w-2 rounded-lg bg-black" />

       
      </ResizablePanelGroup>
    </div>
  );
};

export default MainLayout;
