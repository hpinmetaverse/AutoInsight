import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { History, HomeIcon,  Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";

const LeftSidebar = () => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col gap-3 p-3 bg-zinc-950 border-r border-zinc-800">
      {/* --- Main Menu --- */}
      <div className="rounded-xl p-3 bg-zinc-900 border border-zinc-800 shadow-sm">
        <div className="space-y-2">
          <Link
            to="/"
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: cn(
                  "w-full justify-start text-white hover:bg-zinc-800 transition-colors",
                  location.pathname === "/" && "bg-zinc-800"
                ),
              })
            )}
          >
            <HomeIcon className="mr-2 size-5" />
            <span className="hidden lg:inline font-medium">Home</span>
          </Link>
        </div>
      </div>

      {/* --- Chat Library --- */}
      <div className="flex-1 rounded-xl bg-zinc-900 p-3 border border-zinc-800 shadow-sm flex flex-col">
        {/* New Chat Header */}
        <div className="flex items-center justify-between px-2 py-2 mb-2 border border-zinc-800 rounded-lg text-white hover:bg-zinc-800 transition-colors">
          <span className="hidden lg:inline font-medium">New Chat</span>
          <Plus className="ml-2 size-5 cursor-pointer hover:text-blue-400 transition-colors" />
        </div>

        <SignedIn>
          <Link
            to="/chat"
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: cn(
                  "w-full justify-start text-white hover:bg-zinc-800 transition-colors mb-2",
                  location.pathname === "/chat" && "bg-zinc-800"
                ),
              })
            )}
          >
            <History className="mr-2 size-5" />
            <span className="hidden md:inline font-medium">History</span>
          </Link>
        </SignedIn>

      
      </div>
    </div>
  );
};

export default LeftSidebar;
