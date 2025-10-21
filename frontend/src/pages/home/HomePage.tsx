import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">hi</h1>
          </div>
    <Button>

 
          <Link to={"/num"}
            className={cn(
            
            )}>
              <span className="hidden md:inline">Num</span>
          </Link>
          </Button>
      </ScrollArea>
    </main>
  );
};
export default HomePage;


